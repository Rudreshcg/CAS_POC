from flask import Blueprint, jsonify, request, current_app, Response, send_file
import os
import pandas as pd
import json
import time
import re
import hashlib
import uuid
from sqlalchemy import func
from pypdf import PdfReader
from werkzeug.utils import secure_filename
from models import db, MaterialData, MaterialParameter, EnrichmentRule, NodeAnnotation, ClusterOverride
from chemical_utils import hyper_clean_chemical, extract_inci_from_synonyms, lookup_inci_from_pubchem
from cas_client import CASClient
from llm_helper import BedrockCleaner

material_bp = Blueprint('material', __name__)

def extract_pdf_text(file_path):
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

def apply_purity_rules(val_str, rules):
    try:
        clean_val = re.sub(r'[^\d.]', '', val_str.split('-')[0]) 
        if not clean_val:
            return val_str
        val = float(clean_val)
        for rule in rules:
            if not isinstance(rule, dict): continue
            operator = rule.get('operator')
            t_val = rule.get('value', '0')
            threshold = float(t_val) if t_val else 0.0
            label = rule.get('label', '')
            matched = False
            if operator == '<' and val < threshold: matched = True
            elif operator == '<=' and val <= threshold: matched = True
            elif operator == '>' and val > threshold: matched = True
            elif operator == '>=' and val >= threshold: matched = True
            elif operator == 'range':
                min_v = float(rule.get('min', 0))
                max_v = float(rule.get('max', 100))
                if min_v <= val < max_v: matched = True
            if matched:
                if label.strip().lower() == 'purity':
                    if operator == 'range': return f"{rule.get('min')} - {rule.get('max')}"
                    else: return f"{operator} {t_val}"
                return label
        return val_str
    except Exception as e:
        print(f"Purity Rule Error: {e}")
        return val_str

def find_node_by_id(node, target_id):
    if node.get('id') == target_id: return node
    if node.get('skeleton_id') == target_id: return node
    for child in node.get('children', []):
        found = find_node_by_id(child, target_id)
        if found: return found
    return None

def find_node_by_skeleton_id(node, target_id):
    if node.get('skeleton_id') == target_id: return node
    for child in node.get('children', []):
        found = find_node_by_skeleton_id(child, target_id)
        if found: return found
    return None

