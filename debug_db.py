from sqlalchemy import create_engine, text
import os

# Hardcoded DB path based on config.py
db_path = os.path.join(os.getcwd(), "backend", "sql_app.db")
db_url = f"sqlite:///{db_path}"

engine = create_engine(db_url)

with engine.connect() as connection:
    print(f"Connecting to: {db_url}")
    result = connection.execute(text("SELECT id, title, variables_schema, file_path, owner_id FROM templates"))
    print("Templates found:", result.rowcount)
    for row in result:
        print(f"ID: {row.id}, Title: {row.title}")
        print(f"  Schema Type: {type(row.variables_schema)}")
        print(f"  Schema Value: {row.variables_schema!r}")
        print(f"  File Path: {row.file_path}")
        print(f"  Exists: {os.path.exists(row.file_path)}")
