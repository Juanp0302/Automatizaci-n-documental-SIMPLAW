from fastapi import APIRouter

from app.api.api_v1.endpoints import login, users, templates, documents

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