def build_db_hierarchy(filter_subcategory=None):
    query = MaterialData.query
    if filter_subcategory and filter_subcategory != 'All':
        query = query.filter_by(sub_category=filter_subcategory)
    materials = query.all()
    
    rules_cache = {}
    annotations_map = {}
    overrides_map = {}
    
    try:
        all_anns = NodeAnnotation.query.all()
        for ann in all_anns:
            key = (ann.node_type, ann.node_identifier)
            if key not in annotations_map: annotations_map[key] = []
            annotations_map[key].append(ann.to_dict())
        for ov in ClusterOverride.query.all():
            overrides_map[ov.node_id] = ov.target_parent_id
    except Exception as e:
        print(f"Error fetching metadata: {e}")

    root = {"id": "root", "name": f"Material Clusters - {filter_subcategory or 'All'}", "children": [], "type": "root"}

    def find_node(parent, name):
        for child in parent.get('children', []):
            if child.get('name') == name: return child
        return None

    # PHASE 1: Build Structure Skeleton
    for mat in materials:
        subcat = mat.sub_category or "Uncategorized"
        if subcat not in rules_cache:
            rule = EnrichmentRule.query.filter_by(sub_category=subcat).first()
            cfg = {'order': ['Grade', 'Purity', 'Color'], 'purity': [], 'hierarchy': ["Region", "Identifier", "Factory"]}
            if rule:
                if rule.parameters: cfg['order'] = json.loads(rule.parameters)
                if rule.purity_rules: cfg['purity'] = json.loads(rule.purity_rules)
                if rule.hierarchy: 
                    h = json.loads(rule.hierarchy)
                    if h: cfg['hierarchy'] = h 
            rules_cache[subcat] = cfg
            
        cfg = rules_cache[subcat]
        current_node = root
        
        # Build Hierarchy Levels
        for level in cfg['hierarchy']:
            lc = level.strip().lower()
            name, n_id, n_type = "Unknown", "unknown", lc
            if lc == 'region': name = mat.region or "Unknown Region"; n_id = f"region-{name}"
            elif lc == 'brand': name = mat.brand or "Unknown Brand"; n_id = f"brand-{name}"
            elif lc == 'factory': name = mat.plant or "Unknown Factory"; n_id = f"plant-{name}"
            elif lc in ['identifier', 'cas']:
                val = mat.cas_number if mat.cas_number and mat.cas_number != 'NOT FOUND' else "No CAS"
                name, n_type, n_id = f"CAS: {val}", 'cas', f"cas-{val}"
            else: continue
            
            u_id = f"{current_node['id']}::{n_id}"
            found = find_node(current_node, name)
            if not found:
                found = {"name": name, "children": [], "type": n_type, "id": u_id, "skeleton_id": u_id, "local_id": n_id}
                current_node['children'].append(found)
            current_node = found

        # Build Params
        mat_params = {p.name.strip().lower(): p.value for p in mat.parameters}
        for p_name in cfg['order']:
            val = mat_params.get(p_name.strip().lower(), "N/A")
            if val in ["nan", "", "N/A", "Unspecified"]: continue
            if p_name.lower() == 'purity' and cfg['purity']:
                g_val = apply_purity_rules(val, cfg['purity'])
                g_name = f"{p_name}: {g_val}"
                g_node = find_node(current_node, g_name)
                if not g_node:
                    l_id = f"grp-{p_name}-{g_val}"
                    u_id = f"{current_node['id']}::{l_id}"
                    g_node = {"name": g_name, "children": [], "type": "cluster_group", "id": u_id, "skeleton_id": u_id, "local_id": l_id}
                    current_node['children'].append(g_node)
                current_node = g_node
                if f"{p_name}: {val}" != g_name:
                    v_name = f"{p_name}: {val}"
                    v_node = find_node(current_node, v_name)
                    if not v_node:
                        l_id = f"raw-{val}"
                        u_id = f"{current_node['id']}::{l_id}"
                        v_node = {"name": v_name, "children": [], "type": "cluster_param", "id": u_id, "skeleton_id": u_id, "local_id": l_id}
                        current_node['children'].append(v_node)
                    current_node = v_node
            else:
                p_vn = f"{p_name}: {val}"
                p_node = find_node(current_node, p_vn)
                if not p_node:
                    l_id = f"param-{p_name}-{val}"
                    u_id = f"{current_node['id']}::{l_id}"
                    p_node = {"name": p_vn, "children": [], "type": "cluster_param", "id": u_id, "skeleton_id": u_id, "local_id": l_id}
                    current_node['children'].append(p_node)
                current_node = p_node

        # Add Material Leaf
        d_name = mat.enriched_description or mat.item_description
        mat_leaf = find_node(current_node, d_name)
        if not mat_leaf:
            l_id = f"mat-{mat.id}"
            mat_leaf = {
                "name": d_name, "type": "material", 
                "id": f"{current_node['id']}::{l_id}",
                "skeleton_id": f"{current_node['id']}::{l_id}", # Stable identity for materials
                "db_id": mat.id, "count": 1, "children": [], "local_id": l_id
            }
            current_node['children'].append(mat_leaf)
        else:
            mat_leaf['count'] = mat_leaf.get('count', 1) + 1

    # PHASE 2: Apply Overrides
    if overrides_map:
        def find_parent_recursive_skel(parent, target_skel_id):
            for i, child in enumerate(parent.get('children', [])):
                if child.get('skeleton_id') == target_skel_id: return parent, i
                res = find_parent_recursive_skel(child, target_skel_id)
                if res: return res
            return None
            
        for node_id, t_parent_id in overrides_map.items():
            res = find_parent_recursive_skel(root, node_id)
            if res:
                parent, idx = res
                node_to_move = parent['children'].pop(idx)
                # target can be found either by skeleton_id (original position) or by id (already moved position)
                target = find_node_by_id(root, t_parent_id)
                if target:
                    if 'children' not in target: target['children'] = []
                    target['children'].append(node_to_move)
                else:
                    root['children'].append(node_to_move)

    # PHASE 3: Decoration & Finalization
    def decorate_recursive(node, parent_id="root"):
        if node['type'] == 'root':
            node['id'] = 'root'
            node['identifier'] = 'root'
        else:
            # Use local_id to reconstruct path stably
            l_id = node.get('local_id', 'unknown')
            node['id'] = f"{parent_id}::{l_id}"
            
            if node['type'] == 'material':
                node['identifier'] = str(node['db_id'])
            else:
                node['identifier'] = node['id'] 
        
        # 2. Attach Annotations
        anns = annotations_map.get((node['type'], node['identifier']), [])
        if anns:
            node['annotations'] = anns
            node['has_open_qa'] = any(a.get('annotation_type') == 'qa' and a.get('is_open') for a in anns)
            if len(anns) > 1:
                node['comment'] = f"{len(anns)} annotations"
            else:
                ann = anns[0]
                node['comment'] = f"Q: {ann.get('question')}" if ann.get('annotation_type') == 'qa' else ann.get('content')
        
        # 3. Recurse
        for child in node.get('children', []):
            decorate_recursive(child, node['id'])
        
        return node

    return decorate_recursive(root)

