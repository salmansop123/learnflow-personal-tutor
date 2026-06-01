from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.api.deps import DashboardUserId, DbSession
from app.schemas.study import (
    StudyPlanCreate,
    StudyPlanItem,
    StudyPlanUpdate,
    StudySessionCreate,
    StudySessionItem,
    StudySessionPatch,
    SubjectMergeRequest,
    SubjectMergeResponse,
    SubjectTotalStatsItem,
    TaskCreate,
    TaskItem,
    TaskUpdate,
)
from app.services import study_service

router = APIRouter(prefix="/study", tags=["study"])


@router.get("/sessions", response_model=list[StudySessionItem])
def list_sessions(
    db: DbSession,
    user_id: DashboardUserId,
    deleted: bool = Query(False),
) -> list[StudySessionItem]:
    return study_service.list_sessions(db, user_id, deleted=deleted)


@router.get("/sessions/active", response_model=StudySessionItem | None)
def get_active_session(
    db: DbSession,
    user_id: DashboardUserId,
) -> StudySessionItem | None:
    return study_service.get_active_session(db, user_id)


@router.post("/sessions", response_model=StudySessionItem)
def create_session(
    body: StudySessionCreate,
    db: DbSession,
    user_id: DashboardUserId,
) -> StudySessionItem:
    try:
        return study_service.create_session(db, user_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/stats", response_model=list[SubjectTotalStatsItem])
def subject_stats(
    db: DbSession,
    user_id: DashboardUserId,
    date: date | None = Query(
        default=None,
        description="Filter stats to sessions ended on this day (YYYY-MM-DD)",
    ),
) -> list[SubjectTotalStatsItem]:
    return study_service.get_subject_stats(db, user_id, on_date=date)


@router.post("/subjects/merge", response_model=SubjectMergeResponse)
def merge_subjects(
    body: SubjectMergeRequest,
    db: DbSession,
    user_id: DashboardUserId,
) -> SubjectMergeResponse:
    try:
        return study_service.merge_subjects(
            db, user_id, body.from_subjects, body.into
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/sessions/{session_id}", response_model=StudySessionItem)
def patch_session(
    session_id: str,
    body: StudySessionPatch,
    db: DbSession,
    user_id: DashboardUserId,
) -> StudySessionItem:
    try:
        if body.action == "end":
            return study_service.end_session(db, user_id, session_id, body)
        if body.action == "restore":
            return study_service.restore_session(db, user_id, session_id)
        return study_service.log_session_time(db, user_id, session_id, body)
    except ValueError as exc:
        status = 404 if "not found" in str(exc).lower() else 400
        raise HTTPException(status_code=status, detail=str(exc)) from exc


@router.delete("/sessions/{session_id}", response_model=StudySessionItem | None)
def delete_session(
    session_id: str,
    db: DbSession,
    user_id: DashboardUserId,
    permanent: bool = Query(False),
    reason: str | None = Query(None),
) -> StudySessionItem | None:
    try:
        updated = study_service.delete_session(
            db,
            user_id,
            session_id,
            permanent=permanent,
            delete_reason=reason,
        )
        if updated is None:
            return None
        return updated
    except ValueError as exc:
        status = 404 if "not found" in str(exc).lower() else 400
        raise HTTPException(status_code=status, detail=str(exc)) from exc


@router.get("/plans", response_model=list[StudyPlanItem])
def list_plans(
    db: DbSession,
    user_id: DashboardUserId,
) -> list[StudyPlanItem]:
    return study_service.list_plans(db, user_id)


@router.post("/plans", response_model=StudyPlanItem)
def create_plan(
    body: StudyPlanCreate,
    db: DbSession,
    user_id: DashboardUserId,
) -> StudyPlanItem:
    return study_service.create_plan(db, user_id, body)


@router.patch("/plans/{plan_id}", response_model=StudyPlanItem)
def update_plan(
    plan_id: str,
    body: StudyPlanUpdate,
    db: DbSession,
    user_id: DashboardUserId,
) -> StudyPlanItem:
    try:
        return study_service.update_plan(db, user_id, plan_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/plans/{plan_id}")
def delete_plan(
    plan_id: str,
    db: DbSession,
    user_id: DashboardUserId,
) -> dict[str, bool]:
    try:
        study_service.delete_plan(db, user_id, plan_id)
        return {"ok": True}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/tasks", response_model=list[TaskItem])
def list_tasks(
    db: DbSession,
    user_id: DashboardUserId,
) -> list[TaskItem]:
    return study_service.list_tasks(db, user_id)


@router.post("/tasks", response_model=TaskItem)
def create_task(
    body: TaskCreate,
    db: DbSession,
    user_id: DashboardUserId,
) -> TaskItem:
    try:
        return study_service.create_task(db, user_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/tasks/{task_id}", response_model=TaskItem)
def update_task(
    task_id: str,
    body: TaskUpdate,
    db: DbSession,
    user_id: DashboardUserId,
) -> TaskItem:
    try:
        return study_service.update_task(db, user_id, task_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: str,
    db: DbSession,
    user_id: DashboardUserId,
) -> dict[str, bool]:
    try:
        study_service.delete_task(db, user_id, task_id)
        return {"ok": True}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
