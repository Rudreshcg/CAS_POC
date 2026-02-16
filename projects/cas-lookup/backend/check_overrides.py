import sqlite3
import os

db_path = r'c:\SMC-MAX\CAS_POC\backend\cas_database.db'
if not os.path.exists(db_path):
    # Try alternate path just in case
    db_path = r'c:\SMC-MAX\CAS_POC\backend\backend\cas_database.db'
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT * FROM cluster_override LIMIT 20;")
rows = cursor.fetchall()
for row in rows:
    print(row)
conn.close()
