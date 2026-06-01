from fastapi import APIRouter, Query

from app.api.deps import DashboardUserId, DbSession
from app.schemas.quiz import QuizAttemptCreate, QuizAttemptItem
from app.services import quiz_service

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/attempts", response_model=list[QuizAttemptItem])
def list_quiz_attempts(
    db: DbSession,
    user_id: DashboardUserId,
    subject: str | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1, le=100),
) -> list[QuizAttemptItem]:
    if subject:
        return quiz_service.list_quiz_attempts_for_subject(
            db, user_id, subject, limit=limit or 10
        )
    return quiz_service.list_quiz_attempts(db, user_id)


@router.post("/attempts", response_model=QuizAttemptItem)
def create_quiz_attempt(
    body: QuizAttemptCreate,
    db: DbSession,
    user_id: DashboardUserId,
) -> QuizAttemptItem:
    return quiz_service.create_quiz_attempt(db, user_id, body)
