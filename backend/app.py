from flask import Flask, request, Response, send_file, jsonify, send_from_directory
print("STARTING APP V4 with logging fixes")
from flask_cors import CORS
import pandas as pd
import requests
import re
import time
import json
import os
from datetime import datetime
from werkzeug.utils import secure_filename
from pypdf import PdfReader

app = Flask(__name__)

# Enable CORS for React frontend
CORS(app, resources={
    r"/upload": {"origins": "*"},
    r"/process/*": {"origins": "*"},
    r"/download/*": {"origins": "*"},
    r"/upload": {"origins": "*"},
    r"/process/*": {"origins": "*"},
    r"/download/*": {"origins": "*"},
    r"/clusters": {"origins": "*"},
    r"/api/*": {"origins": "*"}
})

# Configure static folder for React frontend
# Detect environment and set static folder accordingly
# Local: running from backend/ directory -> ../frontend/dist
# EC2/Gunicorn: running from /opt/cas-lookup/ -> frontend/dist
current_dir = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(current_dir) == 'backend':
    app.static_folder = os.path.abspath(os.path.join(current_dir, '../frontend/dist'))
else:
    app.static_folder = os.path.abspath(os.path.join(current_dir, 'frontend/dist'))

print(f"🔧 Static folder configured: {app.static_folder}")
print(f"🔍 Static folder exists: {os.path.exists(app.static_folder)}")

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create folders if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Database Configuration
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cas_database.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# S3 Configuration
app.config['S3_BUCKET'] = os.environ.get('S3_VALIDATION_BUCKET', '')
app.config['USE_S3'] = bool(app.config['S3_BUCKET'])  # Use S3 if bucket name is set

# Initialize S3 client if configured
s3_client = None
if app.config['USE_S3']:
    import boto3
    s3_client = boto3.client('s3')
    print(f"✅ S3 configured: {app.config['S3_BUCKET']}")
else:
    print("⚠️  S3 not configured, using local storage")

from models import db, MaterialData, MaterialParameter, EnrichmentRule, NodeAnnotation
db.init_app(app)

with app.app_context():
    db.create_all()
    # Migration hack: Add purity_rules column if it doesn't exist
    try:
        from sqlalchemy import text
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE enrichment_rule ADD COLUMN purity_rules TEXT DEFAULT '[]'"))
            conn.commit()
            print("✅ Added purity_rules column to EnrichmentRule")
    except Exception as e:
        # Expected if column already exists
        pass

# ==========================================
# CAS LOOKUP LOGIC
# ==========================================
CAS_API_KEY = "XBr7txDIgp8FNY3ziNqaqRFiTShZBdb3V3GN3QAb"

def hyper_clean_chemical(text):
    if not isinstance(text, str) or text.strip().lower() in ['nan', '']:
        return ""

    t = text.strip().upper()
    t = re.sub(r'^[A-Z0-9]{1,3}\s*-\s*([A-Z]\s*-)?', '', t)
    t = re.sub(r'\(.*?\)', '', t)
    t = re.sub(r'\d+(\.\d+)?\s*(-|\/)?\s*(\d+(\.\d+)?)?\s*%', '', t)
    t = re.split(r'[,/]', t)[0].strip()

    noise_words = [
        'BULK', 'ANHYDROUS', 'NON-GMO', 'COATED', 'GRANULAR', 'LIQUID', 'POWDER', 'PURE',
        'SOURCE', 'HEAVY', 'PERF', 'TECH', 'TECHNICAL', 'BP', 'USP', 'FCC', 'GRADE',
        'MESH', 'EXTRACT', 'OIL', 'PEPTIDE', 'GEL', 'BUTTER', 'WAX', 'MONOHYDRATE',
        'DIHYDRATE', 'CRYSTALLINE', 'PHARMA', 'BG', 'LQ', 'WD', 'CH', 'JP', 'FR', 'EP',
        'KOSHER', 'NON-KOSHER', 'COGNIS', 'DRUM', 'ESTER', 'SOLUTION'
    ]
    for word in noise_words:
        t = re.sub(r'\b' + word + r'\b', '', t)

    words = t.split()
    cleaned_words = []
    for w in words:
        if any(c.isdigit() for c in w) and len(w) >= 3:
            continue
        if len(w) == 1 and len(cleaned_words) > 0:
            continue
        cleaned_words.append(w)

    t = " ".join(cleaned_words).strip()
    return t.strip('*-., ').strip()

class CASClient:
    def __init__(self, key):
        self.key = key
        self.headers = {'x-api-key': key, 'User-Agent': 'Mozilla/5.0'}

    def search_and_detail(self, query):
        if not query or len(query) < 3: 
            return None, None
        try:
            res = requests.get("https://commonchemistry.cas.org/api/search",
                               params={'q': query}, headers=self.headers, timeout=10)
            if res.status_code == 200 and res.json().get('count', 0) > 0:
                rn = res.json()['results'][0]['rn']
                time.sleep(1.1)
                det = requests.get("https://commonchemistry.cas.org/api/detail",
                                   params={'cas_rn': rn}, headers=self.headers, timeout=10)
                syns = "|".join(det.json().get('synonyms', [])[:10]) if det.status_code == 200 else "N/A"
                return rn, syns
        except:
            pass
        return None, None

