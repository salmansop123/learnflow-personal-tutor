from fastapi import APIRouter

from app.api.deps import DashboardUserId, DbSession
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    NotesCountResponse,
    QuizItem,
    RecentChatItem,
    StudySessionItem,
    TaskItem,
    UpcomingReminderItem,
)
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverviewResponse)
def dashboard_overview(
    db: DbSession,
    user_id: DashboardUserId,
) -> DashboardOverviewResponse:
    return dashboard_service.get_dashboard_overview(db, user_id)


@router.get("/sessions", response_model=list[StudySessionItem])
def dashboard_sessions(
    db: DbSession,
    user_id: DashboardUserId,
) -> list[StudySessionItem]:
    return dashboard_service.get_study_sessions(db, user_id)


@router.get("/tasks", response_model=list[TaskItem])
def dashboard_tasks(
    db: DbSession,
    user_id: DashboardUserId,
) -> list[TaskItem]:
    return dashboard_service.get_tasks(db, user_id)


@router.get("/quizzes", response_model=list[QuizItem])
def dashboard_quizzes(
    db: DbSession,
    user_id: DashboardUserId,
) -> list[QuizItem]:
    return dashboard_service.get_quiz_attempts(db, user_id)


@router.get("/notes/count", response_model=NotesCountResponse)
def dashboard_notes_count(
    db: DbSession,
    user_id: DashboardUserId,
) -> NotesCountResponse:
    return NotesCountResponse(count=dashboard_service.get_notes_count(db, user_id))


@router.get("/conversations", response_model=list[RecentChatItem])
def dashboard_conversations(
    db: DbSession,
    user_id: DashboardUserId,
) -> list[RecentChatItem]:
    return dashboard_service.get_recent_conversations(db, user_id)


@router.get("/reminders", response_model=list[UpcomingReminderItem])
def dashboard_reminders(
    db: DbSession,
    user_id: DashboardUserId,
) -> list[UpcomingReminderItem]:
    return dashboard_service.get_upcoming_reminders(db, user_id)
