from fastapi import APIRouter, HTTPException

from app.api.deps import DashboardUserId, DbSession
from app.schemas.profile import OnboardingSubmit, ProfileResponse, ProfileUpdate
from app.services import profile_service

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileResponse)
def get_profile(
    db: DbSession,
    user_id: DashboardUserId,
) -> ProfileResponse:
    try:
        return profile_service.get_profile(db, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("", response_model=ProfileResponse)
def update_profile(
    body: ProfileUpdate,
    db: DbSession,
    user_id: DashboardUserId,
) -> ProfileResponse:
    try:
        return profile_service.update_profile(db, user_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/onboarding", response_model=ProfileResponse)
def submit_onboarding(
    body: OnboardingSubmit,
    db: DbSession,
    user_id: DashboardUserId,
) -> ProfileResponse:
    try:
        return profile_service.complete_onboarding(db, user_id, body)
    except ValueError as exc:
        status = 400 if "required" in str(exc).lower() else 404
        raise HTTPException(status_code=status, detail=str(exc)) from exc


@router.post("/reset", response_model=ProfileResponse)
def reset_profile(
    db: DbSession,
    user_id: DashboardUserId,
) -> ProfileResponse:
    try:
        return profile_service.reset_profile(db, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
