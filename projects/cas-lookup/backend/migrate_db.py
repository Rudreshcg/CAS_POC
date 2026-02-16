"""
Database Migration Script
Adds validation columns to existing cas_lookup_result table
"""
import sqlite3
import os

db_path = 'cas_database.db'

if os.path.exists(db_path):
    print(f"Found database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current schema
    cursor.execute("PRAGMA table_info(cas_lookup_result)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Current columns: {columns}")
    
    # Add missing columns
    if 'confidence_score' not in columns:
        print("Adding confidence_score column...")
        cursor.execute("ALTER TABLE cas_lookup_result ADD COLUMN confidence_score INTEGER DEFAULT 70")
        print("✓ Added confidence_score")
    
    if 'validation_status' not in columns:
        print("Adding validation_status column...")
        cursor.execute("ALTER TABLE cas_lookup_result ADD COLUMN validation_status VARCHAR(50) DEFAULT 'Pending'")
        print("✓ Added validation_status")
    
    if 'validation_documents' not in columns:
        print("Adding validation_documents column...")
        cursor.execute("ALTER TABLE cas_lookup_result ADD COLUMN validation_documents TEXT DEFAULT '[]'")
        print("✓ Added validation_documents")
    
    conn.commit()
    conn.close()
    print("\n✅ Migration complete!")
else:
    print(f"No database found at {db_path}")
    print("Database will be created with correct schema on next app start.")
