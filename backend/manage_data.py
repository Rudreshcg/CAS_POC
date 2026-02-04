import sys
import os
import pandas as pd
from app import app, db, SpendRecord

def get_status():
    with app.app_context():
        count = SpendRecord.query.count()
        print(f"\n📊 Current Database Status:")
        print(f"   - Database File: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print(f"   - Total Spend Records: {count}")
        return count

def reload_data():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    xlsx_path = os.path.join(current_dir, 'Purchase History.xlsx')
    
    if not os.path.exists(xlsx_path):
        print(f"❌ Error: Source file not found at {xlsx_path}")
        return

    with app.app_context():
        print(f"🚀 Starting Data Reload...")
        print("   1. Clearing existing Spend Records...")
        try:
            num_deleted = db.session.query(SpendRecord).delete()
            db.session.commit()
            print(f"      ✅ Deleted {num_deleted} rows.")
        except Exception as e:
            db.session.rollback()
            print(f"      ❌ Failed to clear table: {e}")
            return

        print("   2. Reading Excel file (this may take a moment)...")
        try:
            df = pd.read_excel(xlsx_path, sheet_name='Sheet1', header=None, engine='openpyxl')
            print(f"      📊 Found {len(df)} rows in Excel.")
            
            records = []
            valid_count = 0
            
            # Mimic the relaxed logic from app.py
            for idx, row in df.iterrows():
                # Check description/vendor validity
                desc = str(row[12]) if pd.notna(row[12]) else ""
                vendor = str(row[9]) if pd.notna(row[9]) else ""
                
                if not desc.strip() and not vendor.strip():
                    continue

                # Parse Amount (Default to 0.0)
                amount_val = 0.0
                try:
                    raw_amt = str(row[20])
                    if pd.notna(row[20]) and any(c.isdigit() for c in raw_amt):
                        amount_val = float(raw_amt.replace(',', '').strip())
                except:
                    amount_val = 0.0

                try:
                    record = SpendRecord(
                        operating_unit=str(row[0]) if pd.notna(row[0]) else None,
                        po_number=str(row[1]) if pd.notna(row[1]) else None,
                        po_date=str(row[2]) if pd.notna(row[2]) else None,
                        vendor_name=vendor if vendor else "Unknown",
                        item_description=desc if desc else "Unknown",
                        amount=amount_val,
                        is_contract=False
                    )
                    records.append(record)
                    valid_count += 1
                except Exception as e:
                    continue

            if records:
                db.session.bulk_save_objects(records)
                db.session.commit()
                print(f"   3. ✅ Successfully ingested {len(records)} records.")
            else:
                print("   ⚠️ No valid records found to ingest.")

        except Exception as e:
            print(f"   ❌ Ingestion Failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == 'reload':
        reload_data()
    else:
        get_status()
        print("\n💡 Usage:")
        print("   python manage_data.py        (Check status)")
        print("   python manage_data.py reload (Force reload from Excel)")
