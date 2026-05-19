from sqlalchemy import create_engine, text
import os

DATABASE_URL = "sqlite:///./backend/sql_app.db"
engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    print("--- USERS ---")
    users = connection.execute(text("SELECT id, email, is_superuser, has_extractor_access FROM users")).fetchall()
    for user in users:
        print(user)

    print("\n--- EXTRACTOR PROJECTS ---")
    projects = connection.execute(text("SELECT id, name, owner_id, root_folder FROM extractor_projects")).fetchall()
    for project in projects:
        print(project)

    print("\n--- EXTRACTION RULES ---")
    try:
        rules = connection.execute(text("SELECT id, project_id, name, logic_type FROM extraction_rules")).fetchall()
        for rule in rules:
            print(rule)
    except Exception as e:
        print(f"Error reading extraction_rules: {e}")
