from fastapi import APIRouter

from app.api.api_v1.endpoints import login, users, templates, documents, extractor, utils

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(extractor.router, prefix="/extractor", tags=["extractor"])
api_router.include_router(utils.router, prefix="/extractor/utils", tags=["extractor-utils"])
