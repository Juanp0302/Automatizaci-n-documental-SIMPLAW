from app.db.session import SessionLocal
from app.models.extractor import ExtractedDocument, DocType

db = SessionLocal()
project_id = 1
docs = db.query(ExtractedDocument).filter(ExtractedDocument.project_id == project_id).all()
types = db.query(DocType).filter(DocType.project_id == project_id).all()

print(f"Project ID: {project_id}")
print(f"Total Types: {len(types)}")
for t in types:
    t_docs = [d for d in docs if d.doc_type_id == t.id]
    print(f"  Type {t.name} (ID: {t.id}): {len(t_docs)} docs")

print(f"Total Docs: {len(docs)}")
print(f"  Approved: {len([d for d in docs if d.review_status == 'approved'])}")
print(f"  Rejected: {len([d for d in docs if d.review_status == 'rejected'])}")
print(f"  Pending: {len([d for d in docs if d.review_status == 'pending'])}")
print(f"  None: {len([d for d in docs if d.review_status == 'none'])}")

db.close()
