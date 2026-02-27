# Ejecuta esto desde D:\Project\siai
$ErrorActionPreference = "Stop"

$files = @{}

$files["backend/requirements.txt"] = @"
fastapi==0.115.6
uvicorn[standard]==0.30.6

beanie==1.26.0
motor==3.6.0
pymongo==4.9.2

pydantic-settings==2.6.1
email-validator==2.2.0

python-multipart==0.0.9
bcrypt==5.0.0

python-jose[cryptography]==3.3.0
openpyxl==3.1.5
"@

$files["backend/.env.example"] = @"
PROJECT_NAME=SIAI
API_V1_STR=/api/v1

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=siai

SECRET_KEY=CAMBIA_ESTA_LLAVE_LARGA_Y_ALEATORIA
ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
"@

# ---------- app/core ----------
$files["backend/app/core/config.py"] = @"
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "SIAI"
    API_V1_STR: str = "/api/v1"

    MONGODB_URI: str
    MONGODB_DB: str = "siai"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: str = "http://localhost:5173"


settings = Settings()
"@

$files["backend/app/core/security.py"] = @"
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from uuid import uuid4
import hashlib

import bcrypt
from jose import jwt, JWTError

from app.core.config import settings


def _normalize_password(password: str) -> bytes:
    # Pre-hash para evitar límite de 72 bytes de bcrypt
    return hashlib.sha256(password.encode("utf-8")).digest()


def get_password_hash(password: str) -> str:
    pw = _normalize_password(password)
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pw, salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    pw = _normalize_password(password)
    return bcrypt.checkpw(pw, password_hash.encode("utf-8"))


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(*, sub: str, role: str, modules: List[str]) -> Dict[str, Any]:
    expire = _utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": sub,
        "role": role,
        "modules": modules,
        "type": "access",
        "exp": int(expire.timestamp()),
    }
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return {"token": token, "expires_at": expire}


def create_refresh_token(*, sub: str) -> Dict[str, Any]:
    jti = str(uuid4())
    expire = _utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": sub,
        "jti": jti,
        "type": "refresh",
        "exp": int(expire.timestamp()),
    }
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return {"token": token, "jti": jti, "expires_at": expire}


def decode_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as e:
        raise ValueError("Token inválido o expirado") from e
"@

# ---------- app/db ----------
$files["backend/app/db/mongodb.py"] = @"
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import settings
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.computer import Computer
from app.models.import_batch import ImportBatch


async def init_mongodb() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB]
    await init_beanie(database=db, document_models=[User, RefreshToken, Computer, ImportBatch])
"@

# ---------- models ----------
$files["backend/app/models/user.py"] = @"
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
"@

$files["backend/app/models/refresh_token.py"] = @"
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
"@

$files["backend/app/models/computer.py"] = @"
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

    last_imported_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "computers"
        indexes = [
            IndexModel("inventory_code", unique=True),
            IndexModel("serial_number"),
        ]
"@

$files["backend/app/models/import_batch.py"] = @"
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
"@

# ---------- schemas ----------
$files["backend/app/schemas/auth.py"] = @"
from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    must_change_password: bool
"@

$files["backend/app/schemas/user.py"] = @"
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
"@

$files["backend/app/schemas/imports.py"] = @"
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
"@

# ---------- services ----------
$files["backend/app/services/user_service.py"] = @"
from __future__ import annotations

import secrets
from datetime import datetime
from typing import Optional

from beanie import PydanticObjectId

from app.core.security import get_password_hash, verify_password
from app.models.user import User, Role


def _gen_temp_password() -> str:
    return secrets.token_urlsafe(9)


async def create_user(
    *, email: str, full_name: Optional[str], role: Role, allowed_modules: list[str], temporary_password: Optional[str]
) -> tuple[User, str]:
    if role == Role.ADMIN:
        existing_admin = await User.find_one(User.role == Role.ADMIN)
        if existing_admin:
            raise ValueError("Ya existe un administrador. No se puede crear otro.")

    temp_password = temporary_password or _gen_temp_password()
    user = User(
        email=email.lower().strip(),
        full_name=full_name,
        role=role,
        allowed_modules=allowed_modules,
        password_hash=get_password_hash(temp_password),
        must_change_password=True if role != Role.ADMIN else False,
        updated_at=datetime.utcnow(),
    )
    await user.insert()
    return user, temp_password


