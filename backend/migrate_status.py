import sqlite3
conn = sqlite3.connect('sql_app.db')
cursor = conn.cursor()
cursor.execute("UPDATE extracted_documents SET review_status = 'pending' WHERE review_status = 'none'")
conn.commit()
print(f"Updated {cursor.rowcount} documents.")
conn.close()
