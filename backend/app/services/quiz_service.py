from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import QuizAttempt
from app.schemas.quiz import QuizAttemptCreate, QuizAttemptItem


def _quiz_attempt_item(
    attempt: QuizAttempt, *, include_questions_json: bool = False
) -> QuizAttemptItem:
    return QuizAttemptItem(
        id=attempt.id,
        subject=attempt.subject,
        topic=attempt.topic,
        difficulty=attempt.difficulty,
        totalQuestions=attempt.totalQuestions,
        correctAnswers=attempt.correctAnswers,
        score=attempt.score,
        timeTaken=attempt.timeTaken,
        isPartial=attempt.isPartial,
        partialReason=attempt.partialReason,
        sectionBreakdownJson=attempt.sectionBreakdownJson,
        createdAt=attempt.createdAt,
        questionsJson=attempt.questionsJson if include_questions_json else None,
    )


def list_quiz_attempts(db: Session, user_id: str) -> list[QuizAttemptItem]:
    rows = db.scalars(
        select(QuizAttempt)
        .where(QuizAttempt.userId == user_id)
        .order_by(QuizAttempt.createdAt.desc())
    ).all()
    return [_quiz_attempt_item(row, include_questions_json=True) for row in rows]


def list_quiz_attempts_for_subject(
    db: Session, user_id: str, subject: str, *, limit: int = 10
) -> list[QuizAttemptItem]:
    rows = db.scalars(
        select(QuizAttempt)
        .where(QuizAttempt.userId == user_id, QuizAttempt.subject == subject)
        .order_by(QuizAttempt.createdAt.desc())
        .limit(limit)
    ).all()
    return [_quiz_attempt_item(row, include_questions_json=True) for row in rows]


def create_quiz_attempt(
    db: Session, user_id: str, body: QuizAttemptCreate
) -> QuizAttemptItem:
    attempt = QuizAttempt(
        userId=user_id,
        subject=body.subject,
        topic=body.topic,
        difficulty=body.difficulty,
        totalQuestions=body.total_questions,
        correctAnswers=body.correct_answers,
        score=body.score,
        timeTaken=body.time_taken,
        questionsJson=body.questions_json,
        isPartial=body.is_partial,
        partialReason=body.partial_reason,
        sectionBreakdownJson=body.section_breakdown_json,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return _quiz_attempt_item(attempt)
