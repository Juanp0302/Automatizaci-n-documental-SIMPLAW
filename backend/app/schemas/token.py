from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    class Config:
        orm_mode = True 
        from_attributes = True

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    class Config:
        orm_mode = True 
        from_attributes = True
