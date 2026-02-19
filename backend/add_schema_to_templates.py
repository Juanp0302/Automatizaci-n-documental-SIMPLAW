import sqlite3
import os

# Get absolute path to db
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, 'sql_app.db')

def migrate():
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print(f"Connected to database at {db_path}")
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(templates)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        if 'variables_schema' in column_names:
            print("Column 'variables_schema' already exists. No changes needed.")
        else:
            print("Adding 'variables_schema' column...")
            # JSON type in SQLite is usually TEXT, handled by SQLAlchemy as JSON
            cursor.execute("ALTER TABLE templates ADD COLUMN variables_schema TEXT")
            conn.commit()
            print("✅ Column 'variables_schema' added successfully.")
            
        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    migrate()