def is_likely_inci(name):
    """
    Heuristic to identify INCI names from synonyms.
    INCI names are typically all uppercase or title case with specific patterns.
    """
    if not name or len(name) > 60 or len(name) < 3:
        return False
    
    # Skip CAS number patterns
    if re.match(r'^\d+-\d+-\d+$', name):
        return False
    
    # Skip very generic terms
    generic_terms = ['EXTRACT', 'OIL', 'POWDER', 'LIQUID', 'SOLUTION', 'MIXTURE']
    if name.upper().strip() in generic_terms:
        return False
    
    # INCI names often have these patterns
    name_upper = name.upper()
    
    # Check for common INCI suffixes
    inci_suffixes = [
        'ACID', 'OXIDE', 'EXTRACT', 'OIL', 'BUTTER', 'WAX', 'GLYCOL',
        'ALCOHOL', 'ESTER', 'SULFATE', 'CHLORIDE', 'NITRATE', 'PHOSPHATE',
        'CARBONATE', 'HYDROXIDE', 'PEROXIDE', 'BENZOATE', 'PALMITATE',
        'STEARATE', 'OLEATE', 'ACETATE', 'CITRATE'
    ]
    
    # Check if mostly uppercase (INCI standard)
    uppercase_ratio = sum(1 for c in name if c.isupper()) / len(name.replace(' ', '').replace('-', ''))
    if uppercase_ratio > 0.7:
        # Check for INCI suffix patterns
        for suffix in inci_suffixes:
            if name_upper.endswith(suffix):
                return True
    
    return False

def extract_inci_from_synonyms(synonyms_string):
    """
    Extract INCI name from existing CAS API synonyms.
    """
    if not synonyms_string or synonyms_string == "N/A":
        return "N/A"
    
    # Split synonyms by pipe delimiter
    synonyms = synonyms_string.split('|')
    
    # Look for INCI-like names
    for syn in synonyms:
        syn = syn.strip()
        if is_likely_inci(syn):
            return syn
    
    return "N/A"

def lookup_inci_from_pubchem(cas_number):
    """
    Lookup INCI name from PubChem using CAS number.
    """
    if not cas_number or cas_number == "NOT FOUND":
        return "N/A"
    
    try:
        # Clean CAS number (remove any spaces)
        cas_clean = cas_number.strip()
        
        # Search PubChem by CAS number
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{cas_clean}/synonyms/JSON"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            synonyms = data.get('InformationList', {}).get('Information', [{}])[0].get('Synonym', [])
            
            # Look for INCI-like names
            for syn in synonyms[:50]:  # Check first 50 synonyms
                if is_likely_inci(syn):
                    return syn
        
        # If no INCI found in PubChem, return N/A
        return "N/A"
        
    except Exception as e:
        return "N/A"

from llm_helper import BedrockCleaner

def extract_pdf_text(file_path):
    """Extract text from PDF file using PyPDF2"""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

