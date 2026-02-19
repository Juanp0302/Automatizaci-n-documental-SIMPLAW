import sqlite3

db_path = r'c:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\backend\sql_app.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(f"Connected to database at {db_path}")
    
    # Check if column already exists to avoid error
    cursor.execute("PRAGMA table_info(templates)")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    
    if 'description' in column_names:
        print("Column 'description' already exists. No changes needed.")
    else:
        print("Adding 'description' column...")
        cursor.execute("ALTER TABLE templates ADD COLUMN description VARCHAR")
        conn.commit()
        print("✅ Column 'description' added successfully.")
        
    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")
