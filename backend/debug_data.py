from app import app, db, MaterialData
import sys

# Set encoding to utf-8 for console output
sys.stdout.reconfigure(encoding='utf-8')

with app.app_context():
    materials = MaterialData.query.all()
    print(f"Total materials: {len(materials)}")
    for m in materials:
        # Use repr to see exact string content including hidden chars
        print(f"ID: {m.id} | Desc: {m.item_description} | Brand: {repr(m.brand)} | CAS: {m.cas_number}")
