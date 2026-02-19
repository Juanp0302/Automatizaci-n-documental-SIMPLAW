import sqlite3
import os

DB_PATH = "c:/Users/Usuario/Documents/Proyectos AUT/Automatización Documental/backend/sql_app.db"

if not os.path.exists(DB_PATH):
    print(f"Database not found at {DB_PATH}")
    exit(1)

try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables found:", tables)
    conn.close()
except Exception as e:
    print(f"Error inspecting DB: {e}")
