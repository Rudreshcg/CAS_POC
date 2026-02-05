from app import app, db
from models import SpendRecord
import json

with app.app_context():
    # Get unique combinations of supplier_site and operating_unit
    results = db.session.query(
        SpendRecord.supplier_site, 
        SpendRecord.operating_unit
    ).distinct().all()
    
    sites = []
    for site, unit in results:
        sites.append({
            "site": site,
            "unit": unit
        })
    
    with open('unique_sites.json', 'w', encoding='utf-8') as f:
        json.dump(sites, f, indent=2)
    print("Successfully wrote unique_sites.json")