async def authenticate_user(email: str, password: str) -> Optional[User]:
    user = await User.find_one(User.email == email.lower().strip())
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def reset_password(*, user_id: PydanticObjectId) -> str:
    user = await User.get(user_id)
    if not user:
        raise ValueError("Usuario no existe")

    new_temp = _gen_temp_password()
    user.password_hash = get_password_hash(new_temp)
    user.must_change_password = True
    user.updated_at = datetime.utcnow()
    await user.save()
    return new_temp
"@

$files["backend/app/services/import_service.py"] = @"
from __future__ import annotations

import csv
import io
import unicodedata
from datetime import datetime
from typing import Any, Dict, List, Tuple

from openpyxl import load_workbook
from beanie import PydanticObjectId

from app.models.computer import Computer
from app.models.import_batch import ImportBatch


EXPECTED_COMPUTER_COLUMNS = [
    "Código Inventario",
    "Nombre Equipo",
    "Numero de Serie",
    "Marca",
    "Modelo",
    "Memoria",
    "Tipo de Equipo",
    "Procesador",
    "Tarjeta Video",
    "Disco Duro",
]


def _norm_header(s: str) -> str:
    s = (s or "").strip().lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = " ".join(s.split())
    return s


EXPECTED_NORM = [_norm_header(c) for c in EXPECTED_COMPUTER_COLUMNS]


def _read_csv(content: bytes) -> Tuple[List[str], List[Dict[str, Any]]]:
    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []
    rows = [dict(r) for r in reader]
    return headers, rows


def _read_xlsx(content: bytes) -> Tuple[List[str], List[Dict[str, Any]]]:
    wb = load_workbook(io.BytesIO(content), data_only=True)
    ws = wb.active

    header_cells = list(ws.iter_rows(min_row=1, max_row=1, values_only=True))[0]
    headers = [str(h).strip() if h is not None else "" for h in header_cells]

    rows: List[Dict[str, Any]] = []
    for row_cells in ws.iter_rows(min_row=2, values_only=True):
        if all(v is None or str(v).strip() == "" for v in row_cells):
            continue
        item: Dict[str, Any] = {}
        for i, h in enumerate(headers):
            val = row_cells[i] if i < len(row_cells) else None
            item[h] = "" if val is None else str(val).strip()
        rows.append(item)

    return headers, rows


def _validate_headers(received_headers: List[str]) -> Tuple[bool, List[str]]:
    received_norm = [_norm_header(h) for h in received_headers]
    missing = [EXPECTED_COMPUTER_COLUMNS[i] for i, en in enumerate(EXPECTED_NORM) if en not in received_norm]
    return (len(missing) == 0), missing


def _pick(row: Dict[str, Any], col_name: str) -> str:
    target = _norm_header(col_name)
    for k, v in row.items():
        if _norm_header(k) == target:
            return (v or "").strip()
    return ""


def _validate_row(row: Dict[str, Any], row_number: int) -> List[dict]:
    errors = []
    inv = _pick(row, "Código Inventario")
    host = _pick(row, "Nombre Equipo")
    ser = _pick(row, "Numero de Serie")
    if not inv:
        errors.append({"row": row_number, "field": "Código Inventario", "message": "Requerido"})
    if not host:
        errors.append({"row": row_number, "field": "Nombre Equipo", "message": "Requerido"})
    if not ser:
        errors.append({"row": row_number, "field": "Numero de Serie", "message": "Requerido"})
    return errors


async def preview_computers(file_bytes: bytes, filename: str) -> dict:
    if filename.lower().endswith(".xlsx"):
        headers, rows = _read_xlsx(file_bytes)
    else:
        headers, rows = _read_csv(file_bytes)

    ok, missing = _validate_headers(headers)
    errors: List[dict] = []
    if not ok:
        for m in missing:
            errors.append({"row": 0, "field": "HEADER", "message": f"Falta columna: {m}"})

    preview_rows: List[Dict[str, Any]] = []
    for idx, r in enumerate(rows[:10], start=2):
        errors.extend(_validate_row(r, idx))
        preview_rows.append({
            "Código Inventario": _pick(r, "Código Inventario"),
            "Nombre Equipo": _pick(r, "Nombre Equipo"),
            "Numero de Serie": _pick(r, "Numero de Serie"),
            "Marca": _pick(r, "Marca"),
            "Modelo": _pick(r, "Modelo"),
            "Memoria": _pick(r, "Memoria"),
            "Tipo de Equipo": _pick(r, "Tipo de Equipo"),
            "Procesador": _pick(r, "Procesador"),
            "Tarjeta Video": _pick(r, "Tarjeta Video"),
            "Disco Duro": _pick(r, "Disco Duro"),
        })

    return {
        "expected_columns": EXPECTED_COMPUTER_COLUMNS,
        "received_columns": headers,
        "valid": ok and len([e for e in errors if e["row"] == 0]) == 0,
        "preview_rows": preview_rows,
        "errors": errors,
    }