def get_col_val(row, candidates, default="", is_num=False):
    """Robustly extract a value from a row using multiple possible column name candidates."""
    for c in candidates:
        for col in row.index: # for pd.Series
            if c.lower() == str(col).lower() or c.lower() in str(col).lower():
                val = row[col]
                if pd.isna(val) or val is None: continue
                if is_num:
                    try: return float(str(val).replace(',', '').strip())
                    except: continue
                else:
                    s_val = str(val).strip()
                    if s_val.lower() in ['nan', 'none', '']: continue
                    return s_val
    return default if not is_num else 0.0

def process_row(row, idx, total, client, bedrock_cleaner=None):
    """Process a single row and yield logs + result"""
    desc = get_col_val(row, ['Item description', 'Description', 'Item'], "Unknown Item")
    sub = get_col_val(row, ['Sub-Category', 'SubCategory', 'Category'], "Uncategorized")
    commodity = get_col_val(row, ['Commodity'], "N/A")

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
    enrichment_applied = False 

    # Check for Enrichment Rules matching Sub-Category
    rule = EnrichmentRule.query.filter_by(sub_category=sub).first()
    
    if rule and bedrock_cleaner:
        yield {"type": "log", "message": f"Applying Enrichment Rule for '{sub}'..."}
        try:
            params = json.loads(rule.parameters)
            extracted_data = bedrock_cleaner.extract_parameters(desc, rule.identifier_name, params)
            
            if extracted_data:
                # Start with material name (cleaned and lowercase)
                material_name = hyper_clean_chemical(desc).lower().replace(' ', '').replace('-', '')
                parts = [material_name]
                
                # Add Identifier name and value
                identifier_val = extracted_data.get(rule.identifier_name, "N/A")
                if identifier_val != "N/A":
                    parts.append(rule.identifier_name.lower())  # e.g., "cas"
                    parts.append(identifier_val)  # e.g., "56-81-5"
                
                # Add Parameters (name_value pairs)
                for p_name in params:
                    p_val = extracted_data.get(p_name, "N/A")
                    if p_val != "N/A":
                        parts.append(p_name.lower())
                        parts.append(p_val)
                
                best_term = "_".join(parts)
                enrichment_applied = True 
                yield {"type": "log", "message": f"Generated Enriched Desc: {best_term}"}
                
                if "CAS" in rule.identifier_name.upper() and identifier_val != "N/A":
                     cas = identifier_val
                     yield {"type": "log", "message": f"Using extracted Identifier as CAS: {cas}"}
        except Exception as e:
            print(f"Enrichment Error: {e}")

    for term, label in trials:
        if not term or term.upper() in ['EXTRACT', 'OIL', 'NAN']: continue
        cas, syns = client.search_and_detail(term)
        if cas:
            if not enrichment_applied:
                best_term = f"{term} ({label})"
            yield {"type": "log", "message": f"Found CAS: {cas} for '{term}'"}
            break
        time.sleep(1.1)
    
    # LLM Fallback (if enabled and no CAS found)
    llm_inci = None
    if not cas and bedrock_cleaner:
        yield {"type": "log", "message": f"CAS not found. Asking AI..."}
        try:
            llm_term = bedrock_cleaner.smart_clean(desc)
            if llm_term and llm_term.upper() != hyper_clean_chemical(desc):
                yield {"type": "log", "message": f"AI suggest cleaning: {llm_term}"}
                cas, syns = client.search_and_detail(llm_term)
                if cas:
                    best_term = f"{llm_term} (AI Clean)"
                    yield {"type": "log", "message": f"Found CAS via AI Clean: {cas}"}
                time.sleep(1.1)
            
            if not cas:
                yield {"type": "log", "message": f"Checking AI Knowledge Base..."}
                details = bedrock_cleaner.get_chemical_details(desc)
                if details:
                    s_cas = details.get('cas')
                    s_inci = details.get('inci')
                    if s_cas and s_cas != "NOT FOUND":
                        verify_cas, _ = client.search_and_detail(s_cas)
                        if verify_cas:
                            cas = verify_cas
                            if not enrichment_applied:
                                best_term = f"{desc} (AI Verified)"
                            yield {"type": "log", "message": f"AI Identified & Verified: {cas}"}
                        else:
                            cas = f"{s_cas} (LLM)"
                            best_term = f"{desc} (AI Knowledge)"
                            yield {"type": "log", "message": f"AI Identified (Unverified): {s_cas}"}
                    if s_inci and s_inci != "NOT FOUND":
                        llm_inci = s_inci
                        yield {"type": "log", "message": f"AI Found INCI: {s_inci}"}
        except Exception as e:
            print(f"LLM Error: {e}")

    # INCI Lookup
    inci_name = "N/A"
    if llm_inci: inci_name = f"{llm_inci} (AI)"
    if inci_name == "N/A" and cas and "NOT FOUND" not in str(cas):
        yield {"type": "log", "message": f"Looking up INCI for CAS {cas}..."}
        clean_cas = str(cas).split('(')[0].strip()
        inci_name = extract_inci_from_synonyms(syns)
        if inci_name == "N/A":
            time.sleep(0.5)
            yield {"type": "log", "message": f"Querying PubChem for INCI..."}
            inci_name = lookup_inci_from_pubchem(clean_cas)

    final_enriched_desc = best_term
    extracted_params_result = {}
    if cas and cas != "NOT FOUND":
        rule = EnrichmentRule.query.filter_by(sub_category=sub).first()
        if rule:
            try:
                material_name = hyper_clean_chemical(desc).lower().replace(' ', '').replace('-', '')
                parts = [material_name]
                parts.append(rule.identifier_name.lower())
                parts.append(str(cas).split('(')[0].strip())
                if bedrock_cleaner:
                    try:
                        params = json.loads(rule.parameters)
                        extracted_params = bedrock_cleaner.extract_parameters(desc, rule.identifier_name, params)
                        if extracted_params:
                            for p_name in params:
                                p_val = extracted_params.get(p_name, "N/A")
                                if p_val != "N/A":
                                    parts.append(p_name.lower())
                                    parts.append(p_val)
                                    extracted_params_result[p_name] = p_val
                    except: pass
                final_enriched_desc = "_".join(parts)
            except: pass

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
        'confidence_score': 70 if cas else 0,
        'validation_status': 'Pending',
        'extracted_parameters': extracted_params_result
    }
    yield {"type": "result", "data": result_data}

