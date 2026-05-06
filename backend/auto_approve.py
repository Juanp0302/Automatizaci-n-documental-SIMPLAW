import sqlite3
conn = sqlite3.connect('sql_app.db')
cursor = conn.cursor()

# Buscar el umbral del proyecto (asumiendo ID 1 para este caso de prueba)
cursor.execute("SELECT confidence_threshold FROM extractor_projects WHERE id = 1")
threshold = cursor.fetchone()[0] or 0.7

# Auto-aprobar documentos con alta confianza
cursor.execute("""
    UPDATE extracted_documents 
    SET review_status = 'approved' 
    WHERE review_status = 'pending' 
    AND classification_confidence >= ?
""", (threshold,))

print(f"Auto-approved {cursor.rowcount} documents based on classification confidence.")

# También podríamos revisar los campos, pero para el mock esto es suficiente
conn.commit()
conn.close()
