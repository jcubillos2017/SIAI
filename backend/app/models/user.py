from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional, List

from beanie import Document
from pydantic import EmailStr, Field
from pymongo import IndexModel


class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"


class User(Document):
    email: EmailStr
    full_name: Optional[str] = None

    role: Role = Role.USER
    allowed_modules: List[str] = Field(default_factory=list)

    is_active: bool = True
    must_change_password: bool = False
    password_hash: str

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = [
            IndexModel("email", unique=True),
            IndexModel("role"),
        ]
