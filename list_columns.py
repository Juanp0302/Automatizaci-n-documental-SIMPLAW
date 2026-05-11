
import sqlite3
conn = sqlite3.connect('backend/sql_app.db')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(documents)")
print(cursor.fetchall())
conn.close()
