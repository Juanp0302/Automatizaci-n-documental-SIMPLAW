from typing import Optional, List, Any
from datetime import datetime
import json
from pydantic import BaseModel, field_validator, ConfigDict

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
    model_config = ConfigDict(from_attributes=True)

    id: int
    file_path: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    variables_schema: Optional[Any] = None

    @field_validator('variables_schema', mode='before')
    @classmethod
    def parse_variables_schema(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else None
            except (json.JSONDecodeError, ValueError):
                return None
        if isinstance(v, list):
            return v
        return None

class Template(TemplateInDBBase):
    pass
