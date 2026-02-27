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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id invÃ¡lido")


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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ContraseÃ±a actual incorrecta")

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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El admin cambia su contraseÃ±a con /users/me/change-password")

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
