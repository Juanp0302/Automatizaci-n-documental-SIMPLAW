from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DocumentBase(BaseModel):
    title: Optional[str] = None

class DocumentCreate(DocumentBase):
    title: str
    template_id: int
    variables: Optional[dict] = {}
    parent_id: Optional[int] = None

    # user_id will be inferred from the current user

class DocumentUpdate(DocumentBase):
    pass

class DocumentInDBBase(DocumentBase):
    id: int
    user_id: Optional[int] = None
    template_id: Optional[int] = None
    generated_file_path: str
    created_at: Optional[datetime] = None
    version: int = 1
    parent_id: Optional[int] = None
    ai_review_summary: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class Document(DocumentInDBBase):
    pass

class DocumentBulkDownload(BaseModel):
    ids: list[int]