async def commit_computers(file_bytes: bytes, filename: str, user_id: PydanticObjectId) -> dict:
    if filename.lower().endswith(".xlsx"):
        headers, rows = _read_xlsx(file_bytes)
    else:
        headers, rows = _read_csv(file_bytes)

    ok, missing = _validate_headers(headers)
    errors: List[dict] = []
    if not ok:
        for m in missing:
            errors.append({"row": 0, "field": "HEADER", "message": f"Falta columna: {m}"})
        return {"total_rows": 0, "created": 0, "updated": 0, "errors": errors, "batch_id": None}

    created = 0
    updated = 0

    batch = ImportBatch(entity="computers", filename=filename, user_id=user_id, dry_run=False)
    await batch.insert()

    for i, r in enumerate(rows, start=2):
        row_errors = _validate_row(r, i)
        if row_errors:
            errors.extend(row_errors)
            continue

        inv = _pick(r, "Código Inventario")
        host = _pick(r, "Nombre Equipo")
        ser = _pick(r, "Numero de Serie")

        doc = await Computer.find_one(Computer.inventory_code == inv)
        now = datetime.utcnow()

        if not doc:
            doc = Computer(
                inventory_code=inv,
                hostname=host,
                serial_number=ser,
                brand=_pick(r, "Marca") or None,
                model=_pick(r, "Modelo") or None,
                memory_raw=_pick(r, "Memoria") or None,
                equipment_type=_pick(r, "Tipo de Equipo") or None,
                cpu=_pick(r, "Procesador") or None,
                gpu=_pick(r, "Tarjeta Video") or None,
                storage_raw=_pick(r, "Disco Duro") or None,
                last_imported_at=now,
                created_at=now,
                updated_at=now,
            )
            await doc.insert()
            created += 1
        else:
            doc.hostname = host
            doc.serial_number = ser
            doc.brand = _pick(r, "Marca") or None
            doc.model = _pick(r, "Modelo") or None
            doc.memory_raw = _pick(r, "Memoria") or None
            doc.equipment_type = _pick(r, "Tipo de Equipo") or None
            doc.cpu = _pick(r, "Procesador") or None
            doc.gpu = _pick(r, "Tarjeta Video") or None
            doc.storage_raw = _pick(r, "Disco Duro") or None
            doc.last_imported_at = now
            doc.updated_at = now
            await doc.save()
            updated += 1

    batch.total_rows = len(rows)
    batch.created_count = created
    batch.updated_count = updated
    batch.error_count = len(errors)
    await batch.save()

    return {"total_rows": len(rows), "created": created, "updated": updated, "errors": errors, "batch_id": str(batch.id)}


def template_computers_csv_bytes() -> bytes:
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(EXPECTED_COMPUTER_COLUMNS)
    writer.writerow(["12345","Prchile-12345","123456789","HP","ProBook","16GB","AIO","Ryzen 7","AMD Radeon","1 tera"])
    return out.getvalue().encode("utf-8")
"@

# ---------- deps ----------
$files["backend/app/deps.py"] = @"
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from beanie import PydanticObjectId

