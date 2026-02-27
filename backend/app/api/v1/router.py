from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, imports, computers

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(computers.router, prefix="/computers", tags=["computers"])
