from fastapi import APIRouter, HTTPException

from app.api.deps import DashboardUserId, DbSession
from app.schemas.ai_usage import (
    AiUsageCheckResponse,
    AiUsageConsumeRequest,
    AiUsageConsumeResponse,
    AiUsageOverview,
)
from app.services import ai_usage_service

router = APIRouter(prefix="/ai-usage", tags=["ai-usage"])


@router.get("", response_model=AiUsageOverview)
def get_ai_usage(
    db: DbSession,
    user_id: DashboardUserId,
) -> AiUsageOverview:
    try:
        return ai_usage_service.get_overview(db, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/check/{feature}", response_model=AiUsageCheckResponse)
def check_ai_usage(
    feature: str,
    db: DbSession,
    user_id: DashboardUserId,
) -> AiUsageCheckResponse:
    try:
        return ai_usage_service.check_feature(db, user_id, feature)
    except ValueError as exc:
        status = 400 if "Invalid" in str(exc) else 404
        raise HTTPException(status_code=status, detail=str(exc)) from exc


@router.post("/consume", response_model=AiUsageConsumeResponse)
def consume_ai_usage(
    body: AiUsageConsumeRequest,
    db: DbSession,
    user_id: DashboardUserId,
) -> AiUsageConsumeResponse:
    try:
        result = ai_usage_service.consume_feature(
            db, user_id, body.feature, tokens=body.tokens
        )
        if not result.success:
            raise HTTPException(
                status_code=429,
                detail={
                    "success": False,
                    "message": result.message,
                    "overview": result.overview.model_dump(by_alias=True)
                    if result.overview
                    else None,
                },
            )
        return result
    except ValueError as exc:
        status = 400 if "Invalid" in str(exc) else 404
        raise HTTPException(status_code=status, detail=str(exc)) from exc
