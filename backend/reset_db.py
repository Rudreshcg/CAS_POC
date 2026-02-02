from app import app, db
from models import MaterialData, MaterialParameter, NodeAnnotation, ClusterOverride

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Recreating all tables with new schema...")
    db.create_all()
    print("✅ Database schema updated successfully (Region column added).")