def process_row(row, idx, total, client, bedrock_cleaner=None):
    """Process a single row and yield logs + result"""
    desc = str(row.get('Item description', ''))
    sub = str(row.get('Sub-Category', ''))
    commodity = str(row.get('Commodity', ''))

    yield {"type": "log", "message": f"Processing Row {idx+1}/{total}: {desc}..."}

    trials = [(desc, "Raw Desc"), (sub, "Raw Sub"),
              (hyper_clean_chemical(desc), "Clean Desc"),
              (hyper_clean_chemical(sub), "Clean Sub")]

    # Add smart variations
    variations = []
    for term, label in trials:
        if isinstance(term, str):
            if 'POLYGLYCEROL' in term.upper():
                variations.append((term.upper().replace('POLYGLYCEROL', 'POLYGLYCERYL'), label + " (Var)"))
            if 'ESTER' in term.upper():
                variations.append((re.sub(r'\bESTER\b', '', term.upper()).strip(), label + " (No Ester)"))

    if variations:
        trials.extend(variations)

    cas, syns, best_term = None, "N/A", hyper_clean_chemical(desc)
    enrichment_applied = False  # Track if enrichment was applied


    # Check for Enrichment Rules matching Sub-Category
    # Using app.app_context() because this is a generator
    rule = None
    with app.app_context():
        rule = EnrichmentRule.query.filter_by(sub_category=sub).first()
    
    if rule and bedrock_cleaner:
        yield {"type": "log", "message": f"✨ Applying Enrichment Rule for '{sub}'..."}
        print(f"✨ Applying Enrichment Rule for '{sub}'...")
        yield {"type": "log", "message": f"🔍 DEBUG: Rule found - Identifier: {rule.identifier_name}, Params: {rule.parameters}"}
        print(f"🔍 DEBUG: Rule found - Identifier: {rule.identifier_name}, Params: {rule.parameters}")
        try:
            params = json.loads(rule.parameters)
            yield {"type": "log", "message": f"🔍 DEBUG: Calling extract_parameters with desc='{desc}'"}
            print(f"🔍 DEBUG: Calling extract_parameters with desc='{desc}'")
            extracted_data = bedrock_cleaner.extract_parameters(desc, rule.identifier_name, params)
            
            yield {"type": "log", "message": f"🔍 DEBUG: Extracted data: {extracted_data}"}
            print(f"🔍 DEBUG: Extracted data: {extracted_data}")
            
            if extracted_data:
                # Format: materialname_identifiername_identifiervalue_param1name_param1value_...
                # Example: glycerine_cas_56-81-5_purity_80%_grade_nonpharma
                
                # Start with material name (cleaned and lowercase)
                material_name = hyper_clean_chemical(desc).lower().replace(' ', '').replace('-', '')
                parts = [material_name]
                
                yield {"type": "log", "message": f"🔍 DEBUG: Material name: {material_name}"}
                print(f"🔍 DEBUG: Material name: {material_name}")
                
                # Add Identifier name and value
                identifier_val = extracted_data.get(rule.identifier_name, "N/A")
                if identifier_val != "N/A":
                    parts.append(rule.identifier_name.lower())  # e.g., "cas"
                    parts.append(identifier_val)  # e.g., "56-81-5"
                
                # Add Parameters (name_value pairs)
                for p_name in params:
                    p_val = extracted_data.get(p_name, "N/A")
                    if p_val != "N/A":
                        parts.append(p_name.lower())  # e.g., "purity"
                        parts.append(p_val)  # e.g., "80%"
                
                # Update best_term to become the Enriched Description
                best_term = "_".join(parts)
                enrichment_applied = True  # Mark that enrichment was applied
                yield {"type": "log", "message": f"✅ Generated Enriched Desc: {best_term}"}
                print(f"✅ Generated Enriched Desc: {best_term}")
                
                # Also try to use identifier as CAS if it looks like one
                if "CAS" in rule.identifier_name.upper() and identifier_val != "N/A":
                     cas = identifier_val
                     yield {"type": "log", "message": f"ℹ️ Using extracted Identifier as CAS: {cas}"}
                     print(f"ℹ️ Using extracted Identifier as CAS: {cas}")
            
        except Exception as e:
            print(f"Enrichment Error: {e}")
            pass
    elif rule and not bedrock_cleaner:
        yield {"type": "log", "message": f"⚠️ Enrichment rule found for '{sub}' but Bedrock is not available"}
        print(f"⚠️ Enrichment rule found for '{sub}' but Bedrock is not available")
    elif not rule:
        yield {"type": "log", "message": f"ℹ️ No enrichment rule found for sub-category '{sub}'"}
        print(f"ℹ️ No enrichment rule found for sub-category '{sub}'")

    for term, label in trials:
        if not term or term.upper() in ['EXTRACT', 'OIL', 'NAN']: 
            continue
        
        # yield {"type": "log", "message": f"Trying: {term} ({label})..."} 
        
        cas, syns = client.search_and_detail(term)
        if cas:
            # Only overwrite best_term if enrichment wasn't applied
            if not enrichment_applied:
                best_term = f"{term} ({label})"
            yield {"type": "log", "message": f"✅ Found CAS: {cas} for '{term}'"}
            break
        time.sleep(1.1)
    
    # LLM Fallback (if enabled and no CAS found)
    llm_inci = None
    if not cas and bedrock_cleaner:
        yield {"type": "log", "message": f"⚠️ CAS not found. Asking AI..."}
        try:
            # Challenge 1: Smart Cleaning
            llm_term = bedrock_cleaner.smart_clean(desc)
            if llm_term and llm_term.upper() != hyper_clean_chemical(desc):
                yield {"type": "log", "message": f"AI suggest cleaning: {llm_term}"}
                cas, syns = client.search_and_detail(llm_term)
                if cas:
                    best_term = f"{llm_term} (AI Clean)"
                    yield {"type": "log", "message": f"✅ Found CAS via AI Clean: {cas}"}
                time.sleep(1.1)
            
            # Challenge 2: Direct Knowledge Lookup (if still not found)
            if not cas:
                yield {"type": "log", "message": f"Checking AI Knowledge Base..."}
                details = bedrock_cleaner.get_chemical_details(desc)
                if details:
                    s_cas = details.get('cas')
                    s_inci = details.get('inci')
                    
                    if s_cas and s_cas != "NOT FOUND":
                        # Verify with API
                        verify_cas, _ = client.search_and_detail(s_cas)
                        if verify_cas:
                            cas = verify_cas
                            # syns might be missing if search_and_detail returns only RN
                            # We should fetch Details ideally. 
                            # But CasClient.search_and_detail returns (rn, syns).
                            # If verified, we are good.
                            if not enrichment_applied:
                                best_term = f"{desc} (AI Verified)"
                            yield {"type": "log", "message": f"✅ AI Identified & Verified: {cas}"}
                        else:
                            # Use unverified CAS
                            cas = f"{s_cas} (LLM)"
                            best_term = f"{desc} (AI Knowledge)"
                            yield {"type": "log", "message": f"⚠️ AI Identified (Unverified): {s_cas}"}
                    
                    if s_inci and s_inci != "NOT FOUND":
                        llm_inci = s_inci
                        yield {"type": "log", "message": f"ℹ️ AI Found INCI: {s_inci}"}

        except Exception as e:
            print(f"LLM Error: {e}")
            pass

    # INCI Lookup
    inci_name = "N/A"
    
    if llm_inci:
        inci_name = f"{llm_inci} (AI)"
        
    if inci_name == "N/A" and cas and "NOT FOUND" not in str(cas):
        yield {"type": "log", "message": f"Looking up INCI for CAS {cas}..."}
        # Clean CAS for lookup (remove comments like "(LLM)")
        clean_cas = str(cas).split('(')[0].strip()
        
        # First try to extract INCI from existing CAS synonyms
        inci_name = extract_inci_from_synonyms(syns)
        
        # If not found in CAS synonyms, try PubChem
        if inci_name == "N/A":
            time.sleep(0.5)  # Small delay for PubChem rate limiting
            yield {"type": "log", "message": f"Querying PubChem for INCI..."}
            inci_name = lookup_inci_from_pubchem(clean_cas)

    # Final enriched description formatting
    # If we have a CAS number and an enrichment rule, regenerate the enriched description
    final_enriched_desc = best_term
    extracted_params_result = {} # To hold final parameters for DB

    if cas and cas != "NOT FOUND":
        # Check if there's an enrichment rule for this sub-category
        with app.app_context():
            rule = EnrichmentRule.query.filter_by(sub_category=sub).first()
            if rule:
                try:
                    material_name = hyper_clean_chemical(desc).lower().replace(' ', '').replace('-', '')
                    parts = [material_name]
                    
                    # Add CAS
                    parts.append(rule.identifier_name.lower())
                    parts.append(str(cas).split('(')[0].strip())  # Clean CAS
                    
                    # Try to extract parameters from description if Bedrock is available
                    if bedrock_cleaner:
                        try:
                            params = json.loads(rule.parameters)
                            # Re-extract or reuse? We didn't save previous extraction easily. Re-extracting for now.
                            # Ideally we should have passed it through.
                            extracted_params = bedrock_cleaner.extract_parameters(desc, rule.identifier_name, params)
                            if extracted_params:
                                for p_name in params:
                                    p_val = extracted_params.get(p_name, "N/A")
                                    if p_val != "N/A":
                                        parts.append(p_name.lower())
                                        parts.append(p_val)
                                        extracted_params_result[p_name] = p_val
                        except Exception as e:
                            print(f"Bedrock parameter extraction failed (will use CAS only): {e}")
                    
                    final_enriched_desc = "_".join(parts)
                    print(f"🔄 Final enriched description: {final_enriched_desc}")
                except Exception as e:
                    print(f"Final enrichment error: {e}")

    result_data = {
        'row_number': idx + 1,
        'total': total,
        'commodity': commodity,
        'sub_category': sub,
        'item_description': desc,
        'enriched_description': final_enriched_desc,
        'final_search_term': best_term,
        'cas_number': cas if cas else "NOT FOUND",
        'synonyms': syns if syns else "N/A",
        'inci_name': inci_name,
        'confidence_score': 70 if cas else 0, # Default to 70% if found
        'validation_status': 'Pending',
        'extracted_parameters': extracted_params_result
    }
    yield {"type": "result", "data": result_data}

