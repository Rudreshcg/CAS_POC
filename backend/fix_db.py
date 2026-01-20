"""
Database Fix Script - Recreate table with correct schema
"""
import sqlite3
import os

db_path = 'cas_database.db'

print(f"Fixing database: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Drop the old table
print("Dropping old table...")
cursor.execute("DROP TABLE IF EXISTS cas_lookup_result")

# Create new table with correct schema
print("Creating new table with validation columns...")
cursor.execute("""
CREATE TABLE cas_lookup_result (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    row_number INTEGER NOT NULL,
    commodity VARCHAR(255),
    sub_category VARCHAR(255),
    item_description TEXT,
    enriched_description TEXT,
    final_search_term VARCHAR(255),
    cas_number VARCHAR(50),
    inci_name VARCHAR(255),
    synonyms TEXT,
    created_at DATETIME,
    confidence_score INTEGER DEFAULT 70,
    validation_status VARCHAR(50) DEFAULT 'Pending',
    validation_documents TEXT DEFAULT '[]'
)
""")

conn.commit()
conn.close()
print("✅ Database fixed! Table recreated with all validation columns.")
