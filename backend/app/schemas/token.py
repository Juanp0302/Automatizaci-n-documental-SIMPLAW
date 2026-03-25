from typing import Optional
from pydantic import BaseModel, ConfigDict

class Token(BaseModel):
    access_token: str
    token_type: str
    model_config = ConfigDict(from_attributes=True)

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)
