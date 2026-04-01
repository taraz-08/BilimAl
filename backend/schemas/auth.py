from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from models.user import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    specialization: Optional[str] = None
    group_id: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str
    user_id: int
