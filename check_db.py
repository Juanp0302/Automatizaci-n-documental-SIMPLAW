import sqlite3
import sys

conn = sqlite3.connect('/app/sql_app.db')
try:
    users = conn.execute('SELECT id, email, is_active, is_superuser FROM users').fetchall()
    print(f"Usuarios encontrados: {len(users)}")
    for u in users:
        print(f"  id={u[0]} email={u[1]} active={u[2]} superuser={u[3]}")
    templates = conn.execute('SELECT COUNT(*) FROM templates').fetchone()[0]
    print(f"Templates: {templates}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