@material_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files: return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({'error': 'No file selected'}), 400
    allowed = {'.csv', '.xlsx', '.xls', '.pdf'}
    if any(file.filename.lower().endswith(ext) for ext in allowed):
        filename = secure_filename(file.filename)
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
        return jsonify({'success': True, 'filename': filename})
    return jsonify({'error': 'Invalid file type'}), 400

@material_bp.route('/process/<filename>')
def process_file(filename):
    app = current_app._get_current_object()
    def generate():
        with app.app_context():
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            try:
                if filename.lower().endswith(('.xlsx', '.xls')):
                    df = pd.read_excel(filepath)
                elif filename.lower().endswith('.pdf'):
                    raw_text = extract_pdf_text(filepath)
                    lines = [l.strip() for l in raw_text.split('\n') if len(l.strip()) > 3]
                    df = pd.DataFrame({'Item description': lines})
                    df['Sub-Category'] = 'Unknown'
                else:
                    df = pd.read_csv(filepath, on_bad_lines='skip', encoding='utf-8')
                
                # Use CAS_API_KEY from config
                client = CASClient(app.config.get('CAS_API_KEY', "XBr7txDIgp8FNY3ziNqaqRFiTShZBdb3V3GN3QAb"))
                
                # Clear existing data for fresh session
                try:
                    db.session.query(MaterialParameter).delete()
                    db.session.query(MaterialData).delete()
                    db.session.query(NodeAnnotation).delete()
                    db.session.commit()
                except: db.session.rollback()

                cleaner = None
                try: cleaner = BedrockCleaner()
                except: pass
                
                results = []
                total = len(df)
                yield f"data: {json.dumps({'type': 'start', 'total': total})}\n\n"
                
                for idx, row in df.iterrows():
                    for event in process_row(row, idx, total, client, cleaner):
                        if event['type'] == 'log':
                            yield f"data: {json.dumps(event)}\n\n"
                        elif event['type'] == 'result':
                            base_result = event['data']
                            
                            # Robust Metadata Extraction
                            raw_brands = get_col_val(row, ['Brand', 'Brands', 'Item used for Brand'], "N/A")
                            brands = [b.strip() for b in raw_brands.split(',')] if raw_brands != 'N/A' else ['N/A']
                            
                            item_code = get_col_val(row, ['Item code', 'Code'], "N/A")
                            plant = get_col_val(row, ['Factory/Country', 'Plant', 'Factory', 'Country'], "N/A")
                            region = get_col_val(row, ['Region'], "Global")
                            cluster = get_col_val(row, ['Cluster'], "N/A")

                            for brand_name in brands:
                                if not brand_name or brand_name.lower() in ['nan', 'none']: continue
                                
                                result = base_result.copy()
                                material_entry = MaterialData(
                                    filename=filename,
                                    row_number=result['row_number'],
                                    commodity=result['commodity'],
                                    sub_category=result['sub_category'],
                                    item_description=result['item_description'],
                                    brand=brand_name,
                                    item_code=item_code,
                                    plant=plant,
                                    region=region,
                                    cluster=cluster,
                                    enriched_description=result['enriched_description'],
                                    final_search_term=result['final_search_term'],
                                    cas_number=result['cas_number'],
                                    inci_name=result['inci_name'],
                                    synonyms=result['synonyms']
                                )
                                db.session.add(material_entry)
                                db.session.flush()
                                
                                result['id'] = material_entry.id
                                result['brand'] = brand_name # Update brand in result for frontend
                                
                                params = result.get('extracted_parameters', {})
                                for k, v in params.items():
                                    db.session.add(MaterialParameter(material_id=material_entry.id, name=k, value=v))
                                
                                qty = get_col_val(row, ['quantity', 'qty', 'volume'], is_num=True)
                                val = get_col_val(row, ['value', 'amount', 'spend', 'cost'], is_num=True)
                                
                                # Default mock values if missing
                                if qty == 0: qty = 1000.0 
                                if val == 0: val = qty * 45.0 
                                
                                material_entry.quantity = qty
                                material_entry.spend_value = val
                                
                                db.session.commit()
                                results.append(result)
                                yield f"data: {json.dumps({'type': 'row', 'data': result})}\n\n"
                
                out_df = pd.DataFrame([{
                    'Item description': r['item_description'],
                    'Enriched Description': r['enriched_description'],
                    'CAS Number': r['cas_number'],
                    'INCI Name': r['inci_name']
                } for r in results])
                out_filename = f"output_{filename}"
                out_df.to_csv(os.path.join(app.config['OUTPUT_FOLDER'], out_filename), index=False)
                found_count = sum(1 for r in results if r['cas_number'] != 'NOT FOUND')
                yield f"data: {json.dumps({'type': 'complete', 'total': total, 'found': found_count, 'output_file': out_filename})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    return Response(generate(), mimetype='text/event-stream')

