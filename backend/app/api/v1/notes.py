from fastapi import APIRouter, HTTPException, Query

from app.api.deps import DashboardUserId, DbSession
from app.schemas.note import NoteCreate, NoteItem, NoteUpdate
from app.services import note_service

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteItem])
def list_notes(
    db: DbSession,
    user_id: DashboardUserId,
    q: str | None = Query(None),
    subject: str | None = Query(None),
    tag: str | None = Query(None),
) -> list[NoteItem]:
    return note_service.list_notes(db, user_id, q=q, subject=subject, tag=tag)


@router.post("", response_model=NoteItem)
def create_note(
    body: NoteCreate,
    db: DbSession,
    user_id: DashboardUserId,
) -> NoteItem:
    try:
        return note_service.create_note(db, user_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{note_id}", response_model=NoteItem)
def get_note(
    note_id: str,
    db: DbSession,
    user_id: DashboardUserId,
) -> NoteItem:
    try:
        return note_service.get_note(db, user_id, note_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{note_id}", response_model=NoteItem)
def update_note(
    note_id: str,
    body: NoteUpdate,
    db: DbSession,
    user_id: DashboardUserId,
) -> NoteItem:
    try:
        return note_service.update_note(db, user_id, note_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/{note_id}")
def delete_note(
    note_id: str,
    db: DbSession,
    user_id: DashboardUserId,
) -> dict[str, bool]:
    try:
        note_service.delete_note(db, user_id, note_id)
        return {"ok": True}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
