"""Admin panel data queries (server-to-server from Next.js admin APIs)."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional

from sqlalchemy import Date, cast, func, or_, text
from sqlalchemy.orm import Session

from app.models.enums import Plan
from app.models.models import (
    AdminAuditLog,
    Conversation,
    Note,
    QuizAttempt,
    Reminder,
    Session as AuthSession,
    StudySession,
    User,
    cuid,
)


def _utcnow() -> datetime:
    """Naive UTC — matches DateTime columns stored without timezone."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _plan_value(plan: Any) -> str:
    if plan is None:
        return "FREE"
    return plan.value if hasattr(plan, "value") else str(plan)


def _to_date_key(value: Any) -> str:
    """Normalize DB date/datetime values to YYYY-MM-DD for chart maps."""
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    text_val = str(value).strip()
    return text_val[:10]


def _week_start(d: datetime) -> datetime:
    """Monday 00:00 of the week containing d."""
    day = d.replace(hour=0, minute=0, second=0, microsecond=0)
    return day - timedelta(days=day.weekday())


def create_audit_log(
    db: Session,
    *,
    admin_email: str,
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AdminAuditLog:
    row = AdminAuditLog(
        id=cuid(),
        adminEmail=admin_email,
        action=action,
        targetType=target_type,
        targetId=target_id,
        details=details,
        ipAddress=ip_address,
        userAgent=user_agent,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_dashboard_stats(db: Session) -> dict[str, Any]:
    now = _utcnow()
    start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_week = start_today - timedelta(days=start_today.weekday())
    start_month = start_today.replace(day=1)
    start_30 = start_today - timedelta(days=29)
    start_12w = start_today - timedelta(weeks=12)

    total_users = db.query(func.count(User.id)).scalar() or 0
    new_today = (
        db.query(func.count(User.id)).filter(User.createdAt >= start_today).scalar()
        or 0
    )
    new_week = (
        db.query(func.count(User.id)).filter(User.createdAt >= start_week).scalar()
        or 0
    )
    new_month = (
        db.query(func.count(User.id)).filter(User.createdAt >= start_month).scalar()
        or 0
    )
    paid_users = (
        db.query(func.count(User.id)).filter(User.plan != Plan.FREE).scalar() or 0
    )
    free_users = (
        db.query(func.count(User.id)).filter(User.plan == Plan.FREE).scalar() or 0
    )

    total_sessions = db.query(func.count(StudySession.id)).scalar() or 0
    total_mins = (
        db.query(func.coalesce(func.sum(StudySession.durationMins), 0)).scalar() or 0
    )
    total_notes = db.query(func.count(Note.id)).scalar() or 0
    notes_with_summary = (
        db.query(func.count(Note.id)).filter(Note.aiSummary.isnot(None)).scalar() or 0
    )
    total_quizzes = db.query(func.count(QuizAttempt.id)).scalar() or 0
    total_conversations = db.query(func.count(Conversation.id)).scalar() or 0
    avg_quiz_score = db.query(func.avg(QuizAttempt.score)).scalar()
    avg_quiz_score = float(avg_quiz_score) if avg_quiz_score is not None else 0.0

    # Daily signups last 30 days (always return 30 points so the chart renders)
    day_col = cast(User.createdAt, Date)
    daily_rows = (
        db.query(
            day_col.label("day"),
            func.count(User.id).label("count"),
        )
        .filter(User.createdAt >= start_30)
        .group_by(day_col)
        .all()
    )
    daily_map = {_to_date_key(r.day): int(r.count) for r in daily_rows}
    daily_signups = []
    for i in range(30):
        day = (start_30 + timedelta(days=i)).date()
        key = day.isoformat()
        daily_signups.append({"date": key, "count": daily_map.get(key, 0)})

    # Weekly study sessions last 12 weeks (always return 12 points)
    week_col = func.date_trunc("week", StudySession.startedAt)
    week_rows = (
        db.query(
            week_col.label("week"),
            func.count(StudySession.id).label("count"),
        )
        .filter(StudySession.startedAt >= start_12w)
        .group_by(week_col)
        .order_by(week_col)
        .all()
    )
    weekly_map: dict[str, int] = {}
    for r in week_rows:
        key = _to_date_key(r.week)
        if key:
            weekly_map[key] = int(r.count)

    weekly_active_sessions = []
    first_week = _week_start(start_12w)
    for i in range(12):
        week_dt = first_week + timedelta(weeks=i)
        key = week_dt.date().isoformat()
        iso_week = week_dt.isocalendar()[1]
        label = f"{week_dt.strftime('%b')} W{iso_week}"
        weekly_active_sessions.append(
            {"week": label, "count": weekly_map.get(key, 0), "weekStart": key}
        )

    plan_rows = (
        db.query(User.plan, func.count(User.id)).group_by(User.plan).all()
    )
    plan_distribution = {
        "FREE": 0,
        "PRO": 0,
        "PREMIUM_PLUS": 0,
        "ENTERPRISE": 0,
    }
    for plan, count in plan_rows:
        plan_distribution[_plan_value(plan)] = int(count)

    country_rows = (
        db.query(User.country, func.count(User.id).label("count"))
        .filter(User.country.isnot(None), User.country != "")
        .group_by(User.country)
        .order_by(func.count(User.id).desc())
        .limit(10)
        .all()
    )
    top_countries = [
        {"country": r.country or "Unknown", "count": int(r.count)} for r in country_rows
    ]

    edu_rows = (
        db.query(User.educationLevel, func.count(User.id))
        .group_by(User.educationLevel)
        .all()
    )
    education_level_breakdown: dict[str, int] = {
        "SCHOOL": 0,
        "COLLEGE": 0,
        "UNIVERSITY": 0,
        "JOB_TEST": 0,
        "UNKNOWN": 0,
    }
    for level, count in edu_rows:
        key = _plan_value(level) if level else "UNKNOWN"
        if key not in education_level_breakdown:
            education_level_breakdown[key] = 0
        education_level_breakdown[key] = int(count)

    # Users last month for trend
    prev_month_start = (start_month - timedelta(days=1)).replace(day=1)
    users_last_month = (
        db.query(func.count(User.id))
        .filter(User.createdAt >= prev_month_start, User.createdAt < start_month)
        .scalar()
        or 0
    )

    return {
        "totalUsers": total_users,
        "newUsersToday": new_today,
        "newUsersThisWeek": new_week,
        "newUsersThisMonth": new_month,
        "usersLastMonth": users_last_month,
        "paidUsers": paid_users,
        "freeUsers": free_users,
        "totalSessions": total_sessions,
        "totalSessionHours": round(float(total_mins) / 60.0, 1),
        "totalNotes": total_notes,
        "notesWithSummary": notes_with_summary,
        "totalQuizzes": total_quizzes,
        "totalConversations": total_conversations,
        "avgQuizScore": round(avg_quiz_score, 1),
        "dailySignups": daily_signups,
        "weeklyActiveSessions": weekly_active_sessions,
        "planDistribution": plan_distribution,
        "topCountries": top_countries,
        "educationLevelBreakdown": education_level_breakdown,
    }


def list_users(
    db: Session,
    *,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    plan: Optional[str] = None,
    sort: str = "createdAt_desc",
) -> dict[str, Any]:
    q = db.query(User)
    if search and search.strip():
        term = f"%{search.strip()}%"
        q = q.filter(
            or_(
                User.email.ilike(term),
                User.name.ilike(term),
                User.fullName.ilike(term),
            )
        )
    if plan and plan.upper() != "ALL":
        try:
            q = q.filter(User.plan == Plan(plan.upper()))
        except ValueError:
            pass

    total = q.count()

    if sort == "createdAt_asc":
        q = q.order_by(User.createdAt.asc())
    elif sort == "name_asc":
        q = q.order_by(func.coalesce(User.fullName, User.name, User.email).asc())
    else:
        q = q.order_by(User.createdAt.desc())

    page = max(1, page)
    limit = min(100, max(1, limit))
    rows = q.offset((page - 1) * limit).limit(limit).all()

    # Plan counts for stats bar (unfiltered by search optionally — use same filter)
    plan_counts = {
        "FREE": db.query(func.count(User.id)).filter(User.plan == Plan.FREE).scalar()
        or 0,
        "PRO": db.query(func.count(User.id)).filter(User.plan == Plan.PRO).scalar()
        or 0,
        "PREMIUM_PLUS": db.query(func.count(User.id))
        .filter(User.plan == Plan.PREMIUM_PLUS)
        .scalar()
        or 0,
        "ENTERPRISE": db.query(func.count(User.id))
        .filter(User.plan == Plan.ENTERPRISE)
        .scalar()
        or 0,
    }

    users = [
        {
            "id": u.id,
            "name": u.fullName or u.name,
            "email": u.email,
            "plan": _plan_value(u.plan),
            "createdAt": u.createdAt.isoformat() if u.createdAt else None,
            "country": u.country,
            "educationLevel": _plan_value(u.educationLevel)
            if u.educationLevel
            else None,
            "onboardingComplete": u.onboardingComplete,
            "preferredLanguage": u.language,
            "image": u.image,
        }
        for u in rows
    ]

    return {
        "users": users,
        "total": total,
        "page": page,
        "totalPages": max(1, (total + limit - 1) // limit),
        "planCounts": plan_counts,
    }


def get_user_detail(db: Session, user_id: str) -> Optional[dict[str, Any]]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    study_session_count = (
        db.query(func.count(StudySession.id))
        .filter(StudySession.userId == user_id)
        .scalar()
        or 0
    )
    total_mins = (
        db.query(func.coalesce(func.sum(StudySession.durationMins), 0))
        .filter(StudySession.userId == user_id)
        .scalar()
        or 0
    )
    note_count = (
        db.query(func.count(Note.id)).filter(Note.userId == user_id).scalar() or 0
    )
    quiz_count = (
        db.query(func.count(QuizAttempt.id))
        .filter(QuizAttempt.userId == user_id)
        .scalar()
        or 0
    )
    conversation_count = (
        db.query(func.count(Conversation.id))
        .filter(Conversation.userId == user_id)
        .scalar()
        or 0
    )
    reminder_count = (
        db.query(func.count(Reminder.id)).filter(Reminder.userId == user_id).scalar()
        or 0
    )

    last_session = (
        db.query(AuthSession)
        .filter(AuthSession.userId == user_id)
        .order_by(AuthSession.expires.desc())
        .first()
    )

    quizzes = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.userId == user_id)
        .order_by(QuizAttempt.createdAt.desc())
        .limit(10)
        .all()
    )
    sessions = (
        db.query(StudySession)
        .filter(StudySession.userId == user_id)
        .order_by(StudySession.startedAt.desc())
        .limit(5)
        .all()
    )

    audit = (
        db.query(AdminAuditLog)
        .filter(
            AdminAuditLog.targetType == "user",
            AdminAuditLog.targetId == user_id,
        )
        .order_by(AdminAuditLog.createdAt.desc())
        .limit(5)
        .all()
    )

    return {
        "user": {
            "id": user.id,
            "name": user.fullName or user.name,
            "email": user.email,
            "plan": _plan_value(user.plan),
            "createdAt": user.createdAt.isoformat() if user.createdAt else None,
            "country": user.country,
            "educationLevel": _plan_value(user.educationLevel)
            if user.educationLevel
            else None,
            "onboardingComplete": user.onboardingComplete,
            "preferredLanguage": user.language,
            "image": user.image,
            "fullName": user.fullName,
            "age": user.age,
            "gradeOrYear": user.gradeOrYear,
        },
        "stats": {
            "studySessionCount": study_session_count,
            "totalStudyHours": round(float(total_mins) / 60.0, 1),
            "noteCount": note_count,
            "quizCount": quiz_count,
            "conversationCount": conversation_count,
            "reminderCount": reminder_count,
            "lastLogin": last_session.expires.isoformat() if last_session else None,
        },
        "quizAttempts": [
            {
                "id": q.id,
                "subject": q.subject,
                "topic": q.topic,
                "score": q.score,
                "difficulty": q.difficulty,
                "createdAt": q.createdAt.isoformat() if q.createdAt else None,
            }
            for q in quizzes
        ],
        "recentSessions": [
            {
                "id": s.id,
                "subject": s.subject,
                "durationMins": s.durationMins,
                "startedAt": s.startedAt.isoformat() if s.startedAt else None,
            }
            for s in sessions
        ],
        "auditTrail": [
            {
                "id": a.id,
                "adminEmail": a.adminEmail,
                "action": a.action,
                "details": a.details,
                "createdAt": a.createdAt.isoformat() if a.createdAt else None,
            }
            for a in audit
        ],
    }


def update_user_plan(db: Session, user_id: str, plan: str) -> Optional[dict[str, Any]]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    old_plan = _plan_value(user.plan)
    try:
        user.plan = Plan(plan.upper())
    except ValueError:
        raise ValueError(f"Invalid plan: {plan}")
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "plan": _plan_value(user.plan),
        "oldPlan": old_plan,
    }


