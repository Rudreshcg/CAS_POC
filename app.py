from flask import Flask, render_template, request, Response, send_file
import pandas as pd
import requests
import re
import time
import json
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
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
        'KOSHER', 'NON-KOSHER', 'COGNIS', 'DRUM'
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
    return t.strip('-').strip()

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

def process_row(row, idx, total, client):
    """Process a single row and return result"""
    desc = str(row.get('Item description', ''))
    sub = str(row.get('Sub-Category', ''))
    commodity = str(row.get('Commodity', ''))

    trials = [(desc, "Raw Desc"), (sub, "Raw Sub"),
              (hyper_clean_chemical(desc), "Clean Desc"),
              (hyper_clean_chemical(sub), "Clean Sub")]

    cas, syns, best_term = None, "N/A", hyper_clean_chemical(desc)

    for term, label in trials:
        if not term or term.upper() in ['EXTRACT', 'OIL', 'NAN']: 
            continue
        cas, syns = client.search_and_detail(term)
        if cas:
            best_term = f"{term} ({label})"
            break
        time.sleep(1.1)

    return {
        'row_number': idx + 1,
        'total': total,
        'commodity': commodity,
        'sub_category': sub,
        'item_description': desc,
        'final_search_term': best_term,
        'cas_number': cas if cas else "NOT FOUND",
        'synonyms': syns if syns else "N/A"
    }

# ==========================================
# ROUTES
# ==========================================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return json.dumps({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return json.dumps({'error': 'No file selected'}), 400
    
    if file and file.filename.endswith('.csv'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return json.dumps({'success': True, 'filename': filename})
    
    return json.dumps({'error': 'Invalid file type. Please upload a CSV file.'}), 400

@app.route('/process/<filename>')
def process_file(filename):
    def generate():
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        try:
            df = pd.read_csv(filepath, on_bad_lines='skip', encoding='utf-8')
            client = CASClient(CAS_API_KEY)
            
            results = []
            total = len(df)
            
            # Send initial message
            yield f"data: {json.dumps({'type': 'start', 'total': total})}\n\n"
            
            for idx, row in df.iterrows():
                result = process_row(row, idx, total, client)
                results.append(result)
                
                # Stream each result
                yield f"data: {json.dumps({'type': 'row', 'data': result})}\n\n"
            
            # Save output file
            output_df = pd.DataFrame([{
                'Commodity': r['commodity'],
                'Sub-Category': r['sub_category'],
                'Item description': r['item_description'],
                'Final Search Term': r['final_search_term'],
                'CAS Number': r['cas_number'],
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

if __name__ == '__main__':
    app.run(debug=True, port=5000, threaded=True)