from app.core.security import decode_token
from app.models.user import User, Role


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    user = await User.get(PydanticObjectId(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no autorizado")

    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requiere rol administrador")
    return user
"@

# ---------- api ----------
$files["backend/app/api/v1/router.py"] = @"
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, imports

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
"@

$files["backend/app/api/v1/endpoints/auth.py"] = @"
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from beanie import PydanticObjectId

from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import TokenResponse
from app.services.user_service import authenticate_user


router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form.username, form.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    access = create_access_token(sub=str(user.id), role=user.role.value, modules=user.allowed_modules)
    refresh = create_refresh_token(sub=str(user.id))

    await RefreshToken(
        user_id=PydanticObjectId(str(user.id)),
        jti=refresh["jti"],
        expires_at=refresh["expires_at"],
        revoked=False,
    ).insert()

    return TokenResponse(
        access_token=access["token"],
        refresh_token=refresh["token"],
        must_change_password=user.must_change_password,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(refresh_token: str):
    try:
        payload = decode_token(refresh_token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido")

    sub = payload.get("sub")
    jti = payload.get("jti")
    if not sub or not jti:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido")

    db_token = await RefreshToken.find_one(RefreshToken.jti == jti)
    if not db_token or db_token.revoked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revocado")

    user = await User.get(PydanticObjectId(sub))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no autorizado")

    db_token.revoked = True
    await db_token.save()

    access = create_access_token(sub=str(user.id), role=user.role.value, modules=user.allowed_modules)
    refresh = create_refresh_token(sub=str(user.id))

    await RefreshToken(
        user_id=PydanticObjectId(str(user.id)),
        jti=refresh["jti"],
        expires_at=refresh["expires_at"],
        revoked=False,
    ).insert()

    return TokenResponse(
        access_token=access["token"],
        refresh_token=refresh["token"],
        must_change_password=user.must_change_password,
    )


@router.post("/logout")
async def logout(refresh_token: str):
    try:
        payload = decode_token(refresh_token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    jti = payload.get("jti")
    if not jti:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido")

    db_token = await RefreshToken.find_one(RefreshToken.jti == jti)
    if db_token:
        db_token.revoked = True
        await db_token.save()

    return {"ok": True}
"@

$files["backend/app/api/v1/endpoints/users.py"] = @"
from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from beanie import PydanticObjectId

from app.deps import get_current_user, require_admin
from app.models.user import User, Role
from app.models.refresh_token import RefreshToken
from app.schemas.user import UserCreate, UserPublic, UserUpdate, ChangePassword, AdminSetPassword
from app.services.user_service import create_user, reset_password
from app.core.security import get_password_hash, verify_password


router = APIRouter()


def to_oid(id_str: str) -> PydanticObjectId:
    try:
        return PydanticObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id inválido")


def to_public(u: User) -> UserPublic:
    return UserPublic(
        id=str(u.id),
        email=u.email,
        full_name=u.full_name,
        role=u.role,
        allowed_modules=u.allowed_modules,
        is_active=u.is_active,
        must_change_password=u.must_change_password,
    )


async def revoke_all_refresh_tokens(user_oid: PydanticObjectId) -> None:
    tokens = await RefreshToken.find(RefreshToken.user_id == user_oid).to_list()
    for t in tokens:
        if not t.revoked:
            t.revoked = True
            await t.save()


@router.get("/me", response_model=UserPublic)
async def me(current: User = Depends(get_current_user)):
    return to_public(current)


@router.post("/me/change-password")
async def change_password(payload: ChangePassword, current: User = Depends(get_current_user)):
    if not verify_password(payload.current_password, current.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contraseña actual incorrecta")

    current.password_hash = get_password_hash(payload.new_password)
    current.must_change_password = False
    current.updated_at = datetime.utcnow()
    await current.save()

    await revoke_all_refresh_tokens(PydanticObjectId(str(current.id)))
    return {"ok": True}


@router.get("/", response_model=list[UserPublic])
async def list_users(_: User = Depends(require_admin)):
    users = await User.find_all().to_list()
    return [to_public(u) for u in users]


@router.post("/", response_model=dict)
async def admin_create_user(data: UserCreate, _: User = Depends(require_admin)):
    try:
        user, temp_password = await create_user(
            email=data.email,
            full_name=data.full_name,
            role=data.role,
            allowed_modules=data.allowed_modules,
            temporary_password=data.temporary_password,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {"user": to_public(user), "temporary_password": temp_password}


@router.patch("/{user_id}", response_model=UserPublic)
async def admin_update_user(user_id: str, data: UserUpdate, _: User = Depends(require_admin)):
    oid = to_oid(user_id)
    user = await User.get(oid)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe")

    if user.role == Role.ADMIN and data.is_active is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se puede bloquear el admin")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.allowed_modules is not None:
        user.allowed_modules = data.allowed_modules
    if data.is_active is not None:
        user.is_active = data.is_active

    user.updated_at = datetime.utcnow()
    await user.save()

    if data.is_active is False:
        await revoke_all_refresh_tokens(oid)

    return to_public(user)


@router.post("/{user_id}/reset-password", response_model=dict)
async def admin_reset_password(user_id: str, _: User = Depends(require_admin)):
    oid = to_oid(user_id)
    try:
        new_temp = await reset_password(user_id=oid)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    await revoke_all_refresh_tokens(oid)
    return {"temporary_password": new_temp}


@router.post("/{user_id}/set-password", response_model=dict)
async def admin_set_password(user_id: str, payload: AdminSetPassword, _: User = Depends(require_admin)):
    oid = to_oid(user_id)
    user = await User.get(oid)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe")

    if user.role == Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El admin cambia su contraseña con /users/me/change-password")

    user.password_hash = get_password_hash(payload.new_password)
    user.must_change_password = bool(payload.force_change)
    user.updated_at = datetime.utcnow()
    await user.save()

    await revoke_all_refresh_tokens(oid)
    return {"ok": True, "must_change_password": user.must_change_password}


@router.delete("/{user_id}")
async def admin_delete_user(user_id: str, _: User = Depends(require_admin)):
    oid = to_oid(user_id)
    user = await User.get(oid)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe")

    if user.role == Role.ADMIN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se puede eliminar el admin")

    await revoke_all_refresh_tokens(oid)
    await user.delete()
    return {"ok": True}
"@

$files["backend/app/api/v1/endpoints/imports.py"] = @"
from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import Response

from app.deps import get_current_user, require_admin
from app.models.user import User
from app.schemas.imports import ImportPreviewResponse, ImportCommitResponse
from app.services.import_service import preview_computers, commit_computers, template_computers_csv_bytes


router = APIRouter()


@router.get("/templates/computers.csv")
async def download_template_computers_csv(_: User = Depends(get_current_user)):
    data = template_computers_csv_bytes()
    return Response(
        content=data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="plantilla_computadores.csv"'},
    )


@router.post("/computers/preview", response_model=ImportPreviewResponse)
async def computers_preview(file: UploadFile = File(...), _: User = Depends(require_admin)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    return await preview_computers(content, file.filename or "computers.csv")


@router.post("/computers/commit", response_model=ImportCommitResponse)
async def computers_commit(file: UploadFile = File(...), current: User = Depends(require_admin)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    return await commit_computers(content, file.filename or "computers.csv", user_id=current.id)
"@

# ---------- main ----------
$files["backend/app/main.py"] = @"
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import init_mongodb
from app.api.v1.router import api_router


def _parse_origins(raw: str) -> list[str]:
    return [o.strip() for o in raw.split(",") if o.strip()]


app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_origins(settings.CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
async def startup():
    await init_mongodb()
"@

# ---------- scripts ----------
$files["backend/scripts/create_admin.py"] = @"
import asyncio
import getpass

from app.db.mongodb import init_mongodb
from app.models.user import User, Role
from app.core.security import get_password_hash


async def main():
    await init_mongodb()

    existing = await User.find_one(User.role == Role.ADMIN)
    if existing:
        print("Ya existe un administrador:", existing.email)
        return

    email = input("Email admin: ").strip().lower()
    password = getpass.getpass("Password admin: ").strip()

    admin = User(
        email=email,
        full_name="Administrador",
        role=Role.ADMIN,
        allowed_modules=["*"],
        is_active=True,
        must_change_password=False,
        password_hash=get_password_hash(password),
    )
    await admin.insert()
    print("Admin creado OK.")


if __name__ == "__main__":
    asyncio.run(main())
"@

# __init__.py (paquetes)
$initPaths = @(
  "backend/app/__init__.py",
  "backend/app/api/__init__.py",
  "backend/app/api/v1/__init__.py",
  "backend/app/api/v1/endpoints/__init__.py",
  "backend/app/core/__init__.py",
  "backend/app/db/__init__.py",
  "backend/app/models/__init__.py",
  "backend/app/schemas/__init__.py",
  "backend/app/services/__init__.py",
  "backend/scripts/__init__.py"
)

foreach ($p in $initPaths) { $files[$p] = "" }

# Escribir archivos
foreach ($kv in $files.GetEnumerator()) {
  $path = Join-Path $PSScriptRoot $kv.Key
  $dir = Split-Path $path -Parent
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Set-Content -Path $path -Value $kv.Value -Encoding UTF8
}

Write-Host "✅ Backend creado en .\backend"
Write-Host "Siguiente: crea venv, instala deps, copia .env y levanta uvicorn."