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
        raise HTTPException(status_code=400, detail="Archivo vacÃ­o")
    return await preview_computers(content, file.filename or "computers.csv")


@router.post("/computers/commit", response_model=ImportCommitResponse)
async def computers_commit(file: UploadFile = File(...), current: User = Depends(require_admin)):
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Archivo vacÃ­o")
    return await commit_computers(content, file.filename or "computers.csv", user_id=current.id)
