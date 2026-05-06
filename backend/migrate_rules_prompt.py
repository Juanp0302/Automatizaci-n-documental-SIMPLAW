import sqlite3

def migrate_rules():
    db_path = r'c:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\backend\sql_app.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if 'prompt' column exists in 'extraction_rules'
    cursor.execute("PRAGMA table_info(extraction_rules)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'prompt' not in columns:
        print("Adding 'prompt' column to 'extraction_rules' table...")
        try:
            cursor.execute("ALTER TABLE extraction_rules ADD COLUMN prompt TEXT")
            conn.commit()
            print("✅ Column 'prompt' added successfully.")
        except Exception as e:
            print(f"❌ Error adding column: {e}")
    else:
        print("✅ Column 'prompt' already exists in 'extraction_rules'.")
        
    conn.close()

if __name__ == "__main__":
    migrate_rules()
