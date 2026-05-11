
import sqlite3
import os

db_path = 'backend/sql_app.db'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT title, generated_file_path FROM documents;")
    docs = cursor.fetchall()
    for d in docs:
        try:
            print(f"Doc: {d[0]} -> {d[1]}")
            if d[1]:
                full_path = d[1]
                if not os.path.isabs(full_path):
                    full_path = os.path.join('backend', full_path)
                print(f"  File exists: {os.path.exists(full_path)}")
        except:
            print(f"Doc: [Unicode Error] -> {d[1]}")
    conn.close()
