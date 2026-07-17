from fastapi import APIRouter, HTTPException

from app.api.deps import DashboardUserId, DbSession, InternalServiceAuth
from app.schemas.auth import UserResponse
from app.schemas.user import UserPlanUpdate, UserStripeUpdate, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_current_user(
    db: DbSession,
    user_id: DashboardUserId,
) -> UserResponse:
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    body: UserUpdate,
    db: DbSession,
    user_id: DashboardUserId,
) -> UserResponse:
    try:
        return user_service.update_user(db, user_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/me/plan", response_model=UserResponse)
def update_current_user_plan(
    body: UserPlanUpdate,
    db: DbSession,
    user_id: DashboardUserId,
) -> UserResponse:
    try:
        return user_service.update_user_plan(db, user_id, body)
    except ValueError as exc:
        status = 400 if "Invalid" in str(exc) else 404
        raise HTTPException(status_code=status, detail=str(exc)) from exc


@router.patch("/me/stripe", response_model=UserResponse)
def update_current_user_stripe(
    body: UserStripeUpdate,
    db: DbSession,
    user_id: DashboardUserId,
) -> UserResponse:
    try:
        return user_service.update_user_stripe(db, user_id, body)
    except ValueError as exc:
        status = 400 if "Invalid" in str(exc) else 404
        raise HTTPException(status_code=status, detail=str(exc)) from exc


@router.patch("/stripe/customer/{customer_id}", response_model=UserResponse)
def sync_stripe_customer(
    customer_id: str,
    body: UserStripeUpdate,
    db: DbSession,
    _: InternalServiceAuth,
) -> UserResponse:
    try:
        return user_service.sync_user_stripe_by_customer(db, customer_id, body)
    except ValueError as exc:
        status = 400 if "Invalid" in str(exc) else 404
        raise HTTPException(status_code=status, detail=str(exc)) from exc
