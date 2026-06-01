from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import Plan
from app.models.models import User
from app.schemas.auth import UserResponse
from app.schemas.user import UserPlanUpdate, UserUpdate


def get_user(db: Session, user_id: str) -> User | None:
    return db.scalar(select(User).where(User.id == user_id))


def update_user(
    db: Session, user_id: str, body: UserUpdate
) -> UserResponse:
    user = get_user(db, user_id)
    if not user:
        raise ValueError("User not found")

    if body.name is not None:
        user.name = body.name
    if body.language is not None:
        user.language = body.language
    if body.education_level is not None:
        user.educationLevel = body.education_level

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


def update_user_plan(
    db: Session, user_id: str, body: UserPlanUpdate
) -> UserResponse:
    user = get_user(db, user_id)
    if not user:
        raise ValueError("User not found")

    try:
        user.plan = Plan(body.plan.upper())
    except ValueError as exc:
        raise ValueError("Invalid plan") from exc

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)
