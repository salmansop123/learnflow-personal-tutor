from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db

DbSession = Annotated[Session, Depends(get_db)]


def get_dashboard_user_id(
    authorization: str | None = Header(None),
    x_user_id: str | None = Header(None, alias="X-User-Id"),
) -> str:
    """Server-to-server auth: Next.js passes AUTH_SECRET + user id from session."""
    settings = get_settings()
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.auth_secret:
        raise HTTPException(status_code=401, detail="Invalid authorization")
    if not x_user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header")
    return x_user_id


DashboardUserId = Annotated[str, Depends(get_dashboard_user_id)]


def verify_cron_secret(
    authorization: str | None = Header(None),
) -> None:
    settings = get_settings()
    if not settings.cron_secret:
        raise HTTPException(
            status_code=503,
            detail="CRON_SECRET is not configured on the server",
        )
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Invalid authorization")


CronAuth = Annotated[None, Depends(verify_cron_secret)]


def verify_internal_service(
    authorization: str | None = Header(None),
) -> None:
    settings = get_settings()
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.auth_secret:
        raise HTTPException(status_code=401, detail="Invalid authorization")


InternalServiceAuth = Annotated[None, Depends(verify_internal_service)]
