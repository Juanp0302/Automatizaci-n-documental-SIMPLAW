import sys
sys.path.insert(0, '.')
import os
os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.session import SessionLocal
from app import crud, models

db = SessionLocal()

# Check if user with id=1 exists
user = db.query(models.User).first()
print(f"User: {user.email if user else 'None'}")

# Try to get documents as the crud does
if user and user.is_superuser:
    docs = crud.document.get_multi(db, skip=0, limit=100)
    print(f"Documents count: {len(docs)}")
    for d in docs:
        print(f"  Doc #{d.id}: title={d.title}, user_id={d.user_id}, template_id={d.template_id}, path={d.generated_file_path}, created_at={d.created_at} (type={type(d.created_at).__name__})")

# Try to serialize to Pydantic schema
from app.schemas.document import Document as DocumentSchema
for d in docs:
    try:
        schema = DocumentSchema.model_validate(d) if hasattr(DocumentSchema, 'model_validate') else DocumentSchema.from_orm(d)
        print(f"  Serialized OK: {schema}")
    except Exception as e:
        print(f"  SERIALIZATION ERROR for doc #{d.id}: {e}")

db.close()
