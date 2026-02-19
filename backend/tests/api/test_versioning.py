import pytest
from httpx import AsyncClient
from app import crud, schemas
from sqlalchemy.orm import Session
import io

# Mock data
USER_EMAIL = "version_test@example.com"
USER_PASSWORD = "password123"

@pytest.mark.asyncio
async def test_document_versioning(client: AsyncClient, db: Session):
    # 0. Create user
    user_in = schemas.UserCreate(email=USER_EMAIL, password=USER_PASSWORD, full_name="Version User")
    user = crud.user.create(db, obj_in=user_in)
    
    # 1. Login
    login_response = await client.post(
        "/api/v1/login/access-token",
        data={"username": USER_EMAIL, "password": USER_PASSWORD},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload Template
    # Create a real minimal docx
    from docx import Document
    doc = Document()
    doc.add_paragraph("Version test {{ name }}")
    doc_io = io.BytesIO()
    doc.save(doc_io)
    doc_io.seek(0)
    
    files = {"file": ("v_template.docx", doc_io, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    upload_response = await client.post(
        "/api/v1/templates/",
        headers=headers,
        files=files,
        data={"title": "Version Template", "description": "Version Template"}
    )
    template_id = upload_response.json()["id"]

    # 3. Create Version 1
    doc_data_v1 = {
        "title": "My Doc V1",
        "template_id": template_id,
        "variables": {"name": "V1"}
    }
    res_v1 = await client.post("/api/v1/documents/", headers=headers, json=doc_data_v1)
    assert res_v1.status_code == 200
    doc_v1 = res_v1.json()
    assert doc_v1["version"] == 1
    assert doc_v1["parent_id"] is None
    
    # 4. Create Version 2 (Child of V1)
    doc_data_v2 = {
        "title": "My Doc V2",
        "template_id": template_id,
        "variables": {"name": "V2"},
        "parent_id": doc_v1["id"]
    }
    res_v2 = await client.post("/api/v1/documents/", headers=headers, json=doc_data_v2)
    assert res_v2.status_code == 200
    doc_v2 = res_v2.json()
    assert doc_v2["version"] == 2
    assert doc_v2["parent_id"] == doc_v1["id"]
    
    # 5. Create Version 3 (Child of V2)
    doc_data_v3 = {
        "title": "My Doc V3",
        "template_id": template_id,
        "variables": {"name": "V3"},
        "parent_id": doc_v2["id"]
    }
    res_v3 = await client.post("/api/v1/documents/", headers=headers, json=doc_data_v3)
    assert res_v3.status_code == 200
    doc_v3 = res_v3.json()
    assert doc_v3["version"] == 3
    assert doc_v3["parent_id"] == doc_v2["id"]
