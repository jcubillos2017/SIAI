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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invÃ¡lidas")

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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invÃ¡lido")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invÃ¡lido")

    sub = payload.get("sub")
    jti = payload.get("jti")
    if not sub or not jti:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invÃ¡lido")

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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invÃ¡lido")

    jti = payload.get("jti")
    if not jti:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token invÃ¡lido")

    db_token = await RefreshToken.find_one(RefreshToken.jti == jti)
    if db_token:
        db_token.revoked = True
        await db_token.save()

    return {"ok": True}
