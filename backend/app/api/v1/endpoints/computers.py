from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from beanie import PydanticObjectId

from app.deps import get_current_user, require_admin
from app.models.computer import Computer
from app.schemas.computer import ComputerPublic, ComputerListResponse
from datetime import datetime
from app.schemas.computer import ComputerPublic, ComputerListResponse, ComputerCreate, ComputerUpdate

router = APIRouter()


def to_oid(id_str: str) -> PydanticObjectId:
    try:
        return PydanticObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="computer_id inválido")


def to_public(c: Computer) -> ComputerPublic:
    return ComputerPublic(
        id=str(c.id),
        inventory_code=c.inventory_code,
        hostname=c.hostname,
        serial_number=c.serial_number,
        brand=c.brand,
        model=c.model,
        memory_raw=c.memory_raw,
        equipment_type=c.equipment_type,
        cpu=c.cpu,
        gpu=c.gpu,
        storage_raw=c.storage_raw,
        last_imported_at=c.last_imported_at,
        created_at=c.created_at,
        updated_at=c.updated_at,
        acquisition_type=c.acquisition_type,
    )


def _rx(value: str) -> dict:
    return {"$regex": value, "$options": "i"}


@router.get("/", response_model=ComputerListResponse)
async def list_computers(
    q: str | None = None,
    inventory_code: str | None = None,
    hostname: str | None = None,
    serial_number: str | None = None,
    brand: str | None = None,
    model: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=200),
    sort: str = Query("inventory_code"),
    order: str = Query("asc"),
    _=Depends(get_current_user),
):
    and_filters = []

    if q:
        or_filters = [
            {"inventory_code": _rx(q)},
            {"hostname": _rx(q)},
            {"serial_number": _rx(q)},
            {"brand": _rx(q)},
            {"model": _rx(q)},
            {"cpu": _rx(q)},
        ]
        and_filters.append({"$or": or_filters})

    if inventory_code:
        and_filters.append({"inventory_code": _rx(inventory_code)})
    if hostname:
        and_filters.append({"hostname": _rx(hostname)})
    if serial_number:
        and_filters.append({"serial_number": _rx(serial_number)})
    if brand:
        and_filters.append({"brand": _rx(brand)})
    if model:
        and_filters.append({"model": _rx(model)})

    query = {"$and": and_filters} if and_filters else {}

    sort_allow = {
        "inventory_code": "inventory_code",
        "hostname": "hostname",
        "serial_number": "serial_number",
        "brand": "brand",
        "model": "model",
        "updated_at": "updated_at",
        "last_imported_at": "last_imported_at",
    }
    sort_field = sort_allow.get(sort, "inventory_code")
    sort_expr = sort_field if order.lower() == "asc" else f"-{sort_field}"

    total = await Computer.find(query).count()

    skip = (page - 1) * page_size
    items = await Computer.find(query).sort(sort_expr).skip(skip).limit(page_size).to_list()

    return ComputerListResponse(
        items=[to_public(x) for x in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{computer_id}", response_model=ComputerPublic)
async def get_computer(computer_id: str, _=Depends(get_current_user)):
    oid = to_oid(computer_id)
    c = await Computer.get(oid)
    if not c:
        raise HTTPException(status_code=404, detail="Computador no existe")
    return to_public(c)

@router.post("/", response_model=ComputerPublic)
async def create_computer(payload: ComputerCreate, _=Depends(require_admin)):
    exists = await Computer.find_one(Computer.inventory_code == payload.inventory_code.strip())
    if exists:
        raise HTTPException(status_code=400, detail="Ya existe un computador con ese Código Inventario")

    now = datetime.utcnow()
    doc = Computer(
        inventory_code=payload.inventory_code.strip(),
        hostname=payload.hostname.strip(),
        serial_number=payload.serial_number.strip(),
        brand=(payload.brand.strip() if payload.brand else None),
        model=(payload.model.strip() if payload.model else None),
        memory_raw=(payload.memory_raw.strip() if payload.memory_raw else None),
        equipment_type=(payload.equipment_type.strip() if payload.equipment_type else None),
        cpu=(payload.cpu.strip() if payload.cpu else None),
        gpu=(payload.gpu.strip() if payload.gpu else None),
        storage_raw=(payload.storage_raw.strip() if payload.storage_raw else None),
        acquisition_type=(payload.acquisition_type.strip() if payload.acquisition_type else None),
        last_imported_at=now,
        created_at=now,
        updated_at=now,
    )
    await doc.insert()
    return to_public(doc)


@router.patch("/{computer_id}", response_model=ComputerPublic)
async def update_computer(computer_id: str, payload: ComputerUpdate, _=Depends(require_admin)):
    oid = to_oid(computer_id)
    doc = await Computer.get(oid)
    if not doc:
        raise HTTPException(status_code=404, detail="Computador no existe")

    # Editar código inventario (evitar duplicado)
    if payload.inventory_code is not None:
        new_code = payload.inventory_code.strip()
        if new_code and new_code != doc.inventory_code:
            dup = await Computer.find_one(Computer.inventory_code == new_code)
            if dup and str(dup.id) != str(doc.id):
                raise HTTPException(status_code=400, detail="Código Inventario ya existe en otro equipo")
            doc.inventory_code = new_code

    if payload.hostname is not None:
        doc.hostname = payload.hostname.strip()
    if payload.serial_number is not None:
        doc.serial_number = payload.serial_number.strip()

    if payload.brand is not None:
        doc.brand = payload.brand.strip() if payload.brand else None
    if payload.model is not None:
        doc.model = payload.model.strip() if payload.model else None
    if payload.memory_raw is not None:
        doc.memory_raw = payload.memory_raw.strip() if payload.memory_raw else None
    if payload.equipment_type is not None:
        doc.equipment_type = payload.equipment_type.strip() if payload.equipment_type else None
    if payload.cpu is not None:
        doc.cpu = payload.cpu.strip() if payload.cpu else None
    if payload.gpu is not None:
        doc.gpu = payload.gpu.strip() if payload.gpu else None
    if payload.storage_raw is not None:
        doc.storage_raw = payload.storage_raw.strip() if payload.storage_raw else None
    if payload.acquisition_type is not None:
        doc.acquisition_type = payload.acquisition_type.strip() if payload.acquisition_type else None

    doc.updated_at = datetime.utcnow()
    await doc.save()
    return to_public(doc)


@router.delete("/{computer_id}")
async def delete_computer(computer_id: str, _=Depends(require_admin)):
    oid = to_oid(computer_id)
    doc = await Computer.get(oid)
    if not doc:
        raise HTTPException(status_code=404, detail="Computador no existe")

    await doc.delete()
    return {"ok": True}