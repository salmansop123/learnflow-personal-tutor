import json
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import Priority
from app.models.models import StudyPlan, StudySession, Task, User
from app.schemas.study import (
    StudyPlanCreate,
    StudyPlanItem,
    StudyPlanUpdate,
    StudySessionCreate,
    StudySessionEnd,
    StudySessionItem,
    StudySessionLogTime,
    SubjectMergeResponse,
    SubjectTotalStatsItem,
    TaskCreate,
    TaskItem,
    TaskUpdate,
)

_SUBJECT_CHART_COLORS = (
    "#0ea5e9",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
    "#f97316",
    "#64748b",
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_subjects(subjects: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for raw in subjects:
        trimmed = raw.strip()
        if not trimmed:
            continue
        key = trimmed.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(trimmed)
    return result


def _parse_subject_time_log(raw: str | None) -> dict[str, int] | None:
    if not raw:
        return None
    try:
        data = json.loads(raw)
        if not isinstance(data, dict):
            return None
        return {str(k): int(v) for k, v in data.items()}
    except (json.JSONDecodeError, TypeError, ValueError):
        return None


def _serialize_subject_time_log(log: dict[str, int] | None) -> str | None:
    if not log:
        return None
    return json.dumps({k: int(v) for k, v in log.items()})


def _session_item(session: StudySession) -> StudySessionItem:
    return StudySessionItem(
        id=session.id,
        subject=session.subject,
        startedAt=session.startedAt,
        endedAt=session.endedAt,
        durationMins=session.durationMins,
        notes=session.notes,
        subjects=list(session.subjects or []),
        subjectTimeLog=_parse_subject_time_log(session.subjectTimeLog),
        timeLogCompleted=bool(session.timeLogCompleted),
        isDeleted=bool(session.isDeleted),
        deletedAt=session.deletedAt,
        deleteReason=session.deleteReason,
    )


def list_sessions(
    db: Session, user_id: str, *, deleted: bool = False
) -> list[StudySessionItem]:
    order_col = (
        StudySession.deletedAt.desc()
        if deleted
        else StudySession.startedAt.desc()
    )
    rows = db.scalars(
        select(StudySession)
        .where(
            StudySession.userId == user_id,
            StudySession.isDeleted.is_(deleted),
        )
        .order_by(order_col)
    ).all()
    return [_session_item(s) for s in rows]


def get_active_session(db: Session, user_id: str) -> StudySessionItem | None:
    row = db.scalar(
        select(StudySession)
        .where(
            StudySession.userId == user_id,
            StudySession.endedAt.is_(None),
            StudySession.isDeleted.is_(False),
        )
        .order_by(StudySession.startedAt.desc())
        .limit(1)
    )
    if not row:
        return None
    return _session_item(row)


def create_session(
    db: Session, user_id: str, body: StudySessionCreate
) -> StudySessionItem:
    active = get_active_session(db, user_id)
    if active:
        raise ValueError("An active study session already exists")

    subjects = _normalize_subjects(body.subjects)
    if not subjects:
        raise ValueError("Please enter at least one subject")
    primary_subject = subjects[0]
    session = StudySession(
        userId=user_id,
        subject=primary_subject,
        subjects=subjects,
        notes=body.notes,
        startedAt=_utcnow(),
        timeLogCompleted=False,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _session_item(session)


def end_session(
    db: Session,
    user_id: str,
    session_id: str,
    body: StudySessionEnd,
) -> StudySessionItem:
    session = db.scalar(
        select(StudySession).where(
            StudySession.id == session_id,
            StudySession.userId == user_id,
        )
    )
    if not session:
        raise ValueError("Session not found")
    if session.endedAt is not None:
        raise ValueError("Session already ended")

    session.endedAt = body.ended_at if body.ended_at is not None else _utcnow()
    session.durationMins = body.duration_mins
    if body.notes is not None:
        session.notes = body.notes
    db.commit()
    db.refresh(session)
    return _session_item(session)


def log_session_time(
    db: Session,
    user_id: str,
    session_id: str,
    body: StudySessionLogTime,
) -> StudySessionItem:
    session = db.scalar(
        select(StudySession).where(
            StudySession.id == session_id,
            StudySession.userId == user_id,
        )
    )
    if not session:
        raise ValueError("Session not found")
    if session.endedAt is None:
        raise ValueError("End the session before logging subject time")

    if not body.subject_time_log:
        raise ValueError("subjectTimeLog is required")

    session.subjectTimeLog = _serialize_subject_time_log(body.subject_time_log)
    session.timeLogCompleted = True
    db.commit()
    db.refresh(session)
    return _session_item(session)


def get_subject_stats(
    db: Session,
    user_id: str,
    on_date: date | None = None,
) -> list[SubjectTotalStatsItem]:
    rows = db.scalars(
        select(StudySession).where(
            StudySession.userId == user_id,
            StudySession.timeLogCompleted.is_(True),
            StudySession.endedAt.isnot(None),
            StudySession.isDeleted.is_(False),
        )
    ).all()

    totals: dict[str, int] = {}
    for row in rows:
        if on_date is not None:
            ended = row.endedAt
            if ended is None:
                continue
            ended_day = ended.date() if hasattr(ended, "date") else ended
            if ended_day != on_date:
                continue
        log = _parse_subject_time_log(row.subjectTimeLog) or {}
        for name, mins in log.items():
            totals[name] = totals.get(name, 0) + max(0, int(mins))

    grand_total = sum(totals.values())
    if grand_total <= 0:
        return []

    sorted_items = sorted(totals.items(), key=lambda x: x[1], reverse=True)
    stats: list[SubjectTotalStatsItem] = []
    for index, (name, minutes) in enumerate(sorted_items):
        percentage = round((minutes / grand_total) * 1000) / 10
        stats.append(
            SubjectTotalStatsItem(
                subject=name,
                totalMinutes=minutes,
                percentage=percentage,
                color=_SUBJECT_CHART_COLORS[index % len(_SUBJECT_CHART_COLORS)],
            )
        )
    return stats


def list_plans(db: Session, user_id: str) -> list[StudyPlanItem]:
    rows = db.execute(
        select(StudyPlan, func.count(Task.id).label("task_count"))
        .outerjoin(Task, Task.planId == StudyPlan.id)
        .where(StudyPlan.userId == user_id)
        .group_by(StudyPlan.id)
        .order_by(StudyPlan.createdAt.desc())
    ).all()
    return [
        StudyPlanItem(
            id=plan.id,
            title=plan.title,
            subject=plan.subject,
            description=plan.description,
            goalDate=plan.goalDate,
            isActive=plan.isActive,
            createdAt=plan.createdAt,
            taskCount=task_count or 0,
        )
        for plan, task_count in rows
    ]


def create_plan(db: Session, user_id: str, body: StudyPlanCreate) -> StudyPlanItem:
    plan = StudyPlan(
        userId=user_id,
        title=body.title,
        subject=body.subject,
        description=body.description,
        goalDate=body.goal_date,
        isActive=True,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return StudyPlanItem(
        id=plan.id,
        title=plan.title,
        subject=plan.subject,
        description=plan.description,
        goalDate=plan.goalDate,
        isActive=plan.isActive,
        createdAt=plan.createdAt,
        taskCount=0,
    )


def update_plan(
    db: Session, user_id: str, plan_id: str, body: StudyPlanUpdate
) -> StudyPlanItem:
    plan = db.scalar(
        select(StudyPlan).where(
            StudyPlan.id == plan_id,
            StudyPlan.userId == user_id,
        )
    )
    if not plan:
        raise ValueError("Plan not found")

    if body.title is not None:
        plan.title = body.title
    if body.subject is not None:
        plan.subject = body.subject
    if body.description is not None:
        plan.description = body.description
    if body.goal_date is not None:
        plan.goalDate = body.goal_date
    if body.is_active is not None:
        plan.isActive = body.is_active

    db.commit()
    db.refresh(plan)
    count = (
        db.scalar(
            select(func.count()).select_from(Task).where(Task.planId == plan_id)
        )
        or 0
    )
    return StudyPlanItem(
        id=plan.id,
        title=plan.title,
        subject=plan.subject,
        description=plan.description,
        goalDate=plan.goalDate,
        isActive=plan.isActive,
        createdAt=plan.createdAt,
        taskCount=count,
    )


def list_tasks(db: Session, user_id: str) -> list[TaskItem]:
    rows = db.scalars(
        select(Task).where(Task.userId == user_id).order_by(Task.createdAt.desc())
    ).all()
    return [_task_item(t) for t in rows]


def _task_item(task: Task) -> TaskItem:
    priority = (
        task.priority.value if hasattr(task.priority, "value") else str(task.priority)
    )
    return TaskItem(
        id=task.id,
        planId=task.planId,
        title=task.title,
        completed=task.completed,
        dueDate=task.dueDate,
        priority=priority,
        createdAt=task.createdAt,
    )


def create_task(db: Session, user_id: str, body: TaskCreate) -> TaskItem:
    if body.plan_id:
        plan = db.scalar(
            select(StudyPlan).where(
                StudyPlan.id == body.plan_id,
                StudyPlan.userId == user_id,
            )
        )
        if not plan:
            raise ValueError("Plan not found")

    try:
        priority = Priority(body.priority)
    except ValueError as exc:
        raise ValueError("Invalid priority") from exc

    task = Task(
        userId=user_id,
        planId=body.plan_id,
        title=body.title,
        dueDate=body.due_date,
        priority=priority,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_item(task)


def update_task(
    db: Session, user_id: str, task_id: str, body: TaskUpdate
) -> TaskItem:
    task = db.scalar(
        select(Task).where(Task.id == task_id, Task.userId == user_id)
    )
    if not task:
        raise ValueError("Task not found")

    if body.title is not None:
        task.title = body.title
    if body.completed is not None:
        task.completed = body.completed
    if body.due_date is not None:
        task.dueDate = body.due_date
    if body.plan_id is not None:
        task.planId = body.plan_id
    if body.priority is not None:
        try:
            task.priority = Priority(body.priority)
        except ValueError as exc:
            raise ValueError("Invalid priority") from exc

    db.commit()
    db.refresh(task)
    return _task_item(task)


def _replace_subject_names_in_list(
    items: list[str], from_lower: set[str], into: str
) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for raw in items:
        trimmed = raw.strip()
        if not trimmed:
            continue
        name = into if trimmed.lower() in from_lower else trimmed
        key = name.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(name)
    return result


def _merge_subject_time_log_keys(
    log: dict[str, int] | None, from_lower: set[str], into: str
) -> dict[str, int] | None:
    if not log:
        return log
    merged = dict(log)
    minutes_to_add = 0
    remove_keys: list[str] = []
    for key, mins in merged.items():
        if key.strip().lower() in from_lower:
            minutes_to_add += max(0, int(mins))
            remove_keys.append(key)
    for key in remove_keys:
        del merged[key]
    if minutes_to_add > 0:
        existing_key = None
        for key in list(merged.keys()):
            if key.strip().lower() == into.strip().lower():
                existing_key = key
                break
        if existing_key:
            merged[existing_key] = merged[existing_key] + minutes_to_add
        else:
            merged[into] = merged.get(into, 0) + minutes_to_add
    return merged or None


def _session_touches_merge_names(
    subjects: list[str],
    primary_subject: str | None,
    time_log: dict[str, int] | None,
    from_lower: set[str],
) -> bool:
    if primary_subject and primary_subject.strip().lower() in from_lower:
        return True
    if any(s.strip().lower() in from_lower for s in subjects):
        return True
    if time_log and any(k.strip().lower() in from_lower for k in time_log):
        return True
    return False


def merge_subjects(
    db: Session, user_id: str, from_names: list[str], into: str
) -> SubjectMergeResponse:
    into_clean = into.strip()
    if not into_clean:
        raise ValueError("Target subject name is required")

    from_clean = [name.strip() for name in from_names if name.strip()]
    if not from_clean:
        raise ValueError("At least one source subject is required")

    from_lower = {name.lower() for name in from_clean}
    from_lower.discard(into_clean.lower())

    if not from_lower:
        raise ValueError("Nothing to merge — sources match the target name")

    sessions_updated = 0
    rows = db.scalars(
        select(StudySession).where(
            StudySession.userId == user_id,
            StudySession.isDeleted.is_(False),
        )
    ).all()

    for row in rows:
        subjects = list(row.subjects or [])
        time_log = _parse_subject_time_log(row.subjectTimeLog)
        if not _session_touches_merge_names(
            subjects, row.subject, time_log, from_lower
        ):
            continue

        changed = False
        new_subjects = _replace_subject_names_in_list(
            subjects, from_lower, into_clean
        )
        if new_subjects != subjects:
            row.subjects = new_subjects
            changed = True

        if row.subject and row.subject.strip().lower() in from_lower:
            row.subject = into_clean
            changed = True
        elif new_subjects:
            row.subject = new_subjects[0]

        new_log = _merge_subject_time_log_keys(time_log, from_lower, into_clean)
        serialized = _serialize_subject_time_log(new_log)
        if serialized != row.subjectTimeLog:
            row.subjectTimeLog = serialized
            changed = True

        if changed:
            sessions_updated += 1

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise ValueError("User not found")

    user.subjectNames = _replace_subject_names_in_list(
        list(user.subjectNames or []), from_lower, into_clean
    )
    user.weakSubjects = _replace_subject_names_in_list(
        list(user.weakSubjects or []), from_lower, into_clean
    )
    user.strongSubjects = _replace_subject_names_in_list(
        list(user.strongSubjects or []), from_lower, into_clean
    )
    user.totalSubjects = len(user.subjectNames)

    db.commit()

    from_label = ", ".join(f"'{name}'" for name in from_clean)
    message = (
        f"{from_label} have been merged into '{into_clean}'. "
        f"Your pie chart has been updated."
    )
    return SubjectMergeResponse(sessionsUpdated=sessions_updated, message=message)


def _get_owned_session(
    db: Session, user_id: str, session_id: str
) -> StudySession:
    session = db.scalar(
        select(StudySession).where(
            StudySession.id == session_id,
            StudySession.userId == user_id,
        )
    )
    if not session:
        raise ValueError("Session not found")
    return session


def soft_delete_session(
    db: Session,
    user_id: str,
    session_id: str,
    delete_reason: str | None = None,
) -> StudySessionItem:
    session = _get_owned_session(db, user_id, session_id)
    if session.endedAt is None:
        raise ValueError("Cannot delete an active session — end it first")
    if session.isDeleted:
        raise ValueError("Session already deleted")
    session.isDeleted = True
    session.deletedAt = _utcnow()
    session.deleteReason = delete_reason.strip() if delete_reason else None
    db.commit()
    db.refresh(session)
    return _session_item(session)


def restore_session(
    db: Session, user_id: str, session_id: str
) -> StudySessionItem:
    session = _get_owned_session(db, user_id, session_id)
    if not session.isDeleted:
        raise ValueError("Session is not deleted")
    session.isDeleted = False
    session.deletedAt = None
    session.deleteReason = None
    db.commit()
    db.refresh(session)
    return _session_item(session)


def permanently_delete_session(
    db: Session, user_id: str, session_id: str
) -> None:
    session = _get_owned_session(db, user_id, session_id)
    if not session.isDeleted:
        raise ValueError("Session must be soft-deleted before permanent removal")
    db.delete(session)
    db.commit()


def delete_session(
    db: Session,
    user_id: str,
    session_id: str,
    *,
    permanent: bool = False,
    delete_reason: str | None = None,
) -> StudySessionItem | None:
    if permanent:
        permanently_delete_session(db, user_id, session_id)
        return None
    return soft_delete_session(db, user_id, session_id, delete_reason)


def delete_plan(db: Session, user_id: str, plan_id: str) -> None:
    plan = db.scalar(
        select(StudyPlan).where(
            StudyPlan.id == plan_id,
            StudyPlan.userId == user_id,
        )
    )
    if not plan:
        raise ValueError("Plan not found")

    linked_tasks = db.scalars(
        select(Task).where(Task.planId == plan_id, Task.userId == user_id)
    ).all()
    for task in linked_tasks:
        task.planId = None

    db.delete(plan)
    db.commit()


def purge_deleted_sessions_older_than_days(
    db: Session, days: int = 30
) -> int:
    """Permanently remove soft-deleted sessions past the retention window."""
    cutoff = _utcnow() - timedelta(days=days)
    rows = db.scalars(
        select(StudySession).where(
            StudySession.isDeleted.is_(True),
            StudySession.deletedAt.isnot(None),
            StudySession.deletedAt < cutoff,
        )
    ).all()
    count = len(rows)
    for row in rows:
        db.delete(row)
    if count > 0:
        db.commit()
    return count


def delete_task(db: Session, user_id: str, task_id: str) -> None:
    task = db.scalar(
        select(Task).where(Task.id == task_id, Task.userId == user_id)
    )
    if not task:
        raise ValueError("Task not found")
    db.delete(task)
    db.commit()
