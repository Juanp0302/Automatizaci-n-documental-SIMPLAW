import sqlite3

def check_db():
    conn = sqlite3.connect('backend/sql_app.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, ai_review_summary FROM documents ORDER BY id DESC LIMIT 3")
    rows = cursor.fetchall()
    for r in rows:
        print(r)
    conn.close()

if __name__ == '__main__':
    check_db()
