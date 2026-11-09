from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str
    email: str
    company_name: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "auditor"
    company_name: Optional[str] = "Acme Global Enterprise"

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True
