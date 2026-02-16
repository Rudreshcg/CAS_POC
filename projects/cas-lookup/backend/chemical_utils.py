import re
import requests
import time

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

    # Strip leading numbers from the start of the string if they are followed by letters
    t = re.sub(r'^\d+[\s-]*', '', t)
    
    words = t.split()
    cleaned_words = []
    for w in words:
        # Strip leading numbers or punctuation from the word itself (e.g., 12Dimethicone -> Dimethicone)
        w_clean = re.sub(r'^[0-9\-\.\,]+', '', w)
        
        # If the word is still mostly digits (like a stand-alone number or concentration), skip it
        if any(c.isdigit() for c in w_clean) and len(w_clean) <= 4:
            continue
        
        if not w_clean:
            continue
            
        if len(w_clean) == 1 and len(cleaned_words) > 0:
            continue
            
        cleaned_words.append(w_clean)

    t = " ".join(cleaned_words).strip()
    return t.strip('*-., ').strip()

def is_likely_inci(name):
    """
    Heuristic to identify INCI names from synonyms.
    """
    if not name or len(name) > 60 or len(name) < 3:
        return False
    
    if re.match(r'^\d+-\d+-\d+$', name):
        return False
    
    generic_terms = ['EXTRACT', 'OIL', 'POWDER', 'LIQUID', 'SOLUTION', 'MIXTURE']
    if name.upper().strip() in generic_terms:
        return False
    
    name_upper = name.upper()
    
    inci_suffixes = [
        'ACID', 'OXIDE', 'EXTRACT', 'OIL', 'BUTTER', 'WAX', 'GLYCOL',
        'ALCOHOL', 'ESTER', 'SULFATE', 'CHLORIDE', 'NITRATE', 'PHOSPHATE',
        'CARBONATE', 'HYDROXIDE', 'PEROXIDE', 'BENZOATE', 'PALMITATE',
        'STEARATE', 'OLEATE', 'ACETATE', 'CITRATE'
    ]
    
    uppercase_ratio = sum(1 for c in name if c.isupper()) / len(name.replace(' ', '').replace('-', ''))
    if uppercase_ratio > 0.7:
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
    
    synonyms = synonyms_string.split('|')
    
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
        cas_clean = cas_number.strip()
        url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{cas_clean}/synonyms/JSON"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            synonyms = data.get('InformationList', {}).get('Information', [{}])[0].get('Synonym', [])
            
            for syn in synonyms[:50]:
                if is_likely_inci(syn):
                    return syn
        
        return "N/A"
        
    except Exception as e:
        return "N/A"
