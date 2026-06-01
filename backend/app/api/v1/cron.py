from fastapi import APIRouter, HTTPException

from app.api.deps import CronAuth, DbSession
from app.schemas.cron import DueReminderItem
from app.services import reminder_service, study_service

router = APIRouter(prefix="/cron", tags=["cron"])


@router.get("/reminders/due", response_model=list[DueReminderItem])
def list_due_reminders(
    db: DbSession,
    _: CronAuth,
) -> list[DueReminderItem]:
    return reminder_service.get_due_reminders(db)


@router.post("/reminders/{reminder_id}/sent")
def mark_reminder_sent(
    reminder_id: str,
    db: DbSession,
    _: CronAuth,
) -> dict[str, bool]:
    if not reminder_service.mark_reminder_sent(db, reminder_id):
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"ok": True}


@router.post("/purge-deleted-sessions")
def purge_deleted_sessions(
    db: DbSession,
    _: CronAuth,
) -> dict[str, int]:
    """Permanently delete study sessions soft-deleted more than 30 days ago."""
    removed = study_service.purge_deleted_sessions_older_than_days(db, days=30)
    return {"removed": removed}
