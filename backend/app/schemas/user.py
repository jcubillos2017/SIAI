from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.user import Role


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str]
    role: Role
    allowed_modules: List[str]
    is_active: bool
    must_change_password: bool


class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Role = Role.USER
    allowed_modules: List[str] = Field(default_factory=list)
    temporary_password: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    allowed_modules: Optional[List[str]] = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class AdminSetPassword(BaseModel):
    new_password: str
    force_change: bool = True
