from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import ReminderType
from app.models.models import Reminder, User
from app.schemas.cron import DueReminderItem
from app.schemas.study import ReminderCreate, ReminderItem


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def list_reminders(db: Session, user_id: str) -> list[ReminderItem]:
    rows = db.scalars(
        select(Reminder)
        .where(Reminder.userId == user_id)
        .order_by(Reminder.scheduledAt.desc())
        .limit(50)
    ).all()
    return [_reminder_item(r) for r in rows]


def create_reminder(db: Session, user_id: str, body: ReminderCreate) -> ReminderItem:
    try:
        reminder_type = ReminderType(body.type.upper())
    except ValueError:
        reminder_type = ReminderType.STUDY

    reminder = Reminder(
        userId=user_id,
        title=body.title,
        body=body.body,
        scheduledAt=body.scheduled_at,
        type=reminder_type,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return _reminder_item(reminder)


def get_due_reminders(db: Session) -> list[DueReminderItem]:
    now = _utcnow()
    rows = db.execute(
        select(Reminder, User)
        .join(User, User.id == Reminder.userId)
        .where(
            Reminder.sent == False,
            Reminder.scheduledAt <= now,
        )
        .order_by(Reminder.scheduledAt.asc())
    ).all()

    return [
        DueReminderItem(
            id=reminder.id,
            title=reminder.title,
            body=reminder.body,
            scheduledAt=reminder.scheduledAt,
            userEmail=user.email,
            userName=user.name,
        )
        for reminder, user in rows
    ]


def delete_reminder(db: Session, user_id: str, reminder_id: str) -> None:
    reminder = db.scalar(
        select(Reminder).where(
            Reminder.id == reminder_id,
            Reminder.userId == user_id,
        )
    )
    if not reminder:
        raise ValueError("Reminder not found")
    db.delete(reminder)
    db.commit()


def mark_reminder_sent(db: Session, reminder_id: str) -> bool:
    reminder = db.scalar(select(Reminder).where(Reminder.id == reminder_id))
    if not reminder:
        return False
    reminder.sent = True
    db.commit()
    return True


def _reminder_item(reminder: Reminder) -> ReminderItem:
    rtype = (
        reminder.type.value
        if hasattr(reminder.type, "value")
        else str(reminder.type)
    )
    return ReminderItem(
        id=reminder.id,
        title=reminder.title,
        body=reminder.body,
        scheduledAt=reminder.scheduledAt,
        sent=reminder.sent,
        type=rtype,
    )
