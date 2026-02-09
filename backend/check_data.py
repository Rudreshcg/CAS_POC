from app import app
from models import db, SpendRecord
from sqlalchemy import func

def check_distribution():
    with app.app_context():
        print("PO Type Distribution:")
        result = db.session.query(SpendRecord.po_type, func.count(SpendRecord.id)).group_by(SpendRecord.po_type).all()
        for r in result:
            print(f"  {r[0]}: {r[1]}")
            
        print("\nPO Status Distribution:")
        result = db.session.query(SpendRecord.po_status, func.count(SpendRecord.id)).group_by(SpendRecord.po_status).all()
        for r in result:
            print(f"  {r[0]}: {r[1]}")
            
        print("\nPayment Term Distribution (Top 10):")
        result = db.session.query(SpendRecord.payment_term, func.count(SpendRecord.id)).group_by(SpendRecord.payment_term).order_by(func.count(SpendRecord.id).desc()).limit(10).all()
        for r in result:
            print(f"  {r[0]}: {r[1]}")

if __name__ == "__main__":
    check_distribution()