# ==========================================
# ROUTES
# ==========================================



@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return json.dumps({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return json.dumps({'error': 'No file selected'}), 400
    
    allowed_extensions = {'.csv', '.xlsx', '.xls'}
    if file and any(file.filename.endswith(ext) for ext in allowed_extensions):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return json.dumps({'success': True, 'filename': filename})
    
    return json.dumps({'error': 'Invalid file type. Please upload a CSV or Excel file.'}), 400

@app.route('/process/<filename>')
def process_file(filename):
    def generate():
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        try:
            if filename.lower().endswith(('.xlsx', '.xls')):
                df = pd.read_excel(filepath)
            else:
                df = pd.read_csv(filepath, on_bad_lines='skip', encoding='utf-8')
            client = CASClient(CAS_API_KEY)
            
            # CLEAR DATABASE for Single Session Persistence
            with app.app_context():
                try:
                    db.session.query(MaterialParameter).delete()
                    db.session.query(MaterialData).delete()
                    db.session.commit()
                    print("🗑️ Database cleared for new session.")
                except Exception as e:
                    print(f"Error clearing database: {e}")

            try:
                bedrock_cleaner = BedrockCleaner()
            except Exception as e:
                print(f"Bedrock Init Failed: {e}")
                bedrock_cleaner = None
            
            results = []
            total = len(df)
            
            # Send initial message
            yield f"data: {json.dumps({'type': 'start', 'total': total})}\n\n"
            
            for idx, row in df.iterrows():
                # Stream logs and result from process_row generator
                for event in process_row(row, idx, total, client, bedrock_cleaner):
                    if event['type'] == 'log':
                        yield f"data: {json.dumps(event)}\n\n"
                    elif event['type'] == 'result':
                        result = event['data']
                        results.append(result)
                        yield f"data: {json.dumps({'type': 'row', 'data': result})}\n\n"
                        
                        # Save to Database
                        with app.app_context():
                            try:
                                # Create MaterialData
                                material_entry = MaterialData(
                                    filename=filename,
                                    row_number=result['row_number'],
                                    commodity=result['commodity'],
                                    sub_category=result['sub_category'],
                                    item_description=result['item_description'],
                                    brand=row.get('Item used for Brand(s)', 'N/A'),
                                    item_code=str(row.get('Item code', 'N/A')),
                                    plant=row.get('Factory/Country', 'N/A'),
                                    cluster=row.get('Cluster', 'N/A'),
                                    enriched_description=result['enriched_description'],
                                    final_search_term=result['final_search_term'],
                                    cas_number=result['cas_number'],
                                    inci_name=result['inci_name'],
                                    synonyms=result['synonyms']
                                )
                                db.session.add(material_entry)
                                db.session.flush() # Get ID
                                
                                params_to_save = result.get('extracted_parameters', {}).copy()
                                
                                for k, v in params_to_save.items():
                                    param_entry = MaterialParameter(
                                        material_id=material_entry.id,
                                        name=k,
                                        value=v
                                    )
                                    db.session.add(param_entry)
                                    
                                db.session.commit()
                            except Exception as db_err:
                                print(f"Database Error: {db_err}")
            
            # Save output file
            output_df = pd.DataFrame([{
                'Commodity': r['commodity'],
                'Sub-Category': r['sub_category'],
                'Item description': r['item_description'],
                'Enriched Description': r['enriched_description'],
                'Final Search Term': r['final_search_term'],
                'CAS Number': r['cas_number'],
                'INCI Name': r['inci_name'],
                'Synonyms': r['synonyms'],
                'Parameters': json.dumps(params_to_save) # Add parameters column
            } for r in results])
            
            output_filename = f"output_{filename}"
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
            output_df.to_csv(output_path, index=False)
            
            # Send completion message
            found_count = sum(1 for r in results if r['cas_number'] != 'NOT FOUND')
            yield f"data: {json.dumps({'type': 'complete', 'total': total, 'found': found_count, 'output_file': output_filename})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

@app.route('/download/<filename>')
def download_file(filename):
    filepath = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    return send_file(filepath, as_attachment=True)


@app.route('/api/subcategories')
def get_subcategories():
    try:
        # Get unique subcategories
        subs = db.session.query(MaterialData.sub_category).distinct().order_by(MaterialData.sub_category).all()
        # Filter out None/Null/Empty
        subs_list = [s[0] for s in subs if s[0]]
        return jsonify(subs_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clusters')
def clusters():
    try:
        subcategory = request.args.get('subcategory')
        data = build_db_hierarchy(subcategory)
        data = build_db_hierarchy(subcategory)
        resp = jsonify(data)
        resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        resp.headers['Pragma'] = 'no-cache'
        return resp
    except Exception as e:
        print(f"Cluster Error: {e}")
        return jsonify({"error": str(e)}), 500

def build_db_hierarchy(filter_subcategory=None):
    # Fetch all data with specs
    query = MaterialData.query
    if filter_subcategory and filter_subcategory != 'All':
        query = query.filter_by(sub_category=filter_subcategory)
        
    materials = query.all()
    
    # Cache for rules by subcategory
    # structure: { sub_category: { 'order': [...], 'purity': [...] } }
    rules_cache = {}
    
    # Pre-fetch all annotations to avoid N+1 queries
    # Map: (type, identifier) -> {'has_info': bool, 'has_qa': bool, 'has_open_qa': bool}
    annotations_map = {}
    try:
        all_anns = NodeAnnotation.query.all()
        for ann in all_anns:
            key = (ann.node_type, ann.node_identifier)
            if key not in annotations_map:
                annotations_map[key] = {'has_info': False, 'has_qa': False, 'has_open_qa': False}
            
            if ann.annotation_type == 'info':
                annotations_map[key]['has_info'] = True
            elif ann.annotation_type == 'qa':
                annotations_map[key]['has_qa'] = True
                if ann.is_open:
                    annotations_map[key]['has_open_qa'] = True
    except Exception as e:
        print(f"Error fetching annotations: {e}")

    root = {"name": f"Material Clusters - {filter_subcategory or 'All'}", "children": []}
    
    # Helper to find or create a child node
    def find_or_create(parent, name, node_type=None, node_identifier=None):
        for child in parent['children']:
            if child['name'] == name:
                return child
        
        # New Node
        new_node = {"name": name, "children": []}
        
        # Attach annotation status if applicable
        if node_type and node_identifier:
            key = (node_type, node_identifier)
            if key in annotations_map:
                new_node['annotations'] = annotations_map[key]
                
        parent['children'].append(new_node)
        return new_node

    for mat in materials:
        # Pre-process parameters into dict (Case Insensitive Keys)
        mat_params = {p.name.strip().lower(): p.value for p in mat.parameters}
        
        mat_subcat = mat.sub_category or "Uncategorized"

        
        # Resolve Rules (Order & Purity) from Cache or DB
        if mat_subcat not in rules_cache:
            rule = EnrichmentRule.query.filter_by(sub_category=mat_subcat).first()
            
            # Defaults
            r_order = ['Grade', 'Purity', 'Color']
            r_purity = []
            
            if rule:
                if rule.parameters:
                    try:
                        parsed = json.loads(rule.parameters)
                        if parsed: r_order = parsed
                    except: pass
                if rule.purity_rules:
                    try:
                        parsed = json.loads(rule.purity_rules)
                        if parsed: r_purity = parsed
                    except: pass
            
            rules_cache[mat_subcat] = {'order': r_order, 'purity': r_purity}
            
        current_config = rules_cache[mat_subcat]
        param_order = current_config['order']
        purity_rules = current_config['purity']
        
        
        # 1. Brand
        brand_name = mat.brand if mat.brand and mat.brand != 'nan' else "Unknown Brand"
        brand_node = find_or_create(root, brand_name, node_type='brand', node_identifier=brand_name)
        
        # 2. CAS
        cas_name = mat.cas_number if mat.cas_number and mat.cas_number != 'NOT FOUND' else "No CAS"
        cas_node = find_or_create(brand_node, f"CAS: {cas_name}")
        
        # Current node pointer for variable depth
        current_node = cas_node
        
        # Dynamic Parameters Levels
        for p_name in param_order:
            # Case insensitive lookup
            val = mat_params.get(p_name.strip().lower(), 'N/A')
            if not val:
                pass
            
            if val and val not in ["N/A", "Unspecified", "nan"]:
                # Check for "Unspecified Grade" legacy
                if "Unspecified" in val: continue
                
                # SPECIAL HANDLING FOR PURITY Grouping
                if p_name.strip().lower() == 'purity' and purity_rules:
                    grouped_val = apply_purity_rules(val, purity_rules)
                    # Create grouped node
                    current_node = find_or_create(current_node, f"{p_name}: {grouped_val}")
                    # Then create raw value node underneath
                    current_node = find_or_create(current_node, f"{p_name}: {val}")
                else:
                    current_node = find_or_create(current_node, f"{p_name}: {val}")
            
        # Material (Leaf)
        find_or_create(current_node, mat.item_description, node_type='material', node_identifier=str(mat.id)) # Use ID for material uniqueness if possible, or name
    
    return root



@app.route('/api/results')
def get_results():
    try:
        results = MaterialData.query.order_by(MaterialData.row_number).all()
        return jsonify([r.to_dict() for r in results])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/results/<int:row_id>', methods=['PUT'])
def update_result(row_id):
    """Update a result row with manual edits"""
    try:
        # Query by id (primary key), not row_number
        row = MaterialData.query.get(row_id)
        if not row:
            return jsonify({"error": "Row not found"}), 404
        
        data = request.json
        
        # Update allowed fields
        if 'enriched_description' in data:
            row.enriched_description = data['enriched_description']
        if 'cas_number' in data:
            row.cas_number = data['cas_number']
        if 'inci_name' in data:
            row.inci_name = data['inci_name']
        if 'synonyms' in data:
            row.synonyms = data['synonyms']
        
        db.session.commit()
        return jsonify(row.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/clusters/update', methods=['PUT'])
def update_clusters():
    """
    Batch update endpoint for editing and moving nodes (DB Version)
    """
    try:
        request_data = request.get_json()
        changes = request_data.get('changes', [])
        
        if not changes:
            return jsonify({"error": "No changes provided"}), 400
            
        applied_count = 0
        
        for change in changes:
            change_type = change.get('type')
            
            if change_type == 'move':
                # Drag layout: Moving 'name' (Material) to 'target_path' or similar context
                # Frontend needs to send us enough info to identify the material and the new parent attributes.
                
                material_name = change.get('name')
                brand = change.get('brand')

                # We need to find the material in DB. 
                mat = MaterialData.query.filter_by(item_description=material_name, brand=brand).first()
                if not mat:
                    mat = MaterialData.query.filter_by(item_description=material_name).first() # Fallback
                
                if mat:
                    
                    # 1. Determine which parameters are relevant for this material
                    # So we know which ones to DELETE if missing from new_attributes
                    param_keys = ['Grade', 'Purity', 'Color'] # Default
                    rule = EnrichmentRule.query.filter_by(sub_category=mat.sub_category).first()
                    if rule and rule.parameters:
                        try:
                            param_keys = json.loads(rule.parameters)
                        except:
                            pass
                    
                    new_attrs = change.get('new_attributes', {})
                    
                    # 2. Update CAS Number if present (Special Case)
                    if 'CAS' in new_attrs:
                         new_cas = new_attrs['CAS']
                         # Update main column
                         mat.cas_number = new_cas
                    
                    # 3. Handle Dynamic Parameters (Update OR Delete)
                    for key in param_keys:
                        # Should we update this key?
                        if key in new_attrs:
                             # UPDATE / INSERT
                             val = new_attrs[key]
                             found = False
                             for p in mat.parameters:
                                 if p.name == key:
                                     p.value = str(val)
                                     db.session.add(p)
                                     found = True
                                     break
                             if not found:
                                 new_param = MaterialParameter(material_id=mat.id, name=key, value=str(val))
                                 db.session.add(new_param)
                        else:
                             # DELETE (Use case: Dragged "back" to parent, effectively removing this param)
                             # Only delete if it exists
                             for p in mat.parameters:
                                 if p.name == key:
                                     db.session.delete(p)
                                     break

                    applied_count += 1

            elif change_type == 'rename':
                # Rename Material or Plant (Brand?)
                # If renaming Material: Update item_description
                
                old_name = change.get('old_name')
                new_name = change.get('new_name')
                node_type = change.get('node_type')
                
                if node_type == 'material':
                     mat = MaterialData.query.filter_by(item_description=old_name).first()
                     if mat:
                         mat.item_description = new_name
                         applied_count += 1
        
        db.session.commit()
        return jsonify({"success": True, "message": f"Applied {applied_count} changes"})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_clusters: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/validate/<int:row_id>', methods=['POST'])
def validate_cas(row_id):
    try:
        row = MaterialData.query.filter_by(row_number=row_id).first()
        if not row:
            return jsonify({"error": "Row not found"}), 404

        file = request.files.get('file')
        document_type = request.form.get('document_type', 'Other')  # MSDS, CoS, Other
        
        # 1. Manual Validation (No file)
        if not file:
            row.confidence_score = 100
            row.validation_status = 'Validated (Manual)'
            db.session.commit()
            return jsonify(row.to_dict())

        # 2. Document Validation
        filename = secure_filename(file.filename)
        timestamp = int(time.time())
        
        # Save file temporarily for processing
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_{row_id}_{timestamp}_{filename}")
        file.save(temp_path)

        # Parse text based on type
        text_content = ""
        if filename.lower().endswith('.pdf'):
            try:
                reader = PdfReader(temp_path)
                for page in reader.pages:
                    text_content += page.extract_text() + "\n"
            except Exception as e:
                os.remove(temp_path)
                return jsonify({"error": f"PDF Error: {e}"}), 400
        else:
             os.remove(temp_path)
             return jsonify({"error": "Only PDF validation supported currently"}), 400
        
        # Extract parameters from PDF text
        if text_content and row.sub_category:
            rule = EnrichmentRule.query.filter_by(sub_category=row.sub_category).first()
            if rule:
                try:
                    bedrock = BedrockCleaner()
                    params = json.loads(rule.parameters)
                    extracted_params = bedrock.extract_parameters(text_content, rule.identifier_name, params)
                    print(f"📄 Extracted from PDF: {extracted_params}")
                    
                    if extracted_params:
                        # Update CAS if found
                        cas_value = extracted_params.get(rule.identifier_name, "N/A")
                        if cas_value != "N/A" and cas_value != row.cas_number:
                            row.cas_number = cas_value
                        
                        # Regenerate enriched description
                        material_name = row.item_description.lower().replace(' ', '').replace('-', '')
                        parts = [material_name]
                        
                        # Add identifier
                        if row.cas_number and row.cas_number != "NOT FOUND":
                            parts.append(rule.identifier_name.lower())
                            parts.append(row.cas_number)
                        
                        # Dynamic Parameters Levels
                        # Using param_order from Rule
                        param_order = json.loads(rule.parameters) if rule.parameters else []
                        mat_params = {p.name.lower(): p.value for p in row.parameters} # Existing material parameters
                        
                        for p_name in param_order:
                            # Case insensitive lookup
                            p_val = extracted_params.get(p_name, "N/A") # Use extracted from PDF first
                            if p_val == "N/A":
                                p_val = mat_params.get(p_name.strip().lower(), 'N/A') # Fallback to existing if not in PDF
                            
                            # Skip empty/unspecified
                            if p_val != "N/A":
                                # Apply purity rules if this is a purity parameter
                                if p_name.lower() == 'purity' and rule.purity_rules:
                                    try:
                                        purity_rules = json.loads(rule.purity_rules)
                                        p_val = apply_purity_rules(p_val, purity_rules)
                                        print(f"✨ Applied Purity Rule: {p_name} = {p_val}")
                                    except Exception as e:
                                        print(f"Error applying purity rules: {e}")

                                parts.append(p_name.lower())
                                parts.append(p_val)

                                # Update or Create MaterialParameter
                                param_entry = MaterialParameter.query.filter_by(material_id=row.id, name=p_name).first()
                                if param_entry:
                                    param_entry.value = p_val
                                    print(f"🔄 Updated Parameter: {p_name} = {p_val}")
                                else:
                                    new_param = MaterialParameter(material_id=row.id, name=p_name, value=p_val)
                                    db.session.add(new_param)
                                    print(f"cw Created Parameter: {p_name} = {p_val}")
                        
                        row.enriched_description = "_".join(parts)
                        print(f"✅ Updated enriched description from PDF: {row.enriched_description}")
                except Exception as e:
                    print(f"Parameter extraction error: {e}")
        
        # Verify with Bedrock
        bedrock = BedrockCleaner()
        is_verified = bedrock.verify_cas_match(text_content, row.cas_number)
        
        if not is_verified:
            os.remove(temp_path)
            return jsonify({"error": f"Document does not confirm CAS {row.cas_number}"}), 400

        # Success: Upload to S3 or save locally
        file_path = ""
        if app.config['USE_S3']:
            # Upload to S3
            s3_key = f"validation_docs/{row_id}/{timestamp}_{filename}"
            try:
                with open(temp_path, 'rb') as f:
                    s3_client.upload_fileobj(
                        f,
                        app.config['S3_BUCKET'],
                        s3_key,
                        ExtraArgs={'ContentType': 'application/pdf'}
                    )
                file_path = f"s3://{app.config['S3_BUCKET']}/{s3_key}"
                os.remove(temp_path)  # Clean up temp file
            except Exception as e:
                os.remove(temp_path)
                return jsonify({"error": f"S3 Upload Error: {e}"}), 500
        else:
            # Save locally
            local_path = os.path.join(app.config['UPLOAD_FOLDER'], f"val_{row_id}_{timestamp}_{filename}")
            os.rename(temp_path, local_path)
            file_path = local_path

        # Success: Add document to array
        existing_docs = json.loads(row.validation_documents) if row.validation_documents else []
        existing_docs.append({
            "type": document_type,
            "filename": filename,
            "path": file_path,  # S3 path or local path
            "uploaded_at": datetime.utcnow().isoformat()
        })
        row.validation_documents = json.dumps(existing_docs)
        row.confidence_score = 100
        row.validation_status = f'Validated ({len(existing_docs)} doc{"s" if len(existing_docs) > 1 else ""})'

        db.session.commit()
        return jsonify(row.to_dict())

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rules/<int:rule_id>', methods=['DELETE'])
def delete_rule(rule_id):
    try:
        rule = EnrichmentRule.query.get(rule_id)
        if rule:
            db.session.delete(rule)
            db.session.commit()
            return jsonify({"success": True})
        return jsonify({"error": "Rule not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rules', methods=['GET', 'POST'])
def handle_rules():
    if request.method == 'POST':
        try:
            print("--- ENTERING handle_rules POST ---")
            data = request.json
            print(f"📥 RAW PAYLOAD: {repr(data)}")
            
            sub_category = data.get('sub_category')
            purity_rules = data.get('purity_rules', [])
            print(f"   SubCategory: {sub_category}")
            print(f"   New Purity Rules ({len(purity_rules)}): {repr(purity_rules)}")
            
            if not sub_category:
                print("   ❌ Missing sub_category")
                return jsonify({"error": "Sub-Category is required", "success": False}), 400
                
            rule = EnrichmentRule.query.filter_by(sub_category=sub_category).first()
            if not rule:
                print(f"   ✨ Creating NEW rule object")
                rule = EnrichmentRule(sub_category=sub_category)
                db.session.add(rule)
            else:
                print(f"   🔄 Updating EXISTING rule object (ID: {rule.id})")
            
            rule.identifier_name = data.get('identifier_name', 'CAS')
            rule.parameters = json.dumps(data.get('parameters', []))
            
            # Serialize
            dumped_rules = json.dumps(purity_rules)
            print(f"   📝 Serialized Purity Rules: {dumped_rules}")
            rule.purity_rules = dumped_rules
            
            db.session.add(rule)
            db.session.commit()
            print("   ✅ COMMIT SUCCESSFUL")
            return jsonify({"success": True, "message": "Rule saved"})
        except Exception as e:
            print(f"❌ Error saving rule: {e}")
            db.session.rollback()
            return jsonify({"error": str(e), "success": False}), 500
    
    else:
        # GET all rules
        return jsonify([r.to_dict() for r in rules])

@app.route('/api/annotations', methods=['GET', 'POST'])
def handle_annotations():
    if request.method == 'GET':
        # Filter by node type/identifier if provided
        node_type = request.args.get('node_type')
        node_identifier = request.args.get('node_identifier')
        
        query = NodeAnnotation.query
        if node_type and node_identifier:
            query = query.filter_by(node_type=node_type, node_identifier=node_identifier)
        
        annotations = query.order_by(NodeAnnotation.created_at.desc()).all()
        return jsonify([a.to_dict() for a in annotations])

    elif request.method == 'POST':
        try:
            data = request.json
            node_type = data.get('node_type')
            node_identifier = data.get('node_identifier')
            annotation_type = data.get('annotation_type', 'info')
            
            if not node_type or not node_identifier:
                return jsonify({"error": "Missing node info"}), 400
                
            ann = NodeAnnotation(
                node_type=node_type,
                node_identifier=node_identifier,
                annotation_type=annotation_type,
                content=data.get('content'),
                question=data.get('question'),
                answer=data.get('answer')
            )
            
            # Auto-determine open status for QA
            if annotation_type == 'qa':
                ann.is_open = not bool(data.get('answer'))
            else:
                ann.is_open = False
                
            db.session.add(ann)
            db.session.commit()
            return jsonify(ann.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

@app.route('/api/annotations/<int:ann_id>', methods=['DELETE', 'PUT'])
def modify_annotation(ann_id):
    try:
        ann = NodeAnnotation.query.get(ann_id)
        if not ann:
            return jsonify({"error": "Not found"}), 404
            
        if request.method == 'DELETE':
            db.session.delete(ann)
            db.session.commit()
            return jsonify({"success": True})
            
        elif request.method == 'PUT':
            data = request.json
            if 'content' in data: ann.content = data['content']
            if 'question' in data: ann.question = data['question']
            if 'answer' in data: 
                ann.answer = data['answer']
                if ann.annotation_type == 'qa':
                    ann.is_open = not bool(ann.answer)
            
            db.session.commit()
            return jsonify(ann.to_dict())
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


def apply_purity_rules(val_str, rules):
    """
    Parses a purity string (e.g. "95%", "90-95%") and buckets it based on rules.
    Rules example: [{'label': '<90', 'operator': '<', 'value': 90}, ...]
    """
    try:
        # 1. Clean and parse value
        clean_val = re.sub(r'[^\d.]', '', val_str.split('-')[0]) 
        if not clean_val:
            return val_str # Fallback to original string
            
        val = float(clean_val)
        
        # 2. Check rules in order
        for i, rule in enumerate(rules):
            operator = rule.get('operator')
            t_val = rule.get('value', '0')
            threshold = float(t_val) if t_val else 0.0
            label = rule.get('label', '')
            
            # Simple operators
            if operator and operator.strip() == '<' and val < threshold:
                return label
            elif operator and operator.strip() == '<=' and val <= threshold:
                return label
            elif operator and operator.strip() == '>' and val > threshold:
                return label
            elif operator == '>=' and val >= threshold:
                return label
            elif operator == 'range':
                min_v = float(rule.get('min', 0))
                max_v = float(rule.get('max', 100))
                if min_v <= val < max_v:
                    return label

        # If no rule matches, return original or "Other"
        return val_str
    except Exception as e:
        print(f"⚠️ Purity Rule Error for '{val_str}': {e}")
        return val_str

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
