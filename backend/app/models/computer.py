from __future__ import annotations

from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


class Computer(Document):
    inventory_code: str
    hostname: str
    serial_number: str

    brand: Optional[str] = None
    model: Optional[str] = None
    memory_raw: Optional[str] = None
    equipment_type: Optional[str] = None
    cpu: Optional[str] = None
    gpu: Optional[str] = None
    storage_raw: Optional[str] = None
    
    acquisition_type: Optional[str] = None  # Compra / Arriendo

    # --- Estado de red (detección en línea) ---
    ip_address: Optional[str] = None
    is_online: Optional[bool] = None          # None = nunca verificado
    last_seen_online: Optional[datetime] = None
    last_ping_at: Optional[datetime] = None

    last_imported_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    

    class Settings:
        name = "computers"
        indexes = [
            IndexModel("inventory_code", unique=True),
            IndexModel("serial_number"),
        ]
