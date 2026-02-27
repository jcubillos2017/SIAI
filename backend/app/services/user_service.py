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
