from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.api.deps import DbSession, InternalServiceAuth
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


class AuditCreateBody(BaseModel):
    adminEmail: str
    action: str
    targetType: Optional[str] = None
    targetId: Optional[str] = None
    details: Optional[str] = None
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None


class PlanUpdateBody(BaseModel):
    plan: str


class DeactivateBody(BaseModel):
    reason: Optional[str] = None


@router.post("/audit")
def create_audit(
    body: AuditCreateBody,
    db: DbSession,
    _: InternalServiceAuth,
):
    try:
        row = admin_service.create_audit_log(
            db,
            admin_email=body.adminEmail,
            action=body.action,
            target_type=body.targetType,
            target_id=body.targetId,
            details=body.details,
            ip_address=body.ipAddress,
            user_agent=body.userAgent,
        )
        return {
            "id": row.id,
            "adminEmail": row.adminEmail,
            "action": row.action,
            "createdAt": row.createdAt.isoformat() if row.createdAt else None,
        }
    except Exception:
        return {"success": False}


@router.get("/stats")
def stats(db: DbSession, _: InternalServiceAuth):
    return admin_service.get_dashboard_stats(db)


@router.get("/users")
def users(
    db: DbSession,
    _: InternalServiceAuth,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    plan: Optional[str] = None,
    sort: str = "createdAt_desc",
):
    return admin_service.list_users(
        db, page=page, limit=limit, search=search, plan=plan, sort=sort
    )


@router.get("/users/{user_id}")
def user_detail(user_id: str, db: DbSession, _: InternalServiceAuth):
    detail = admin_service.get_user_detail(db, user_id)
    if not detail:
        raise HTTPException(status_code=404, detail="User not found")
    return detail


@router.patch("/users/{user_id}/plan")
def update_plan(
    user_id: str,
    body: PlanUpdateBody,
    db: DbSession,
    _: InternalServiceAuth,
):
    try:
        updated = admin_service.update_user_plan(db, user_id, body.plan)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: str,
    db: DbSession,
    _: InternalServiceAuth,
    reason: Optional[str] = Query(None),
):
    updated = admin_service.deactivate_user(db, user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


@router.get("/audit")
def list_audit(
    db: DbSession,
    _: InternalServiceAuth,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    adminEmail: Optional[str] = None,
    action: Optional[str] = None,
    dateFrom: Optional[str] = None,
    dateTo: Optional[str] = None,
):
    return admin_service.list_audit_logs(
        db,
        page=page,
        limit=limit,
        admin_email=adminEmail,
        action=action,
        date_from=dateFrom,
        date_to=dateTo,
    )


@router.get("/content")
def content(db: DbSession, _: InternalServiceAuth):
    return admin_service.get_content_overview(db)


@router.get("/system")
def system(db: DbSession, _: InternalServiceAuth):
    return admin_service.get_system_health(db)
