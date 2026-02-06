from flask import Flask, request, Response, send_file, jsonify, send_from_directory
print("STARTING APP V4 with logging fixes")
from flask_cors import CORS
import pandas as pd
import requests
import re
import time
import json
import os
import hashlib
from datetime import datetime
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from sqlalchemy import func
from geocoding_data import CITY_COORDS


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

print(f"≡ƒöº Static folder configured: {app.static_folder}")
print(f"≡ƒöì Static folder exists: {os.path.exists(app.static_folder)}")

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
    print(f"Γ£à S3 configured: {app.config['S3_BUCKET']}")
else:
    print("ΓÜá∩╕Å  S3 not configured, using local storage")

from models import db, MaterialData, MaterialParameter, EnrichmentRule, NodeAnnotation, ClusterOverride, SpendRecord, UserPreference
db.init_app(app)

with app.app_context():
    db.create_all()
    # Migration hack: Add purity_rules column if it doesn't exist
    try:
        from sqlalchemy import text
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE enrichment_rule ADD COLUMN purity_rules TEXT DEFAULT '[]'"))
            conn.commit()
            print("Γ£à Added purity_rules column to EnrichmentRule")
    except Exception as e:
        pass

    # Migration hack: Add hierarchy column if it doesn't exist
    try:
        from sqlalchemy import text
        with db.engine.connect() as conn:
            conn.execute(text("ALTER TABLE enrichment_rule ADD COLUMN hierarchy TEXT DEFAULT '[\"Region\", \"Identifier\", \"Factory\"]'"))
            conn.commit()
            print("Γ£à Added hierarchy column to EnrichmentRule")
    except Exception as e:
        pass

# ==========================================
# SPEND DATA INGESTION
# ==========================================
def init_spend_data():
    """Initialize spend data from Excel file into database"""
    try:
        # Check if data already exists
        if SpendRecord.query.first():
            print("Γ£à Spend Database already populated. Skipping ingestion.")
            return
        
        print("≡ƒÜÇ Starting Spend Data Ingestion from Excel...")
        
        # Load Excel file
        xlsx_path = os.path.join(current_dir, 'Purchase History.xlsx')
        if not os.path.exists(xlsx_path):
            print("Γ¥î Purchase History.xlsx not found")
            return
        
        # Read Excel with no header (we'll map manually)
        df = pd.read_excel(xlsx_path, sheet_name='Sheet1', header=None, engine='openpyxl')
        
        print(f"≡ƒôè Processing {len(df)} rows from Excel...")
        
        # Helper function to safely parse float values
        def parse_float(val):
            try:
                if pd.isna(val):
                    return 0.0
                return float(str(val).replace(',', '').strip())
            except:
                return 0.0
        
        # Helper function to safely get string values
        def parse_str(val):
            if pd.isna(val):
                return None
            return str(val).strip()
        
        records = []
        skipped = 0
        
        for idx, row in df.iterrows():
            # Skip header row or empty rows
            if idx == 0 or (pd.isna(row[9]) and pd.isna(row[12])):
                skipped += 1
                continue
            
            try:
                record = SpendRecord(
                    operating_unit=parse_str(row[0]),
                    po_number=parse_str(row[1]),
                    po_date=parse_str(row[2]),
                    line_number=parse_str(row[3]),
                    shipment_number=parse_str(row[4]),
                    distribution_number=parse_str(row[5]),
                    release_number=parse_str(row[6]),
                    po_version=parse_str(row[7]),
                    supplier_number=parse_str(row[8]),
                    vendor_name=parse_str(row[9]) or "Unknown",
                    buyer_name=parse_str(row[10]),
                    item_category=parse_str(row[11]),
                    item_description=parse_str(row[12]) or "Unknown",
                    quantity=parse_float(row[13]),
                    uom=parse_str(row[14]),
                    unit_price_fc=parse_float(row[15]),
                    unit_price_inr=parse_float(row[16]),
                    currency_code=parse_str(row[17]),
                    base_price_fc=parse_float(row[18]),
                    base_price_inr=parse_float(row[19]),
                    amount=parse_float(row[20]),  # Main amount field
                    tax_amount=parse_float(row[21]) if len(row) > 21 else 0.0,
                    total_amount=parse_float(row[22]) if len(row) > 22 else 0.0,
                    fob_dsp=parse_str(row[23]) if len(row) > 23 else None,
                    additional_info=parse_str(row[24]) if len(row) > 24 else None,
                    is_contract=False  # Default, can be updated later
                )
                records.append(record)
            except Exception as e:
                print(f"ΓÜá∩╕Å Error processing row {idx}: {e}")
                skipped += 1
                continue
        
        if records:
            db.session.bulk_save_objects(records)
            db.session.commit()
            print(f"Γ£à Successfully ingested {len(records)} spend records into database.")
            if skipped > 0:
                print(f"ΓÜá∩╕Å Skipped {skipped} rows (header or invalid data)")
        else:
            print("ΓÜá∩╕Å No valid records found to ingest.")
    
    except Exception as e:
        print(f"Γ¥î Spend Data Ingestion Failed: {e}")
        db.session.rollback()

