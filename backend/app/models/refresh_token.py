from __future__ import annotations

from datetime import datetime
from beanie import Document
from pydantic import Field
from beanie import PydanticObjectId
from pymongo import IndexModel


class RefreshToken(Document):
    user_id: PydanticObjectId
    jti: str
    expires_at: datetime
    revoked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "refresh_tokens"
        indexes = [
            IndexModel("jti", unique=True),
            IndexModel("expires_at", expireAfterSeconds=0),
            IndexModel("user_id"),
        ]
