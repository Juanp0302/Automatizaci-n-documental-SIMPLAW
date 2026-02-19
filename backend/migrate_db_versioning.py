import sqlite3
import os

DB_FILE = "sql_app.db"

def add_columns():
    if not os.path.exists(DB_FILE):
        print(f"Database {DB_FILE} not found.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(documents)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "version" not in columns:
            print("Adding 'version' column...")
            cursor.execute("ALTER TABLE documents ADD COLUMN version INTEGER DEFAULT 1")
        else:
            print("'version' column already exists.")

        if "parent_id" not in columns:
            print("Adding 'parent_id' column...")
            # SQLite supports ADD COLUMN with REFERENCES but it doesn't enforce FK by default without PRAGMA foreign_keys=ON during operation
            # However, for structure it's fine.
            cursor.execute("ALTER TABLE documents ADD COLUMN parent_id INTEGER REFERENCES documents(id)")
        else:
            print("'parent_id' column already exists.")

        conn.commit()
        print("Migration completed successfully.")

    except Exception as e:
        print(f"Error migrating database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_columns()
