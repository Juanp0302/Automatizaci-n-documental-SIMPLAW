import sqlite3

# Connect to the database
conn = sqlite3.connect(r'c:\Users\Usuario\Documents\Proyectos AUT\Automatización Documental\backend\sql_app.db')
cursor = conn.cursor()

# Get table info for 'templates'
cursor.execute("PRAGMA table_info(templates)")
columns = cursor.fetchall()

print("Columns in 'templates' table:")
found_description = False
for col in columns:
    print(col)
    if col[1] == 'description':
        found_description = True

if found_description:
    print("\n✅ 'description' column FOUND.")
else:
    print("\n❌ 'description' column NOT FOUND.")

conn.close()
