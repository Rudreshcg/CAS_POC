"""
Spend Data Management Script
=============================
This script loads spend data from the Purchase History Excel file into the database.
It handles all 25 columns and ensures robust data ingestion.
"""

import os
import sys
import pandas as pd
# Fix path if run directly
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app import app, db
from models import SpendRecord

def clear_spend_data():
    """Clear all existing spend records from the database"""
    try:
        with app.app_context():
            count = SpendRecord.query.count()
            db.session.query(SpendRecord).delete()
            db.session.commit()
            print(f"✅ Cleared {count} existing spend records")
    except Exception as e:
        print(f"❌ Error clearing data: {e}")
        db.session.rollback()

def load_spend_data():
    """Load spend data from Excel file into database"""
    print("🚀 Starting Spend Data Ingestion from Excel...")
    
    try:
        with app.app_context():
            # Check if data already exists
            existing_count = SpendRecord.query.count()
            if existing_count > 0:
                print(f"⚠️  Database already contains {existing_count} spend records.")
                response = input("Do you want to clear and reload? (y/n): ")
                if response.lower() != 'y':
                    print("❌ Operation cancelled")
                    return
                clear_spend_data()
            
            # Load Excel file
            xlsx_path = os.path.join(current_dir, 'Purchase History.xlsx')
            if not os.path.exists(xlsx_path):
                print(f"❌ Purchase History.xlsx not found at: {xlsx_path}")
                return
            
            # Read Excel with no header (we'll map manually)
            print("📊 Reading Excel file...")
            df = pd.read_excel(xlsx_path, sheet_name='Sheet1', header=None, engine='openpyxl')
            
            print(f"📊 Processing {len(df)} rows...")
            
            # Helper function to safely parse float values
            def parse_float(val):
                try:
                    if pd.isna(val): return 0.0
                    return float(str(val).replace(',', '').strip())
                except:
                    return 0.0
            
            # Helper function to safely get string values
            def parse_str(val):
                if pd.isna(val): return None
                return str(val).strip()
            
            records = []
            skipped = 0
            
            for idx, row in df.iterrows():
                # Skip header row or empty rows
                if idx == 0 or (pd.isna(row[9]) and pd.isna(row[12])):
                    skipped += 1
                    continue
                
                try:
                    # Amount is base_price_inr (Index 20)
                    base_price_inr = parse_float(row[20])
                    
                    record = SpendRecord(
                        operating_unit=parse_str(row[0]),
                        po_number=parse_str(row[1]),
                        po_date=parse_str(row[2]),
                        month=parse_str(row[3]),
                        year=parse_str(row[4]),
                        po_type=parse_str(row[5]),
                        po_status=parse_str(row[6]),
                        buyer_name=parse_str(row[7]),
                        supplier_number=parse_str(row[8]),
                        vendor_name=parse_str(row[9]) or "Unknown",
                        supplier_site=parse_str(row[10]),
                        item_code=parse_str(row[11]),
                        item_description=parse_str(row[12]) or "Unknown",
                        quantity=parse_float(row[13]),
                        uom=parse_str(row[14]),
                        currency=parse_str(row[15]),
                        exchange_rate=parse_float(row[16]),
                        price=parse_float(row[17]),
                        payment_term=parse_str(row[18]),
                        base_price_fc=parse_float(row[19]),
                        base_price_inr=base_price_inr,
                        amount=base_price_inr, # Compatibility alias
                        freight_terms=parse_str(row[21]) if len(row) > 21 else None,
                        ship_via=parse_str(row[22]) if len(row) > 22 else None,
                        fob_dsp=parse_str(row[23]) if len(row) > 23 else None,
                        is_contract=False
                    )
                    records.append(record)
                    
                    if len(records) % 1000 == 0:
                        print(f"  Processed {len(records)} records...")
                        
                except Exception as e:
                    print(f"⚠️  Error processing row {idx}: {e}")
                    skipped += 1
                    continue
            
            if records:
                print(f"💾 Saving {len(records)} records to database...")
                db.session.bulk_save_objects(records)
                db.session.commit()
                print(f"✅ Successfully ingested {len(records)} spend records.")
                
                # Verify
                total_spend = db.session.query(db.func.sum(SpendRecord.amount)).scalar() or 0
                print(f"📈 Total Spend in DB: ₹{total_spend:,.2f}")
            else:
                print("⚠️  No valid records found.")
        
    except Exception as e:
        print(f"❌ Ingestion Failed: {e}")
        import traceback
        traceback.print_exc()

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--clear', action='store_true')
    args = parser.parse_args()
    
    if args.clear:
        clear_spend_data()
    else:
        load_spend_data()

if __name__ == '__main__':
    main()