def deactivate_user(db: Session, user_id: str) -> Optional[dict[str, Any]]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.plan = Plan.FREE
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "plan": _plan_value(user.plan),
    }


def list_audit_logs(
    db: Session,
    *,
    page: int = 1,
    limit: int = 50,
    admin_email: Optional[str] = None,
    action: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> dict[str, Any]:
    q = db.query(AdminAuditLog)
    if admin_email:
        q = q.filter(AdminAuditLog.adminEmail == admin_email)
    if action:
        q = q.filter(AdminAuditLog.action == action)
    if date_from:
        try:
            q = q.filter(AdminAuditLog.createdAt >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            end = datetime.fromisoformat(date_to)
            if end.hour == 0 and end.minute == 0:
                end = end + timedelta(days=1)
            q = q.filter(AdminAuditLog.createdAt < end)
        except ValueError:
            pass

    total = q.count()
    page = max(1, page)
    limit = min(100, max(1, limit))
    rows = (
        q.order_by(AdminAuditLog.createdAt.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "logs": [
            {
                "id": r.id,
                "adminEmail": r.adminEmail,
                "action": r.action,
                "targetType": r.targetType,
                "targetId": r.targetId,
                "details": r.details,
                "ipAddress": r.ipAddress,
                "userAgent": r.userAgent,
                "createdAt": r.createdAt.isoformat() if r.createdAt else None,
            }
            for r in rows
        ],
        "total": total,
        "page": page,
        "totalPages": max(1, (total + limit - 1) // limit),
    }


def get_content_overview(db: Session) -> dict[str, Any]:
    total_notes = db.query(func.count(Note.id)).scalar() or 0
    notes_with_summary = (
        db.query(func.count(Note.id)).filter(Note.aiSummary.isnot(None)).scalar() or 0
    )
    avg_note_length = (
        db.query(func.avg(func.length(Note.content))).scalar() or 0
    )
    total_quizzes = db.query(func.count(QuizAttempt.id)).scalar() or 0
    avg_score = db.query(func.avg(QuizAttempt.score)).scalar()
    avg_score = float(avg_score) if avg_score is not None else 0.0

    recent_notes = (
        db.query(Note, User.email)
        .join(User, User.id == Note.userId)
        .order_by(Note.createdAt.desc())
        .limit(50)
        .all()
    )
    recent_quizzes = (
        db.query(QuizAttempt, User.email)
        .join(User, User.id == QuizAttempt.userId)
        .order_by(QuizAttempt.createdAt.desc())
        .limit(50)
        .all()
    )

    subject_rows = (
        db.query(QuizAttempt.subject, func.count(QuizAttempt.id).label("count"))
        .group_by(QuizAttempt.subject)
        .order_by(func.count(QuizAttempt.id).desc())
        .limit(10)
        .all()
    )

    start_30 = _utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(
        days=29
    )
    day_col = cast(QuizAttempt.createdAt, Date)
    score_rows = (
        db.query(
            day_col.label("day"),
            func.avg(QuizAttempt.score).label("avg"),
        )
        .filter(QuizAttempt.createdAt >= start_30)
        .group_by(day_col)
        .order_by(day_col)
        .all()
    )

    return {
        "totalNotes": total_notes,
        "notesWithSummary": notes_with_summary,
        "averageNoteLength": int(avg_note_length or 0),
        "totalQuizAttempts": total_quizzes,
        "averageScore": round(avg_score, 1),
        "recentNotes": [
            {
                "id": n.id,
                "title": n.title,
                "userId": n.userId,
                "userEmail": email,
                "subject": n.subject,
                "hasSummary": bool(n.aiSummary),
                "createdAt": n.createdAt.isoformat() if n.createdAt else None,
            }
            for n, email in recent_notes
        ],
        "recentQuizzes": [
            {
                "id": q.id,
                "userId": q.userId,
                "userEmail": email,
                "subject": q.subject,
                "topic": q.topic,
                "score": q.score,
                "difficulty": q.difficulty,
                "createdAt": q.createdAt.isoformat() if q.createdAt else None,
            }
            for q, email in recent_quizzes
        ],
        "topSubjects": [
            {"subject": r.subject, "count": int(r.count)} for r in subject_rows
        ],
        "scoresOverTime": [
            {
                "date": _to_date_key(r.day),
                "avgScore": round(float(r.avg or 0), 1),
            }
            for r in score_rows
        ],
    }


def get_system_health(db: Session) -> dict[str, Any]:
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    return {
        "dbStatus": db_status,
        "tableCounts": {
            "users": db.query(func.count(User.id)).scalar() or 0,
            "sessions": db.query(func.count(StudySession.id)).scalar() or 0,
            "notes": db.query(func.count(Note.id)).scalar() or 0,
            "quizzes": db.query(func.count(QuizAttempt.id)).scalar() or 0,
            "auditLogs": db.query(func.count(AdminAuditLog.id)).scalar() or 0,
        },
    }
