from fastapi import APIRouter, HTTPException

from app.api.deps import DashboardUserId, DbSession
from app.schemas.study import ReminderCreate, ReminderItem
from app.services import reminder_service

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderItem])
def list_reminders(
    db: DbSession,
    user_id: DashboardUserId,
) -> list[ReminderItem]:
    return reminder_service.list_reminders(db, user_id)


@router.post("", response_model=ReminderItem)
def create_reminder(
    body: ReminderCreate,
    db: DbSession,
    user_id: DashboardUserId,
) -> ReminderItem:
    return reminder_service.create_reminder(db, user_id, body)


@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: str,
    db: DbSession,
    user_id: DashboardUserId,
) -> dict[str, bool]:
    try:
        reminder_service.delete_reminder(db, user_id, reminder_id)
        return {"ok": True}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
