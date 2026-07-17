from fastapi import APIRouter, HTTPException

from app.api.deps import CronAuth, DbSession
from app.schemas.cron import DueReminderItem
from app.services import ai_usage_service, reminder_service, study_service

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


@router.post("/ai-usage/reset-daily")
def reset_ai_usage_daily(
    db: DbSession,
    _: CronAuth,
) -> dict[str, int]:
    """Reset daily AI chat counters for users past their daily reset time."""
    reset = ai_usage_service.reset_daily_all(db)
    return {"reset": reset}


@router.post("/ai-usage/reset-monthly")
def reset_ai_usage_monthly(
    db: DbSession,
    _: CronAuth,
) -> dict[str, int]:
    """Reset monthly AI feature counters for users past their monthly reset date."""
    reset = ai_usage_service.reset_monthly_all(db)
    return {"reset": reset}
