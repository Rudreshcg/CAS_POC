from app import app, db
from models import SpendRecord
import json

with app.app_context():
    record = SpendRecord.query.first()
    if record:
        print(json.dumps(record.to_dict(), indent=2))
    else:
        print("No records found")
