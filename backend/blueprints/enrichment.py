from flask import Blueprint, jsonify, request, current_app
import threading
from datetime import datetime
from models import db, SpendRecord
from llm_helper import BedrockCleaner
from chemical_utils import hyper_clean_chemical

enrichment_bp = Blueprint('enrichment', __name__)

# Global state for enrichment progress
enrichment_progress = {
    "status": "idle",
    "total": 0,
    "current": 0,
    "processed": 0,
    "errors": 0,
    "last_run": None
}

def run_enrichment_task(app, descriptions):
    global enrichment_progress
    enrichment_progress["status"] = "running"
    enrichment_progress["total"] = len(descriptions)
    enrichment_progress["current"] = 0
    enrichment_progress["processed"] = 0
    enrichment_progress["errors"] = 0
    
    try:
        cleaner = BedrockCleaner()
    except Exception as e:
        print(f"Failed to init cleaner in background: {e}")
        enrichment_progress["status"] = "failed"
        return

    with app.app_context():
        for (raw_desc,) in descriptions:
            if not raw_desc:
                enrichment_progress["current"] += 1
                continue
                
            try:
                # Use get_chemical_details to get both INC and CAS
                details = cleaner.get_chemical_details(raw_desc)
                if details and (details.get('inci') != "NOT FOUND" or details.get('cas') != "NOT FOUND"):
                    name = details.get('inci') if details.get('inci') != "NOT FOUND" else raw_desc
                    cas = details.get('cas') if details.get('cas') != "NOT FOUND" else ""
                    
                    # Standardized format: Name_cas_Number (e.g., Glycerin_cas_56-81-5)
                    name_clean = hyper_clean_chemical(name).title().replace(' ', '')
                    
                    # We MUST have both a meaningful name and a CAS number
                    if name_clean and len(name_clean) > 2 and cas and cas != "NOT FOUND":
                        enriched_formatted = f"{name_clean}_cas_{cas}"
                        
                        # Update all records with this raw description in both tables
                        SpendRecord.query.filter_by(item_description=raw_desc).update(
                            {
                                "enriched_description": enriched_formatted,
                                "cas_number": cas
                            }
                        )
                        
                        from models import MaterialData
                        MaterialData.query.filter_by(item_description=raw_desc).update(
                            {
                                "enriched_description": enriched_formatted,
                                "cas_number": cas,
                                "inci_name": name
                            }
                        )
                    else:
                        # If either is missing, do not apply the standardized format
                        # This keeps it clean from "_cas_123" noise
                        pass
                    
                    db.session.commit()
                    enrichment_progress["processed"] += 1
                else:
                    # No high-quality match found with both name and CAS.
                    # Per user request: "use the correct material name and cas both else keep empty"
                    # We skip the update to keep the field empty/null.
                    enrichment_progress["errors"] += 1
            except Exception as e:
                print(f"Enrichment error for {raw_desc}: {e}")
                enrichment_progress["errors"] += 1
            
            enrichment_progress["current"] += 1
    
    enrichment_progress["status"] = "done"
    enrichment_progress["last_run"] = datetime.utcnow().isoformat()

@enrichment_bp.route('/api/spend-analysis/clear-enrichment', methods=['POST'])
def clear_enrichment():
    try:
        # Clear enriched descriptions in both tables
        SpendRecord.query.update({"enriched_description": None, "cas_number": None})
        from models import MaterialData
        MaterialData.query.update({"enriched_description": None, "cas_number": None})
        db.session.commit()
        return jsonify({"message": "All enrichment data cleared", "status": "done"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@enrichment_bp.route('/api/spend-analysis/enrich', methods=['POST'])
def trigger_spend_enrichment():
    try:
        # Find all items that are missing the new standardized format
        query = db.session.query(SpendRecord.item_description).filter(
            db.or_(
                SpendRecord.enriched_description == None,
                SpendRecord.enriched_description == "",
                db.not_(SpendRecord.enriched_description.like('%_cas_%'))
            )
        )
        
        unique_descriptions = query.distinct().all()
        print(f"DEBUG: Found {len(unique_descriptions)} unique items for global enrichment trigger.")
        
        if not unique_descriptions:
            return jsonify({"message": "No unenriched items found", "status": "done"})

        # Reset global progress before starting
        global enrichment_progress
        enrichment_progress["status"] = "running"
        enrichment_progress["total"] = len(unique_descriptions)
        enrichment_progress["current"] = 0
        enrichment_progress["processed"] = 0
        enrichment_progress["errors"] = 0

        # Start background thread
        thread = threading.Thread(
            target=run_enrichment_task, 
            args=(current_app._get_current_object(), unique_descriptions)
        )
        thread.start()
        
        return jsonify({"message": "Enrichment started", "status": "running", "total": len(unique_descriptions)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@enrichment_bp.route('/api/spend-analysis/enrich-status')
def get_enrichment_status():
    return jsonify(enrichment_progress)
