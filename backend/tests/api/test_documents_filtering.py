import pytest
from httpx import AsyncClient
from app import crud, schemas
from sqlalchemy.orm import Session
import io

# Mock data
USER_EMAIL = "filter_test@example.com"
USER_PASSWORD = "password123"

@pytest.mark.asyncio
async def test_documents_filtering(client: AsyncClient, db: Session):
    # 0. Setup: Create user, login, create template, create docs
    user_in = schemas.UserCreate(email=USER_EMAIL, password=USER_PASSWORD, full_name="Filter Tester")
    user = crud.user.create(db, obj_in=user_in)
    
    login_response = await client.post(
        "/api/v1/login/access-token",
        data={"username": USER_EMAIL, "password": USER_PASSWORD},
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload Template
    from docx import Document
    doc = Document()
    doc.add_paragraph("Filter test {{ var }}")
    doc_io = io.BytesIO()
    doc.save(doc_io)
    doc_io.seek(0)
    
    files = {"file": ("filter_template.docx", doc_io, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    t_res = await client.post(
        "/api/v1/templates/",
        headers=headers,
        files=files,
        data={"title": "Filter Template", "description": "Desc"}
    )
    template_id = t_res.json()["id"]

    # Create Documents
    doc1 = await client.post("/api/v1/documents/", headers=headers, json={
        "title": "Alpha Document", "template_id": template_id, "variables": {"var": "A"}
    })
    doc2 = await client.post("/api/v1/documents/", headers=headers, json={
        "title": "Beta Document", "template_id": template_id, "variables": {"var": "B"}
    })
    doc3 = await client.post("/api/v1/documents/", headers=headers, json={
        "title": "Gamma Paper", "template_id": template_id, "variables": {"var": "C"}
    })
    
    # 1. Test Search
    # Search for "Alpha"
    res_alpha = await client.get("/api/v1/documents/?search=Alpha", headers=headers)
    assert res_alpha.status_code == 200
    data_alpha = res_alpha.json()
    assert len(data_alpha) == 1
    assert data_alpha[0]["title"] == "Alpha Document"

    # Search for "Document" (should find Alpha and Beta)
    res_doc = await client.get("/api/v1/documents/?search=Document", headers=headers)
    assert res_doc.status_code == 200
    data_doc = res_doc.json()
    assert len(data_doc) == 2
    titles = [d["title"] for d in data_doc]
    assert "Alpha Document" in titles
    assert "Beta Document" in titles

    # 2. Test Pagination
    res_page = await client.get("/api/v1/documents/?limit=1", headers=headers)
    data_page = res_page.json()
    # Pagination might not be strictly ordered by ID without explicit sort, but let's assume default order
    assert len(data_page) == 1
