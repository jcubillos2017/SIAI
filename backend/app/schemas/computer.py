from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ComputerPublic(BaseModel):
    id: str
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

    last_imported_at: datetime
    created_at: datetime
    updated_at: datetime


class ComputerListResponse(BaseModel):
    items: List[ComputerPublic]
    total: int
    page: int
    page_size: int


class ComputerCreate(BaseModel):
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
    acquisition_type: Optional[str] = None


class ComputerUpdate(BaseModel):
    # ✅ Permitimos editar también el código inventario (con validación de duplicados)
    inventory_code: Optional[str] = None
    hostname: Optional[str] = None
    serial_number: Optional[str] = None

    brand: Optional[str] = None
    model: Optional[str] = None
    memory_raw: Optional[str] = None
    equipment_type: Optional[str] = None
    cpu: Optional[str] = None
    gpu: Optional[str] = None
    storage_raw: Optional[str] = None
    acquisition_type: Optional[str] = None