@material_bp.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(current_app.config['OUTPUT_FOLDER'], filename), as_attachment=True)

@material_bp.route('/api/clusters')
def clusters():
    sub = request.args.get('subcategory')
    return jsonify(build_db_hierarchy(sub))

@material_bp.route('/api/clusters/sync', methods=['POST'])
def sync_cluster_layout():
    try:
        data = request.json
        for item in data:
            node_id, parent_id = item.get('node_id'), item.get('parent_id')
            ov = ClusterOverride.query.filter_by(node_id=node_id).first()
            if ov: ov.target_parent_id = parent_id
            else: db.session.add(ClusterOverride(node_id=node_id, target_parent_id=parent_id))
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e: return jsonify({"error": str(e)}), 500

@material_bp.route('/api/results')
def get_results():
    try:
        results = MaterialData.query.order_by(MaterialData.row_number).all()
        return jsonify([r.to_dict() for r in results])
    except Exception as e: return jsonify({"error": str(e)}), 500

@material_bp.route('/api/results/<int:row_id>', methods=['PUT'])
def update_result(row_id):
    try:
        row = MaterialData.query.get(row_id)
        if not row: return jsonify({"error": "Not found"}), 404
        data = request.json
        for key in ['item_description', 'enriched_description', 'cas_number', 'inci_name']:
            if key in data: setattr(row, key, data[key])
        db.session.commit()
        return jsonify(row.to_dict())
    except Exception as e: return jsonify({"error": str(e)}), 500

