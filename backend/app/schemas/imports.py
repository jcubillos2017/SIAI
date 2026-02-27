from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ImportErrorItem(BaseModel):
    row: int
    field: Optional[str] = None
    message: str


class ImportPreviewResponse(BaseModel):
    expected_columns: List[str]
    received_columns: List[str]
    valid: bool
    preview_rows: List[Dict[str, Any]]
    errors: List[ImportErrorItem]


class ImportCommitResponse(BaseModel):
    total_rows: int
    created: int
    updated: int
    errors: List[ImportErrorItem]
    batch_id: Optional[str] = None
