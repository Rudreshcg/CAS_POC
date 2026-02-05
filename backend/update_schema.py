from app import app, db
from sqlalchemy import text

def update_schema():
    with app.app_context():
        print("Checking for missing columns...")
        try:
            # Check if enriched_description exists in spend_record
            with db.engine.connect() as conn:
                conn.execute(text("SELECT enriched_description FROM spend_record LIMIT 1"))
                print("Column 'enriched_description' already exists.")
        except Exception:
            print("Adding column 'enriched_description' to 'spend_record'...")
            try:
                with db.engine.connect() as conn:
                    conn.execute(text("ALTER TABLE spend_record ADD COLUMN enriched_description VARCHAR(500)"))
                    conn.commit()
                print("Successfully added 'enriched_description' column.")
            except Exception as e:
                print(f"Error adding column: {e}")

        try:
            # Check if cas_number exists in spend_record
            with db.engine.connect() as conn:
                conn.execute(text("SELECT cas_number FROM spend_record LIMIT 1"))
                print("Column 'cas_number' already exists.")
        except Exception:
            print("Adding column 'cas_number' to 'spend_record'...")
            try:
                with db.engine.connect() as conn:
                    conn.execute(text("ALTER TABLE spend_record ADD COLUMN cas_number VARCHAR(100)"))
                    conn.commit()
                print("Successfully added 'cas_number' column.")
            except Exception as e:
                print(f"Error adding column: {e}")

        try:
            # Also check for user_preference table
            from models import UserPreference
            db.create_all()
            print("Ensured all tables (including UserPreference) are created.")
        except Exception as e:
            print(f"Error ensuring tables: {e}")

if __name__ == "__main__":
    update_schema()
