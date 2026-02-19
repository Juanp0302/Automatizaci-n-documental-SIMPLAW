import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db.session import SessionLocal
from app.api import deps
from app import crud, schemas, models
from app.core import security

def main():
    db = SessionLocal()
    try:
        # 1. Get a user
        user = db.query(models.User).filter(models.User.email == "admin@example.com").first()
        if not user:
            print("Admin user not found, cannot test.")
            return

        # 2. Get a template (or create one if none exists)
        template = db.query(models.Template).first()
        if not template:
             # Create dummy template
             template_in = schemas.TemplateCreate(
                 title="Test Template for Schema",
                 file_path="backend/templates/test.docx" # Dummy path
             )
             template = crud.template.create_with_owner(db, obj_in=template_in, owner_id=user.id)
             print(f"Created template {template.id}")
        else:
            print(f"Using template {template.id}")

        # 3. Define a schema
        schema = [
            {
                "name": "warranty",
                "label": "Tipo de Garantía",
                "type": "select",
                "options": ["Total", "Parcial", "Ninguna"]
            },
            {
                "name": "reject_reason",
                "label": "Razón de Rechazo",
                "type": "text",
                "show_if": {
                    "field": "warranty",
                    "value": "Ninguna"
                }
            }
        ]

        # 4. Update the template with the schema
        print("Updating template with schema...")
        template_update = schemas.TemplateUpdate(variables_schema=schema)
        
        # Test serialization manually first (simulating what API/CRUD does)
        # Note: We are testing the CRUD logic here, not the API endpoint directly unless we use requests
        # But verify_schema_storage.py should test the DB logic.
        
        updated_template = crud.template.update(db, db_obj=template, obj_in=template_update)
        
        # 5. Verify it was saved
        db.refresh(updated_template)
        print(f"Template schema from DB: {updated_template.variables_schema}")
        print(f"Type: {type(updated_template.variables_schema)}")
        
        # The schema in the object should be a list of dicts (thanks to Pydantic Json type)
        # or it might be raw string if accessed directly via SQLAlchemy model unless Pydantic parsed it?
        # Standard SQLAlchemy model access returns the Python type mapped by the Column.
        # Since Column is String, it should be a string.
        # WAIT. I modified `schemas/template.py` (Pydantic), not `models/template.py` (SQLAlchemy).
        # So `updated_template.variables_schema` (SQLAlchemy model instance) will be a STRING (json serialized).
        # We need to parse it to verify it matches.
        
        import json
        saved_schema = json.loads(updated_template.variables_schema)
        
        assert saved_schema == schema
        print("SUCCESS: Schema saved and retrieved correctly!")

    finally:
        db.close()

if __name__ == "__main__":
    main()