@material_bp.route('/api/subcategories')
def get_subcategories():
    try:
        subs = db.session.query(MaterialData.sub_category).distinct().order_by(MaterialData.sub_category).all()
        return jsonify([s[0] for s in subs if s[0]])
    except Exception as e: return jsonify({"error": str(e)}), 500

@material_bp.route('/api/cluster/move', methods=['POST'])
def move_cluster_node():
    try:
        data = request.json
        source_id, target_id = data.get('source_id'), data.get('target_id')
        ov = ClusterOverride.query.filter_by(node_id=source_id).first()
        if not ov: db.session.add(ClusterOverride(node_id=source_id, target_parent_id=target_id))
        else: ov.target_parent_id = target_id
        db.session.commit()
        return jsonify({"success": True})
    except Exception as e: return jsonify({"error": str(e)}), 500

@material_bp.route('/api/spend-analysis/<material_name>')
def spend_analysis(material_name):
    try:
        search = f"%{material_name}%"
        results = MaterialData.query.filter(
            (MaterialData.final_search_term.ilike(search)) | 
            (MaterialData.enriched_description.ilike(search)) |
            (MaterialData.item_description.ilike(search))
        ).all()
        stats = {}
        for r in results:
            reg = r.region or 'Unknown'
            if reg not in stats: stats[reg] = {'quantity': 0.0, 'value': 0.0}
            stats[reg]['quantity'] += (r.quantity or 0.0)
            stats[reg]['value'] += (r.spend_value or 0.0)
        return jsonify({
            'material': material_name,
            'quantity_data': [{'name': k, 'value': round(v['quantity'], 2)} for k, v in stats.items()],
            'value_data': [{'name': k, 'value': round(v['value'], 2)} for k, v in stats.items()]
        })
    except Exception as e: return jsonify({"error": str(e)}), 500

