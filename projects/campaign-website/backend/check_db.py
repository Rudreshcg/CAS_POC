import sqlite3
import os

db_path = 'campaigns.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} does not exist.")
else:
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("SELECT slug FROM campaigns")
        rows = c.fetchall()
        if not rows:
            print("No campaigns found in database.")
        else:
            print("Campaign slugs found:")
            for row in rows:
                print(f" - {row[0]}")
        conn.close()
    except Exception as e:
        print(f"Error connecting to database: {e}")
