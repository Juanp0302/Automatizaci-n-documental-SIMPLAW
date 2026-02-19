from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Json

class TemplateBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    variables_schema: Optional[List[dict]] = None  # JSON list of field definitions

class TemplateCreate(TemplateBase):
    title: str
    file_path: str

class TemplateUpdate(TemplateBase):
    file_path: Optional[str] = None

class TemplateInDBBase(TemplateBase):
    id: int
    file_path: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    variables_schema: Optional[Json[List[dict]]] = None

    class Config:
        orm_mode = True 
        from_attributes = True

class Template(TemplateInDBBase):
    pass