@material_bp.route('/api/clusters/update', methods=['PUT'])
def update_clusters():
    try:
        data = request.json
        changes = data.get('changes', [])
        applied = 0
        for change in changes:
            ctype = change.get('type')
            if ctype == 'move':
                mat_name, brand = change.get('name'), change.get('brand')
                mat = MaterialData.query.filter_by(item_description=mat_name, brand=brand).first()
                if not mat: mat = MaterialData.query.filter_by(item_description=mat_name).first()
                if mat:
                    new_attrs = change.get('new_attributes', {})
                    if 'CAS' in new_attrs: mat.cas_number = new_attrs['CAS']
                    
                    # Handle Dynamic Parameters
                    param_keys = ['Grade', 'Purity', 'Color']
                    rule = EnrichmentRule.query.filter_by(sub_category=mat.sub_category).first()
                    if rule and rule.parameters:
                        try: param_keys = json.loads(rule.parameters)
                        except: pass
                    
                    for key in param_keys:
                        if key in new_attrs:
                            val = str(new_attrs[key])
                            p_entry = next((p for p in mat.parameters if p.name == key), None)
                            if p_entry: p_entry.value = val
                            else: db.session.add(MaterialParameter(material_id=mat.id, name=key, value=val))
                        else:
                            p_entry = next((p for p in mat.parameters if p.name == key), None)
                            if p_entry: db.session.delete(p_entry)
                    applied += 1
            elif ctype == 'rename':
                mat = MaterialData.query.filter_by(item_description=change.get('old_name')).first()
                if mat:
                    mat.item_description = change.get('new_name')
                    applied += 1
        db.session.commit()
        return jsonify({"success": True, "message": f"Applied {applied} changes"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@material_bp.route('/api/validate/<int:row_id>', methods=['POST'])
def validate_cas(row_id):
    try:
        row = MaterialData.query.get(row_id)
        if not row: return jsonify({"error": "Row not found"}), 404
        file = request.files.get('file')
        doc_type = request.form.get('document_type', 'Other')
        timestamp = int(time.time())
        if not file:
            row.confidence_score = 100
            row.validation_status = 'Validated (Manual)'
            db.session.commit()
            return jsonify(row.to_dict())
        filename = secure_filename(file.filename)
        temp_path = os.path.join(current_app.config['UPLOAD_FOLDER'], f"tmp_{timestamp}_{filename}")
        file.save(temp_path)
        text_content = ""
        if filename.lower().endswith('.pdf'):
            try:
                reader = PdfReader(temp_path)
                for page in reader.pages: text_content += (page.extract_text() or "") + "\n"
            except: pass
        
        # Bedrock Extraction & Verification
        if text_content:
            try:
                cleaner = BedrockCleaner()
                # 1. Verification
                is_verified = cleaner.verify_cas_match(text_content, row.cas_number)
                if not is_verified:
                    os.remove(temp_path)
                    return jsonify({"error": f"Document does not confirm CAS {row.cas_number}"}), 400
                
                # 2. Extract & Update Parameters
                rule = EnrichmentRule.query.filter_by(sub_category=row.sub_category).first()
                if rule:
                    p_keys = json.loads(rule.parameters) if rule.parameters else []
                    extracted = cleaner.extract_parameters(text_content, rule.identifier_name, p_keys)
                    if extracted:
                        new_cas = extracted.get(rule.identifier_name, "N/A")
                        if new_cas != "N/A": row.cas_number = new_cas
                        
                        # Sync MaterialParameters
                        for p_name in p_keys:
                            p_val = extracted.get(p_name, "N/A")
                            if p_val != "N/A":
                                p_entry = next((p for p in row.parameters if p.name == p_name), None)
                                if p_entry: p_entry.value = p_val
                                else: db.session.add(MaterialParameter(material_id=row.id, name=p_name, value=p_val))
                        
                        # Regenerate Description
                        parts = [row.item_description.lower().replace(' ', '')]
                        if row.cas_number and row.cas_number != "NOT FOUND":
                            parts.extend([rule.identifier_name.lower(), row.cas_number])
                        for p_name in p_keys:
                            p_val = next((p.value for p in row.parameters if p.name == p_name), "N/A")
                            if p_val != "N/A": parts.extend([p_name.lower(), p_val])
                        row.enriched_description = "_".join(parts)
            except Exception as e: print(f"Validation extract error: {e}")

        # Storage logic
        file_path = ""
        if current_app.config.get('USE_S3'):
            import boto3
            s3 = boto3.client('s3')
            s3_key = f"validation_docs/{row_id}/{timestamp}_{filename}"
            try:
                with open(temp_path, 'rb') as f:
                    s3.upload_fileobj(f, current_app.config['S3_BUCKET'], s3_key, ExtraArgs={'ContentType': 'application/pdf'})
                file_path = f"s3://{current_app.config['S3_BUCKET']}/{s3_key}"
                os.remove(temp_path)
            except Exception as e: return jsonify({"error": f"S3 Error: {e}"}), 500
        else:
            local_path = os.path.join(current_app.config['UPLOAD_FOLDER'], f"val_{row_id}_{timestamp}_{filename}")
            os.rename(temp_path, local_path)
            file_path = local_path
        
        # Meta update
        from datetime import datetime
        docs = json.loads(row.validation_documents) if row.validation_documents else []
        docs.append({"type": doc_type, "filename": filename, "path": file_path, "uploaded_at": datetime.utcnow().isoformat()})
        row.validation_documents = json.dumps(docs)
        row.confidence_score = 100
        row.validation_status = f'Validated ({len(docs)} docs)'
        db.session.commit()
        return jsonify(row.to_dict())
    except Exception as e: return jsonify({"error": str(e)}), 500

@material_bp.route('/api/rules', methods=['GET', 'POST'])
@material_bp.route('/api/rules/<int:rule_id>', methods=['DELETE'])
def handle_rules(rule_id=None):
    if request.method == 'DELETE':
        rule = EnrichmentRule.query.get(rule_id)
        if rule:
            db.session.delete(rule)
            db.session.commit()
            return jsonify({"success": True})
        return jsonify({"error": "Not found"}), 404
    
    if request.method == 'POST':
        data = request.json
        sub = data.get('sub_category')
        rule = EnrichmentRule.query.filter_by(sub_category=sub).first()
        if not rule:
            rule = EnrichmentRule(sub_category=sub)
            db.session.add(rule)
        rule.identifier_name = data.get('identifier_name', 'CAS')
        rule.parameters = json.dumps(data.get('parameters', []))
        rule.purity_rules = json.dumps(data.get('purity_rules', []))
        rule.hierarchy = json.dumps(data.get('hierarchy', []))
        db.session.commit()
        return jsonify({"success": True})
    
    rules = EnrichmentRule.query.all()
    return jsonify([r.to_dict() for r in rules])

@material_bp.route('/api/annotations', methods=['GET', 'POST'])
def handle_annotations():
    if request.method == 'POST':
        data = request.json
        ann = NodeAnnotation(
            node_type=data.get('node_type'),
            node_identifier=data.get('node_identifier'),
            annotation_type=data.get('annotation_type', 'info'),
            content=data.get('content'),
            question=data.get('question'),
            answer=data.get('answer')
        )
        if ann.annotation_type == 'qa': ann.is_open = not bool(data.get('answer'))
        db.session.add(ann)
        db.session.commit()
        return jsonify(ann.to_dict())
    
    node_type = request.args.get('node_type')
    node_identifier = request.args.get('node_identifier')
    query = NodeAnnotation.query
    if node_type and node_identifier:
        query = query.filter_by(node_type=node_type, node_identifier=node_identifier)
    anns = query.order_by(NodeAnnotation.created_at.desc()).all()
    return jsonify([a.to_dict() for a in anns])

@material_bp.route('/api/annotations/<int:ann_id>', methods=['DELETE', 'PUT'])
def modify_annotation(ann_id):
    ann = NodeAnnotation.query.get(ann_id)
    if not ann: return jsonify({"error": "Not found"}), 404
    if request.method == 'DELETE':
        db.session.delete(ann)
        db.session.commit()
        return jsonify({"success": True})
    data = request.json
    if 'answer' in data:
        ann.answer = data['answer']
        if ann.annotation_type == 'qa': ann.is_open = not bool(ann.answer)
    db.session.commit()
    return jsonify(ann.to_dict())
