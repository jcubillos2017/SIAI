from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List
from uuid import uuid4
import hashlib

import bcrypt
from jose import jwt, JWTError

from app.core.config import settings


def _normalize_password(password: str) -> bytes:
    # Pre-hash para evitar lÃ­mite de 72 bytes de bcrypt
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
        raise ValueError("Token invÃ¡lido o expirado") from e