# Initialize spend data - Moved to main block to verify context
# with app.app_context():
#     init_spend_data()

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
        yield {"type": "log", "message": f"Γ£¿ Applying Enrichment Rule for '{sub}'..."}
        print(f"Γ£¿ Applying Enrichment Rule for '{sub}'...")
        yield {"type": "log", "message": f"≡ƒöì DEBUG: Rule found - Identifier: {rule.identifier_name}, Params: {rule.parameters}"}
        print(f"≡ƒöì DEBUG: Rule found - Identifier: {rule.identifier_name}, Params: {rule.parameters}")
        try:
            params = json.loads(rule.parameters)
            yield {"type": "log", "message": f"≡ƒöì DEBUG: Calling extract_parameters with desc='{desc}'"}
            print(f"≡ƒöì DEBUG: Calling extract_parameters with desc='{desc}'")
            extracted_data = bedrock_cleaner.extract_parameters(desc, rule.identifier_name, params)
            
            yield {"type": "log", "message": f"≡ƒöì DEBUG: Extracted data: {extracted_data}"}
            print(f"≡ƒöì DEBUG: Extracted data: {extracted_data}")
            
            if extracted_data:
                # Format: materialname_identifiername_identifiervalue_param1name_param1value_...
                # Example: glycerine_cas_56-81-5_purity_80%_grade_nonpharma
                
                # Start with material name (cleaned and lowercase)
                material_name = hyper_clean_chemical(desc).lower().replace(' ', '').replace('-', '')
                parts = [material_name]
                
                yield {"type": "log", "message": f"≡ƒöì DEBUG: Material name: {material_name}"}
                print(f"≡ƒöì DEBUG: Material name: {material_name}")
                
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
                yield {"type": "log", "message": f"Γ£à Generated Enriched Desc: {best_term}"}
                print(f"Γ£à Generated Enriched Desc: {best_term}")
                
                # Also try to use identifier as CAS if it looks like one
                if "CAS" in rule.identifier_name.upper() and identifier_val != "N/A":
                     cas = identifier_val
                     yield {"type": "log", "message": f"Γä╣∩╕Å Using extracted Identifier as CAS: {cas}"}
                     print(f"Γä╣∩╕Å Using extracted Identifier as CAS: {cas}")
            
        except Exception as e:
            print(f"Enrichment Error: {e}")
            pass
    elif rule and not bedrock_cleaner:
        yield {"type": "log", "message": f"ΓÜá∩╕Å Enrichment rule found for '{sub}' but Bedrock is not available"}
        print(f"ΓÜá∩╕Å Enrichment rule found for '{sub}' but Bedrock is not available")
    elif not rule:
        yield {"type": "log", "message": f"Γä╣∩╕Å No enrichment rule found for sub-category '{sub}'"}
        print(f"Γä╣∩╕Å No enrichment rule found for sub-category '{sub}'")

    for term, label in trials:
        if not term or term.upper() in ['EXTRACT', 'OIL', 'NAN']: 
            continue
        
        # yield {"type": "log", "message": f"Trying: {term} ({label})..."} 
        
        cas, syns = client.search_and_detail(term)
        if cas:
            # Only overwrite best_term if enrichment wasn't applied
            if not enrichment_applied:
                best_term = f"{term} ({label})"
            yield {"type": "log", "message": f"Γ£à Found CAS: {cas} for '{term}'"}
            break
        time.sleep(1.1)
    
    # LLM Fallback (if enabled and no CAS found)
    llm_inci = None
    if not cas and bedrock_cleaner:
        yield {"type": "log", "message": f"ΓÜá∩╕Å CAS not found. Asking AI..."}
        try:
            # Challenge 1: Smart Cleaning
            llm_term = bedrock_cleaner.smart_clean(desc)
            if llm_term and llm_term.upper() != hyper_clean_chemical(desc):
                yield {"type": "log", "message": f"AI suggest cleaning: {llm_term}"}
                cas, syns = client.search_and_detail(llm_term)
                if cas:
                    best_term = f"{llm_term} (AI Clean)"
                    yield {"type": "log", "message": f"Γ£à Found CAS via AI Clean: {cas}"}
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
                            yield {"type": "log", "message": f"Γ£à AI Identified & Verified: {cas}"}
                        else:
                            # Use unverified CAS
                            cas = f"{s_cas} (LLM)"
                            best_term = f"{desc} (AI Knowledge)"
                            yield {"type": "log", "message": f"ΓÜá∩╕Å AI Identified (Unverified): {s_cas}"}
                    
                    if s_inci and s_inci != "NOT FOUND":
                        llm_inci = s_inci
                        yield {"type": "log", "message": f"Γä╣∩╕Å AI Found INCI: {s_inci}"}

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
                    print(f"≡ƒöä Final enriched description: {final_enriched_desc}")
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
            elif filename.lower().endswith('.pdf'):
                raw_text = extract_pdf_text(filepath)
                # Convert PDF text to DataFrame (Line by Line)
                # Filter out short/empty lines to reduce noise
                lines = [l.strip() for l in raw_text.split('\n') if len(l.strip()) > 3]
                df = pd.DataFrame({'Item description': lines})
                df['Sub-Category'] = 'Unknown' # Default since PDF is unstructured
            else:
                df = pd.read_csv(filepath, on_bad_lines='skip', encoding='utf-8')
            client = CASClient(CAS_API_KEY)
            
            # CLEAR DATABASE for Single Session Persistence
            with app.app_context():
                try:
                    db.session.query(MaterialParameter).delete()
                    db.session.query(MaterialData).delete()
                    db.session.query(NodeAnnotation).delete() # Also clear annotations
                    db.session.commit()
                    print("≡ƒùæ∩╕Å Database cleared for new session.")
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
                        base_result = event['data']
                        
                        # Split Brands Logic
                        raw_brand_str = str(row.get('Item used for Brand(s)', 'N/A'))
                        brands = [b.strip() for b in raw_brand_str.split(',')] if raw_brand_str != 'N/A' else ['N/A']
                        
                        # Process each brand as a separate entity
                        for brand_name in brands:
                            if not brand_name: continue
                            
                            # Clone result for this brand
                            result = base_result.copy()
                            # Do not store raw comma-separated brand in DB, store the single split brand
                            # But keep other fields same
                            
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
                                        brand=brand_name, # Use split brand
                                        item_code=str(row.get('Item code', 'N/A')),
                                        plant=row.get('Factory/Country', 'N/A'),
                                        region=row.get('Region', 'N/A'), # Populate Region
                                        cluster=row.get('Cluster', 'N/A'),
                                        enriched_description=result['enriched_description'],
                                        final_search_term=result['final_search_term'],
                                        cas_number=result['cas_number'],
                                        inci_name=result['inci_name'],
                                        synonyms=result['synonyms']
                                    )
                                    db.session.add(material_entry)
                                    db.session.flush() # Get ID
                                    
                                    # Add ID to result so frontend has correct reference for this specific brand-row
                                    result['id'] = material_entry.id 
                                    result['brand'] = brand_name # Update result to show single brand
                                    
                                    params_to_save = result.get('extracted_parameters', {}).copy()
                                    
                                    for k, v in params_to_save.items():
                                        param_entry = MaterialParameter(
                                            material_id=material_entry.id,
                                            name=k,
                                            value=v
                                        )
                                        db.session.add(param_entry)
                                        

                                        
                                    # Update Quantity and Spend Value
                                    # Try to find columns case-insensitively
                                    # Default to random for demo if not found? 
                                    # Let's try to find exact or close matches
                                    
                                    qty = 0.0
                                    val = 0.0
                                    
                                    # Helper to find column value
                                    def get_col_val(r, candidates):
                                        for c in candidates:
                                            for col in r.keys():
                                                if c.lower() in col.lower():
                                                    try:
                                                        return float(str(r[col]).replace(',', '').strip())
                                                    except:
                                                        pass
                                        return 0.0

                                    qty = get_col_val(row, ['quantity', 'qty', 'volume'])
                                    val = get_col_val(row, ['value', 'amount', 'spend', 'cost'])
                                    
                                    # If 0, generate mock for demo purposes (DISABLE FOR PRODUCTION)
                                    import random
                                    if qty == 0: qty = random.uniform(100, 5000)
                                    if val == 0: val = qty * random.uniform(10, 50)
                                    
                                    material_entry.quantity = qty
                                    material_entry.spend_value = val

                                    db.session.commit()
                                    
                                    # Add to results list for CSV output
                                    results.append(result)
                                    
                                    # Yield row event to frontend
                                    yield f"data: {json.dumps({'type': 'row', 'data': result})}\n\n"
                                    
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
        resp = jsonify(data)
        resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        resp.headers['Pragma'] = 'no-cache'
        return resp
    except Exception as e:
        print(f"Cluster Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/clusters/sync', methods=['POST'])
def sync_cluster_layout():
    """
    Batch update override table with full current layout state.
    Expected Payload: [ { "node_id": "...", "parent_id": "..." }, ... ]
    """
    try:
        data = request.json
        print(f"≡ƒöä SYNC REQUEST RECEIVED. Payload size: {len(data) if data else 0}")
        if not isinstance(data, list):
            return jsonify({"error": "Payload must be a list"}), 400
        
        # Clear existing overrides? Or Update?
        # Safe strategy: Upsert/Update provided ones.
        
        count = 0
        for item in data:
            node_id = item.get('node_id')
            parent_id = item.get('parent_id')
            
            # Debug log for first few
            if count < 5:
                print(f"   Processing Override: Node='{node_id}' -> Parent='{parent_id}'")
            
            if not node_id or not parent_id: continue
            
            # Upsert
            override = ClusterOverride.query.filter_by(node_id=node_id).first()
            if not override:
                override = ClusterOverride(node_id=node_id, target_parent_id=parent_id)
                db.session.add(override)
            else:
                override.target_parent_id = parent_id
            
            count += 1

        db.session.commit()
        print(f"Γ£à SYNC COMPLETE. Updated {count} overrides.")
        return jsonify({"success": True, "message": f"Synced {count} overrides."})
    except Exception as e:
        print(f"Sync Error: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/cluster/move', methods=['POST'])
def move_cluster_node():
    try:
        data = request.json
        source_id = data.get('source_id')
        target_id = data.get('target_id')
        
        if not source_id or not target_id:
            return jsonify({"error": "Missing source_id or target_id"}), 400
            
        # Update or create override
        override = ClusterOverride.query.filter_by(node_id=source_id).first()
        if not override:
            override = ClusterOverride(node_id=source_id, target_parent_id=target_id)
            db.session.add(override)
        else:
            override.target_parent_id = target_id
            
        db.session.commit()
        return jsonify({"success": True, "message": "Moved successfully"})
    except Exception as e:
        print(f"Move Error: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/spend-analysis/<material_name>')
def spend_analysis(material_name):
    try:
        # Find all entries for this material (fuzzy match or exact?)
        # Let's try to match by Enriched Description or Item Description
        # For POC we might just look for rows where enriched description contains the material name 
        # or simple case-insensitive matching if it's a specific chemical
        
        # Taking a simpler approach: Match by "Final Search Term" or "Enriched Description"
        # Or even better, filter by rows that have this material name in their hierarchy?
        # The user request asks for "Spend Analytics for: Glycerine".
        
        # Let's search in query parameter 'material_name' against 'final_search_term' or 'item_description'
        search = f"%{material_name}%"
        results = MaterialData.query.filter(
            (MaterialData.final_search_term.ilike(search)) | 
            (MaterialData.enriched_description.ilike(search)) |
            (MaterialData.item_description.ilike(search))
        ).all()
        
        # Aggregate by Region
        region_stats = {}
        
        for r in results:
            reg = r.region if r.region and r.region != 'nan' else 'Unknown'
            if reg not in region_stats:
                region_stats[reg] = {'quantity': 0.0, 'value': 0.0}
            
            region_stats[reg]['quantity'] += (r.quantity or 0.0)
            region_stats[reg]['value'] += (r.spend_value or 0.0)
            
        # Format for Recharts
        # [ { name: 'Region', value: 100 }, ... ]
        chart_data_qty = [{'name': k, 'value': round(v['quantity'], 2)} for k, v in region_stats.items()]
        chart_data_val = [{'name': k, 'value': round(v['value'], 2)} for k, v in region_stats.items()]
        
        return jsonify({
            'material': material_name,
            'quantity_data': chart_data_qty,
            'value_data': chart_data_val,
            'total_quantity': sum(d['value'] for d in chart_data_qty),
            'total_value': sum(d['value'] for d in chart_data_val)
        })
        
    except Exception as e:
        print(f"Spend Analysis Error: {e}")
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
    
    # Pre-fetch all annotations & overrides
    annotations_map = {}
    overrides_map = {}
    
    try:
        all_anns = NodeAnnotation.query.all()
        for ann in all_anns:
            # Store full annotation data
            key = (ann.node_type, ann.node_identifier)
            if key not in annotations_map:
                annotations_map[key] = []
            annotations_map[key].append(ann.to_dict())
            
        all_overrides = ClusterOverride.query.all()
        for ov in all_overrides:
            overrides_map[ov.node_id] = ov.target_parent_id

    except Exception as e:
        print(f"Error fetching metadata: {e}")

    # Root Node
    root = {"id": "root", "name": f"Material Clusters - {filter_subcategory or 'All'}", "children": []}
    
    import uuid

    def get_annotation(node_type, identifier):
        key = (node_type, identifier)
        return annotations_map.get(key, {})

    def find_node(parent, name):
        for child in parent['children']:
            if child['name'] == name:
                return child
        return None

    def create_node(name, node_id=None, node_type=None, node_identifier=None):
        if not node_id:
            node_id = str(uuid.uuid4())
        
        node = {"id": node_id, "name": name, "children": []}
        if node_type: node['type'] = node_type
        if node_identifier: node['identifier'] = node_identifier
        
        if node_type and node_identifier:
            ann_list = get_annotation(node_type, node_identifier)
            if ann_list:
                node['annotations'] = ann_list
                
                # Check for any open QA to set flag
                has_open = any(a.get('annotation_type') == 'qa' and a.get('is_open') for a in ann_list)
                if has_open:
                    node['has_open_qa'] = True
                
                # Set comment text for badge count
                count = len(ann_list)
                if count == 1:
                    # Backward compat: show preview of single item
                    first = ann_list[0]
                    if first.get('annotation_type') == 'qa':
                         node['comment'] = f"Q: {first.get('question')}"
                    else:
                         node['comment'] = first.get('content')
                else:
                    node['comment'] = f"{count} annotations"
        
        return node

    for mat in materials:
        mat_params = {p.name.strip().lower(): p.value for p in mat.parameters}
        mat_subcat = mat.sub_category or "Uncategorized"
        
        if mat_subcat not in rules_cache:
            rule = EnrichmentRule.query.filter_by(sub_category=mat_subcat).first()
            r_order = ['Grade', 'Purity', 'Color']
            r_purity = []
            r_hierarchy = ["Region", "Identifier", "Factory"]
            if rule:
                if rule.parameters:
                   try: r_order = json.loads(rule.parameters)
                   except: pass
                if rule.purity_rules:
                   try: r_purity = json.loads(rule.purity_rules)
                   except: pass
                if rule.hierarchy:
                   try: r_hierarchy = json.loads(rule.hierarchy)
                   except: pass
            rules_cache[mat_subcat] = {'order': r_order, 'purity': r_purity, 'hierarchy': r_hierarchy}
            
        current_config = rules_cache[mat_subcat]
        param_order = current_config['order']
        purity_rules = current_config['purity']
        hierarchy_order = current_config['hierarchy']

        # Start from root
        current_node = root
        
        # Build Initial Hierarchy Levels based on config
        for level_type in hierarchy_order:
            level_name = "Unknown"
            node_type = level_type.lower()
            
            if level_type == 'Region':
                level_name = mat.region.strip() if mat.region and mat.region != 'nan' else "Unknown Region"
                node_id = f"region-{level_name}"
            elif level_type == 'Brand':
                level_name = mat.brand.strip() if mat.brand and mat.brand != 'nan' else "Unknown Brand"
                node_id = f"brand-{level_name}"
            elif level_type == 'Factory':
                level_name = mat.plant.strip() if mat.plant and mat.plant != 'nan' else "Unknown Factory"
                node_id = f"plant-{level_name}"
            elif level_type == 'Identifier' or level_type == 'CAS':
                 val = mat.cas_number if mat.cas_number and mat.cas_number != 'NOT FOUND' else "No CAS"
                 level_name = f"CAS: {val}"
                 node_type = 'cas'
                 node_id = f"cas-{val}"
            else:
                 continue

            # Ensure unique path-based ID to allow same name in different branches
            # BUT we want to merge if it's the same logical group
            # Actually, standardizing on path-based IDs is safer for dendrogram state
            # Let's create a unique ID by combining parent ID and this node ID
            unique_node_id = f"{current_node['id']}-{node_id}"
            
            # Find or create
            found_node = find_node(current_node, level_name)
            if not found_node:
                found_node = create_node(level_name, node_id=unique_node_id, node_type=node_type, node_identifier=level_name)
                current_node['children'].append(found_node)
            
            current_node = found_node

        # Dynamic Params
        for p_name in (param_order or []):
            val = mat_params.get(p_name.strip().lower(), "N/A")
            
            # Skip if N/A or empty
            if val in ["nan", "", "N/A", "Unspecified"]:
                continue
            
            # Purity Grouping
            if p_name.strip().lower() == 'purity' and purity_rules:
                grouped_val = apply_purity_rules(val, purity_rules)
                g_name = f"{p_name}: {grouped_val}"
                g_node = find_node(current_node, g_name)
                
                # Unique ID for grouping node
                grp_unique_id = f"grp-{current_node['id']}-{p_name}-{grouped_val}"
                
                if not g_node:
                    g_node = create_node(g_name, node_id=grp_unique_id, node_type='cluster_group', node_identifier=grp_unique_id)
                    current_node['children'].append(g_node)
                current_node = g_node
                
                # Raw Value - Only add if different from group name
                raw_name = f"{p_name}: {val}"
                if raw_name != g_name:
                    raw_node = find_node(current_node, raw_name)
                    if not raw_node:
                        raw_unique_id = f"raw-{current_node['id']}-{val}"
                        raw_node = create_node(raw_name, node_id=raw_unique_id, node_type='cluster_param', node_identifier=raw_unique_id)
                        current_node['children'].append(raw_node)
                    current_node = raw_node
            else:
                # Standard Param
                p_node_name = f"{p_name}: {val}"
                p_node = find_node(current_node, p_node_name)
                if not p_node:
                    param_unique_id = f"param-{current_node['id']}-{p_name}-{val}"
                    p_node = create_node(p_node_name, node_id=param_unique_id, node_type='cluster_param', node_identifier=param_unique_id)
                    current_node['children'].append(p_node)
                current_node = p_node

        # Material Leaf
        # Use simple brand-flavored ID to ensure uniqueness in tree
        r_name = mat.region.strip() if mat.region and mat.region != 'nan' else "Unknown"
        unique_id = f"mat-{r_name}-{mat.id}"
        
        # Use Enriched Description if available, else fallback to Item Description
        display_name = mat.enriched_description if mat.enriched_description and mat.enriched_description != 'nan' else mat.item_description
        
        mat_node = find_node(current_node, display_name)
        if not mat_node:
            stable_ident = hashlib.md5(f"{mat.brand}|{display_name}".encode('utf-8')).hexdigest()
            mat_node = create_node(display_name, node_id=unique_id, node_type='material', node_identifier=stable_ident)
            mat_node['db_id'] = mat.id # Important for Frontend API calls
            mat_node['count'] = 1 # Initialize count
            current_node['children'].append(mat_node)
        else:
            # Duplicate found in this cluster - increment count
            mat_node['count'] = mat_node.get('count', 1) + 1

    # POST-PROCESSING: Apply Overrides
    if overrides_map:
        print(f"Applying {len(overrides_map)} overrides...")
        
        # Recursive function to find parent of a node
        def find_parent_of_node(parent, target_child_id):
            if 'children' in parent:
                for i, child in enumerate(parent['children']):
                    if child['id'] == target_child_id:
                        return parent, i
                    found = find_parent_of_node(child, target_child_id)
                    if found: return found
            return None

        # Process overrides
        success_count = 0
        fail_count = 0
        for node_id, target_parent_id in overrides_map.items():
            # 1. Find the node and its current parent
            result = find_parent_of_node(root, node_id)
            if result:
                current_parent, idx = result
                
                # Check if it's already in the right place (optimization)
                if current_parent.get('id') == target_parent_id:
                     continue

                # 2. Detach
                node_to_move = current_parent['children'].pop(idx)
                
                # 3. Find target parent
                target_parent = find_node_by_id(root, target_parent_id)
                if target_parent:
                    if 'children' not in target_parent:
                        target_parent['children'] = []
                    target_parent['children'].append(node_to_move)
                    success_count += 1
                else:
                    # Fallback: Re-attach to root if target missing
                    print(f"ΓÜá∩╕Å Target parent '{target_parent_id}' not found for node '{node_id}'. Moving to root.")
                    root['children'].append(node_to_move)
                    fail_count += 1
            else:
                # Node not found in tree (might be filtered out or ID mismatch)
                # print(f"ΓÜá∩╕Å Node '{node_id}' not found in tree. Cannot apply override.")
                pass
        
        print(f"Γ£à Applied {success_count} overrides. {fail_count} failed/fallback.")

    return root

def find_node_by_id(node, target_id):
    if node.get('id') == target_id:
        return node
    for child in node.get('children', []):
        found = find_node_by_id(child, target_id)
        if found:
            return found
    return None



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
        if 'item_description' in data:
            row.item_description = data['item_description']
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
        # Key Fix: Use .get(row_id) to look up by Primary Key (ID), NOT row_number
        # This allows accurate targeting of split rows.
        row = MaterialData.query.get(row_id)
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
                    print(f"≡ƒôä Extracted from PDF: {extracted_params}")
                    
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
                                # DO NOT apply purity rules here - Save RAW value so hierarchy builder can group dynamically
                                # if p_name.lower() == 'purity' and rule.purity_rules:
                                #     try:
                                #         purity_rules = json.loads(rule.purity_rules)
                                #         p_val = apply_purity_rules(p_val, purity_rules)
                                #         print(f"Γ£¿ Applied Purity Rule: {p_name} = {p_val}")
                                #     except Exception as e:
                                #         print(f"Error applying purity rules: {e}")

                                parts.append(p_name.lower())
                                parts.append(p_val)

                                # Update or Create MaterialParameter
                                param_entry = MaterialParameter.query.filter_by(material_id=row.id, name=p_name).first()
                                if param_entry:
                                    param_entry.value = p_val
                                    print(f"≡ƒöä Updated Parameter: {p_name} = {p_val}")
                                else:
                                    new_param = MaterialParameter(material_id=row.id, name=p_name, value=p_val)
                                    db.session.add(new_param)
                                    print(f"cw Created Parameter: {p_name} = {p_val}")
                        
                        row.enriched_description = "_".join(parts)
                        print(f"Γ£à Updated enriched description from PDF: {row.enriched_description}")
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
            print(f"≡ƒôÑ RAW PAYLOAD: {repr(data)}")
            
            sub_category = data.get('sub_category')
            purity_rules = data.get('purity_rules', [])
            print(f"   SubCategory: {sub_category}")
            print(f"   New Purity Rules ({len(purity_rules)}): {repr(purity_rules)}")
            
            if not sub_category:
                print("   Γ¥î Missing sub_category")
                return jsonify({"error": "Sub-Category is required", "success": False}), 400
                
            rule = EnrichmentRule.query.filter_by(sub_category=sub_category).first()
            if not rule:
                print(f"   Γ£¿ Creating NEW rule object")
                rule = EnrichmentRule(sub_category=sub_category)
                db.session.add(rule)
            else:
                print(f"   ≡ƒöä Updating EXISTING rule object (ID: {rule.id})")
            
            rule.identifier_name = data.get('identifier_name', 'CAS')
            rule.parameters = json.dumps(data.get('parameters', []))
            
            # Serialize
            dumped_rules = json.dumps(purity_rules)
            print(f"   ≡ƒô¥ Serialized Purity Rules: {dumped_rules}")
            rule.purity_rules = dumped_rules
            
            # Hierarchy
            hierarchy = data.get('hierarchy')
            if hierarchy:
                 rule.hierarchy = json.dumps(hierarchy)
                 print(f"   ≡ƒôÜ Serialized Hierarchy: {rule.hierarchy}")
            
            db.session.add(rule)
            db.session.commit()
            print("   Γ£à COMMIT SUCCESSFUL")
            return jsonify({"success": True, "message": "Rule saved"})
        except Exception as e:
            print(f"Γ¥î Error saving rule: {e}")
            db.session.rollback()
            return jsonify({"error": str(e), "success": False}), 500
    
    else:
        # GET all rules
        rules = EnrichmentRule.query.all()
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
            if not isinstance(rule, dict):
                continue
                
            operator = rule.get('operator')
            t_val = rule.get('value', '0')
            threshold = float(t_val) if t_val else 0.0
            label = rule.get('label', '')
            
            # Simple operators
            # Check logic
            matched = False
            if operator and operator.strip() == '<' and val < threshold: matched = True
            elif operator and operator.strip() == '<=' and val <= threshold: matched = True
            elif operator and operator.strip() == '>' and val > threshold: matched = True
            elif operator == '>=' and val >= threshold: matched = True
            elif operator == 'range':
                min_v = float(rule.get('min', 0))
                max_v = float(rule.get('max', 100))
                if min_v <= val < max_v: matched = True
            
            if matched:
                # Code-level Fix: If label is generic "purity", auto-generate a better one
                if label.strip().lower() == 'purity':
                    if operator == 'range':
                         return f"{rule.get('min')} - {rule.get('max')}"
                    else:
                         return f"{operator} {t_val}"
                return label

        # If no rule matches, return original or "Other"
        return val_str
    except Exception as e:
        print(f"ΓÜá∩╕Å Purity Rule Error for '{val_str}': {e}")
        return val_str

@app.route('/api/spend-analysis/dashboard')
def advanced_spend_dashboard():
    try:
        # Query from Database using SQLAlchemy ORM
        total_spend = db.session.query(func.sum(SpendRecord.amount)).scalar() or 0
        total_suppliers = db.session.query(func.count(func.distinct(SpendRecord.vendor_name))).scalar() or 0
        total_transactions = db.session.query(func.count(SpendRecord.id)).scalar() or 0
        po_count = db.session.query(func.count(func.distinct(SpendRecord.po_number))).scalar() or 0
        
        # Mocks for PR and Invoice counts
        pr_count = int(po_count * 1.1)
        invoice_count = int(total_transactions * 0.8)

        # 1. Spend by Material/Item Description (Top 8)
        cat_result = db.session.query(
            SpendRecord.item_description, 
            func.sum(SpendRecord.amount)
        ).group_by(SpendRecord.item_description).order_by(
            func.sum(SpendRecord.amount).desc()
        ).limit(8).all()
        category_data = [{"name": str(r[0]), "value": float(r[1])} for r in cat_result]

        # 2. Market Trend (Aggregated by Month)
        trend_query = db.session.query(
            SpendRecord.po_date, 
            SpendRecord.amount
        ).filter(
            SpendRecord.po_date != None,
            SpendRecord.po_date != 'CREATION_DATE'  # Skip header
        ).all()

        trend_map = {}
        for date_str, amt in trend_query:
            try:
                # Expected format: 2023-01-02 or similar
                if date_str and len(str(date_str)) >= 7:
                    month_key = str(date_str)[:7]  # '2023-01'
                    trend_map[month_key] = trend_map.get(month_key, 0) + (amt or 0)
            except:
                continue
        
        # Convert to list and sort
        trend_sorted = sorted(trend_map.items())
        trend_data = [{"name": k, "value": float(v)} for k, v in trend_sorted]

        # 3. Spend by Region (Operating Unit)
        reg_result = db.session.query(
            SpendRecord.operating_unit, 
            func.sum(SpendRecord.amount)
        ).group_by(SpendRecord.operating_unit).order_by(
            func.sum(SpendRecord.amount).desc()
        ).all()
        region_data = [{"name": str(r[0]), "value": float(r[1])} for r in reg_result]

        # 4. Spend by Supplier (Top 10)
        sup_result = db.session.query(
            SpendRecord.vendor_name, 
            func.sum(SpendRecord.amount)
        ).group_by(SpendRecord.vendor_name).order_by(
            func.sum(SpendRecord.amount).desc()
        ).limit(10).all()
        supplier_data = [{"name": str(r[0]), "value": float(r[1])} for r in sup_result]

        # 5. Pareto Analysis (Suppliers)
        pareto_raw = db.session.query(
            SpendRecord.vendor_name, 
            func.sum(SpendRecord.amount)
        ).group_by(SpendRecord.vendor_name).order_by(
            func.sum(SpendRecord.amount).desc()
        ).limit(20).all()
        
        pareto_data = []
        cum_spend = 0
        for name, val in pareto_raw:
            cum_spend += (val or 0)
            cum_pct = (cum_spend / total_spend) * 100 if total_spend > 0 else 0
            pareto_data.append({
                "name": str(name),
                "spend": float(val or 0),
                "cumulativePercentage": round(float(cum_pct), 1)
            })

        # 6. Contract vs Non-Contract Spend
        contract_spend = db.session.query(func.sum(SpendRecord.amount)).filter(
            SpendRecord.is_contract == True
        ).scalar() or 0
        non_contract_spend = total_spend - contract_spend
        contract_data = [
            {"name": "Contracted", "value": float(contract_spend)},
            {"name": "Non-contract", "value": float(non_contract_spend)}
        ]

        return jsonify({
            "kpis": {
                "spend": float(total_spend),
                "suppliers": total_suppliers,
                "transactions": total_transactions,
                "po_count": po_count,
                "pr_count": pr_count,
                "invoice_count": invoice_count
            },
            "category_data": category_data,
            "trend_data": trend_data,
            "region_data": region_data,
            "supplier_data": supplier_data,
            "pareto_data": pareto_data,
            "contract_data": contract_data
        })

    except Exception as e:
        print(f"Stats Dashboard Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/spend-analysis/enriched-insights')
def enriched_spend_insights():
    """
    Endpoint that joins spend records with enriched material data
    to show spend analysis by standardized category
    """
    try:
        from models import MaterialData
        
        results = db.session.query(
            MaterialData.enriched_description,
            func.sum(SpendRecord.amount).label('total_spend'),
            func.count(SpendRecord.id).label('transaction_count')
        ).join(
            SpendRecord, MaterialData.item_code == SpendRecord.item_code
        ).group_by(
            MaterialData.enriched_description
        ).order_by(
            func.sum(SpendRecord.amount).desc()
        ).limit(20).all()
        
        data = [
            {
                "name": str(r[0] or "Unmapped/Unknown"),
                "value": float(r[1] or 0),
                "count": r[2]
            } for r in results
        ]
        
        return jsonify(data)
    except Exception as e:
        print(f"Enriched Insights Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/spend-analysis/table')
def spend_table_view():
    """
    Endpoint for tabular view of spend data with pagination and sorting
    """
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        sort_by = request.args.get('sort_by', 'amount')  # Default sort by amount
        sort_order = request.args.get('sort_order', 'desc')  # desc or asc
        search = request.args.get('search', '')
        
        # Build query with join to potentially get enriched description
        from models import MaterialData
        
        # Use session.query to allow joining
        query = db.session.query(
            SpendRecord,
            MaterialData.enriched_description
        ).outerjoin(
            MaterialData, SpendRecord.item_code == MaterialData.item_code
        )
        
        # Apply search filter if provided
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                db.or_(
                    SpendRecord.vendor_name.ilike(search_filter),
                    SpendRecord.item_description.ilike(search_filter),
                    SpendRecord.po_number.ilike(search_filter),
                    SpendRecord.operating_unit.ilike(search_filter),
                    MaterialData.enriched_description.ilike(search_filter)
                )
            )
        
        # Apply sorting
        if sort_by == 'enriched_description':
            sort_column = MaterialData.enriched_description
        else:
            sort_column = getattr(SpendRecord, sort_by, SpendRecord.amount)
            
        if sort_order == 'desc':
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Format results
        records = []
        for record, enriched in pagination.items:
            record_dict = record.to_dict()
            record_dict['enriched_description'] = enriched or "Not Enriched"
            records.append(record_dict)
            
        return jsonify({
            "records": records,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": page,
            "per_page": per_page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        })
        
    except Exception as e:
        print(f"Table View Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/spend-analysis/suppliers-map')
def spend_map_view():
    """
    Endpoint for map visualization of supplier locations
    Returns aggregated spend by supplier with smart geocoding based on site/unit
    """
    try:
        # Use our external geocoding knowledge base
        city_lookup = CITY_COORDS

        # Aggregate spend by vendor, site, and unit
        supplier_data = db.session.query(
            SpendRecord.vendor_name,
            SpendRecord.supplier_site,
            SpendRecord.operating_unit,
            func.sum(SpendRecord.amount).label('total_spend'),
            func.count(SpendRecord.id).label('transaction_count')
        ).group_by(
            SpendRecord.vendor_name,
            SpendRecord.supplier_site,
            SpendRecord.operating_unit
        ).order_by(
            func.sum(SpendRecord.amount).desc()
        ).limit(150).all()
        
        map_data = []
        import random
        
        def geocode(site, unit):
            text = f"{str(site or '').lower()} {str(unit or '').lower()}"
            for city, coords in city_lookup.items():
                if city in text:
                    return coords
            # Fallback based on Unit keywords
            if 'india' in text: return {'lat': 20.5937, 'lng': 78.9629, 'name': 'India'}
            if 'brazil' in text: return {'lat': -14.235, 'lng': -51.9253, 'name': 'Brazil'}
            return {'lat': 0, 'lng': 0, 'name': 'Unknown'}

        for vendor, site, unit, spend, count in supplier_data:
            location = geocode(site, unit)
            
            # Skip unknown locations if possible, or spread them at (0,0)
            lat_base = location['lat']
            lng_base = location['lng']
            
            # Jitter
            lat_offset = random.uniform(-0.4, 0.4)
            lng_offset = random.uniform(-0.4, 0.4)
            
            map_data.append({
                'vendor_name': vendor or 'Unknown',
                'supplier_site': site or 'Unknown',
                'operating_unit': unit or 'Unknown',
                'location_name': location['name'],
                'latitude': lat_base + lat_offset if lat_base != 0 else 0,
                'longitude': lng_base + lng_offset if lng_base != 0 else 0,
                'total_spend': float(spend or 0),
                'transaction_count': count,
                'spend_category': categorize_spend(spend)
            })
        
        # Summary statistics
        total_spend = db.session.query(func.sum(SpendRecord.amount)).scalar() or 0
        total_suppliers = db.session.query(func.count(func.distinct(SpendRecord.vendor_name))).scalar() or 0
        
        return jsonify({
            'suppliers': map_data,
            'summary': {
                'total_spend': float(total_spend),
                'total_suppliers': total_suppliers,
                'mapped_suppliers': len(map_data)
            }
        })
    except Exception as e:
        print(f"Map View Error: {e}")
        return jsonify({"error": str(e)}), 500

def categorize_spend(amount):
    """Helper function to categorize spend for map visualization"""
    if not amount:
        return 'low'
    elif amount < 100000:
        return 'low'
    elif amount < 1000000:
        return 'medium'
    elif amount < 10000000:
        return 'high'
    else:
        return 'very_high'


@app.route('/api/user-preferences', methods=['GET'])
def get_user_preferences():
    """Fetch user preferences, optionally filtered by key"""
    key = request.args.get('key')
    if key:
        pref = UserPreference.query.filter_by(key=key).first()
        return jsonify(pref.to_dict() if pref else None)
    
    prefs = UserPreference.query.all()
    return jsonify({p.key: p.value for p in prefs})

@app.route('/api/user-preferences', methods=['POST'])
def save_user_preference():
    """Save or update a user preference"""
    try:
        data = request.json
        if not data or 'key' not in data or 'value' not in data:
            return jsonify({"error": "Key and value are required"}), 400
        
        pref = UserPreference.query.filter_by(key=data['key']).first()
        if pref:
            pref.value = str(data['value'])
        else:
            pref = UserPreference(key=data['key'], value=str(data['value']))
            db.session.add(pref)
        
        db.session.commit()
        return jsonify(pref.to_dict())
    except Exception as e:
        print(f"Error saving preference: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Initialize spend data on startup
    with app.app_context():
        init_spend_data()
        
    app.run(debug=True, host='0.0.0.0', port=5000)
