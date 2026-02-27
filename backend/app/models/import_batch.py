from __future__ import annotations

from datetime import datetime
from typing import Optional, Literal

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


class ImportBatch(Document):
    entity: Literal["computers"]
    filename: str
    user_id: PydanticObjectId

    dry_run: bool = False
    total_rows: int = 0
    created_count: int = 0
    updated_count: int = 0
    error_count: int = 0

    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

    class Settings:
        name = "import_batches"
        indexes = [
            IndexModel("entity"),
            IndexModel("user_id"),
            IndexModel("created_at"),
        ]
