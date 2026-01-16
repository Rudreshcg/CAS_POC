from flask import Flask, request, Response, send_file, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import requests
import re
import time
import json
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Enable CORS for React frontend
CORS(app, resources={
    r"/upload": {"origins": "*"},
    r"/process/*": {"origins": "*"},
    r"/download/*": {"origins": "*"},
    r"/clusters": {"origins": "*"}
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

    for term, label in trials:
        if not term or term.upper() in ['EXTRACT', 'OIL', 'NAN']: 
            continue
        
        # yield {"type": "log", "message": f"Trying: {term} ({label})..."} 
        
        cas, syns = client.search_and_detail(term)
        if cas:
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

    result_data = {
        'row_number': idx + 1,
        'total': total,
        'commodity': commodity,
        'sub_category': sub,
        'item_description': desc,
        'final_search_term': best_term,
        'cas_number': cas if cas else "NOT FOUND",
        'synonyms': syns if syns else "N/A",
        'inci_name': inci_name
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
            
            # Save output file
            output_df = pd.DataFrame([{
                'Commodity': r['commodity'],
                'Sub-Category': r['sub_category'],
                'Item description': r['item_description'],
                'Final Search Term': r['final_search_term'],
                'CAS Number': r['cas_number'],
                'INCI Name': r['inci_name'],
                'Synonyms': r['synonyms']
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


@app.route('/api/clusters')
def clusters():
    try:
        data_path = os.path.join(os.path.dirname(__file__), 'material_clusters.json')
        with open(data_path, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
            
        # Hierarchy: Brand -> Sub-Category -> Material -> Plants
        brands = {}
        
        for item in raw_data:
            b_name = item.get('Brand', 'Unknown Brand')
            if b_name not in brands: brands[b_name] = {}
            
            sub_name = item.get('Sub-Category', 'Misc')
            if sub_name not in brands[b_name]: brands[b_name][sub_name] = []
            
            for mat in item.get('Materials', []):
                brands[b_name][sub_name].append(mat)
        
        tree = {"name": "Apollo Material Clusters", "children": []}
        
        for b_name, subs in brands.items():
            b_node = {"name": b_name, "children": []}
            for sub_name, materials in subs.items():
                sub_node = {"name": sub_name, "children": []}
                for mat in materials:
                    mat_node = {
                        "name": mat.get('Name', 'Unknown'),
                        "children": [{"name": f"📍 {p}"} for p in mat.get('Plants', [])]
                    }
                    if not mat_node["children"]:
                        del mat_node["children"]
                        mat_node["value"] = 1
                    
                    sub_node["children"].append(mat_node)
                b_node["children"].append(sub_node)
            tree["children"].append(b_node)
            
        return jsonify(tree) # Return JSON for React
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
