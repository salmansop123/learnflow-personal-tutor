from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.models import (
    Conversation,
    Note,
    QuizAttempt,
    Reminder,
    StudySession,
    Task,
)
from app.schemas.dashboard import (
    ActivityPoint,
    DashboardOverviewResponse,
    DashboardStats,
    QuizItem,
    RecentChatItem,
    StudySessionItem,
    TaskItem,
    UpcomingReminderItem,
)


def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def get_study_sessions(db: Session, user_id: str) -> list[StudySessionItem]:
    rows = db.scalars(
        select(StudySession)
        .where(
            StudySession.userId == user_id,
            StudySession.isDeleted.is_(False),
        )
        .order_by(StudySession.startedAt.desc())
    ).all()
    return [
        StudySessionItem(
            id=s.id,
            subject=s.subject,
            startedAt=s.startedAt,
            endedAt=s.endedAt,
            durationMins=s.durationMins,
        )
        for s in rows
    ]


def get_tasks(db: Session, user_id: str) -> list[TaskItem]:
    rows = db.scalars(
        select(Task).where(Task.userId == user_id).order_by(Task.createdAt.desc())
    ).all()
    return [
        TaskItem(
            id=t.id,
            title=t.title,
            completed=t.completed,
            dueDate=t.dueDate,
        )
        for t in rows
    ]


def get_quiz_attempts(db: Session, user_id: str, limit: int = 50) -> list[QuizItem]:
    rows = db.scalars(
        select(QuizAttempt)
        .where(QuizAttempt.userId == user_id)
        .order_by(QuizAttempt.createdAt.desc())
        .limit(limit)
    ).all()
    return [
        QuizItem(
            id=q.id,
            subject=q.subject,
            score=q.score,
            createdAt=q.createdAt,
        )
        for q in rows
    ]


def get_notes_count(db: Session, user_id: str) -> int:
    return (
        db.scalar(select(func.count()).select_from(Note).where(Note.userId == user_id))
        or 0
    )


def get_recent_conversations(db: Session, user_id: str) -> list[RecentChatItem]:
    rows = db.scalars(
        select(Conversation)
        .where(Conversation.userId == user_id)
        .order_by(Conversation.createdAt.desc())
        .limit(5)
    ).all()
    return [
        RecentChatItem(
            id=c.id,
            title=c.title,
            subject=c.subject,
            createdAt=c.createdAt,
        )
        for c in rows
    ]


def get_upcoming_reminders(db: Session, user_id: str) -> list[UpcomingReminderItem]:
    now = datetime.now(timezone.utc)
    rows = db.scalars(
        select(Reminder)
        .where(
            Reminder.userId == user_id,
            Reminder.sent == False,
            Reminder.scheduledAt >= now,
        )
        .order_by(Reminder.scheduledAt.asc())
        .limit(5)
    ).all()
    return [
        UpcomingReminderItem(
            id=r.id,
            title=r.title,
            body=r.body,
            scheduledAt=r.scheduledAt,
            type=r.type.value if hasattr(r.type, "value") else str(r.type),
        )
        for r in rows
    ]


def get_dashboard_overview(db: Session, user_id: str) -> DashboardOverviewResponse:
    sessions = db.scalars(
        select(StudySession)
        .where(
            StudySession.userId == user_id,
            StudySession.isDeleted.is_(False),
        )
        .order_by(StudySession.startedAt.desc())
    ).all()

    tasks = db.scalars(select(Task).where(Task.userId == user_id)).all()
    quiz_count = db.scalar(
        select(func.count()).select_from(QuizAttempt).where(QuizAttempt.userId == user_id)
    ) or 0
    notes_count = db.scalar(
        select(func.count()).select_from(Note).where(Note.userId == user_id)
    ) or 0

    total_mins = sum(s.durationMins or 0 for s in sessions)
    completed_tasks = sum(1 for t in tasks if t.completed)

    stats = DashboardStats(
        studyHours=round(total_mins / 60, 1),
        sessionCount=len(sessions),
        tasksDone=completed_tasks,
        quizCount=quiz_count,
        notesCount=notes_count,
    )

    activity = _build_activity_chart(sessions)

    conversations = db.scalars(
        select(Conversation)
        .where(Conversation.userId == user_id)
        .order_by(Conversation.createdAt.desc())
        .limit(5)
    ).all()
    recent_chats = [
        RecentChatItem(
            id=c.id,
            title=c.title,
            subject=c.subject,
            createdAt=c.createdAt,
        )
        for c in conversations
    ]

    now = datetime.now(timezone.utc)
    reminders = db.scalars(
        select(Reminder)
        .where(
            Reminder.userId == user_id,
            Reminder.sent == False,
            Reminder.scheduledAt >= now,
        )
        .order_by(Reminder.scheduledAt.asc())
        .limit(5)
    ).all()
    upcoming_reminders = [
        UpcomingReminderItem(
            id=r.id,
            title=r.title,
            body=r.body,
            scheduledAt=r.scheduledAt,
            type=r.type.value if hasattr(r.type, "value") else str(r.type),
        )
        for r in reminders
    ]

    return DashboardOverviewResponse(
        stats=stats,
        activity=activity,
        recentChats=recent_chats,
        upcomingReminders=upcoming_reminders,
    )


def _build_activity_chart(sessions: list[StudySession]) -> list[ActivityPoint]:
    """Last 7 days of study minutes per day."""
    now = datetime.now(timezone.utc)
    day_keys = [
        (now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6, -1, -1)
    ]
    day_set = set(day_keys)
    minutes_by_day: dict[str, int] = {day: 0 for day in day_keys}

    for session in sessions:
        started = _ensure_utc(session.startedAt)
        if not started:
            continue
        key = started.strftime("%Y-%m-%d")
        if key in day_set:
            minutes_by_day[key] += session.durationMins or 0

    return [ActivityPoint(date=day, minutes=minutes_by_day[day]) for day in day_keys]
