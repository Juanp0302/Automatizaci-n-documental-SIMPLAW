import sqlite3

def check_db():
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()
    
    print("Tables:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    for table in tables:
        print(f"- {table[0]}")
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"  Count: {count}")
    
    print("\nDocuments (extracted_documents):")
    try:
        cursor.execute("SELECT id, file_name, status, review_status FROM extracted_documents")
        docs = cursor.fetchall()
        for doc in docs:
            print(f"  {doc}")
    except Exception as e:
        print(f"  Error: {e}")
        
    conn.close()

if __name__ == "__main__":
    check_db()
