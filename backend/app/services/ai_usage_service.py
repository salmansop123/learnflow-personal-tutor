"""AI feature usage tracking, limits, and resets."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.ai_usage_limits import (
    FEATURE_LABELS,
    FEATURE_TO_LIMIT_KEY,
    AiFeature,
    get_plan_limits,
    is_unlimited,
)
from app.models.models import AIUsage, User, cuid
from app.schemas.ai_usage import (
    AiUsageCheckResponse,
    AiUsageConsumeResponse,
    AiUsageFeatureStatus,
    AiUsageOverview,
)
from app.services.user_service import get_user

VALID_FEATURES: set[str] = set(FEATURE_LABELS.keys())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _start_of_next_month(now: datetime) -> datetime:
    if now.month == 12:
        return datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
    return datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)


def _start_of_today(now: datetime) -> datetime:
    return datetime(now.year, now.month, now.day, tzinfo=timezone.utc)


def _start_of_tomorrow(now: datetime) -> datetime:
    from datetime import timedelta

    return _start_of_today(now) + timedelta(days=1)


def _plan_str(user: User) -> str:
    plan = user.plan
    return plan.value if hasattr(plan, "value") else str(plan)


def _ensure_aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def get_or_create_usage(db: Session, user: User) -> AIUsage:
    usage = db.scalar(select(AIUsage).where(AIUsage.userId == user.id))
    now = _utcnow()
    if usage:
        usage.subscriptionPlan = _plan_str(user)
        _apply_lazy_resets(usage, now)
        return usage

    usage = AIUsage(
        id=cuid(),
        userId=user.id,
        subscriptionPlan=_plan_str(user),
        dailyChatUsed=0,
        monthlyChatUsed=0,
        quizUsed=0,
        assignmentUsed=0,
        pdfAnalysisUsed=0,
        summaryUsed=0,
        studyPlanUsed=0,
        tokensUsed=0,
        dailyResetAt=_start_of_tomorrow(now),
        resetDate=_start_of_next_month(now),
    )
    db.add(usage)
    db.flush()
    return usage


def _apply_lazy_resets(usage: AIUsage, now: datetime) -> None:
    daily_at = _ensure_aware(usage.dailyResetAt)
    monthly_at = _ensure_aware(usage.resetDate)

    if daily_at is None or now >= daily_at:
        usage.dailyChatUsed = 0
        usage.dailyResetAt = _start_of_tomorrow(now)

    if monthly_at is None or now >= monthly_at:
        usage.monthlyChatUsed = 0
        usage.quizUsed = 0
        usage.assignmentUsed = 0
        usage.pdfAnalysisUsed = 0
        usage.summaryUsed = 0
        usage.studyPlanUsed = 0
        usage.resetDate = _start_of_next_month(now)


def _used_for_feature(usage: AIUsage, feature: AiFeature) -> int:
    if feature == "chat":
        return usage.monthlyChatUsed
    if feature == "quiz":
        return usage.quizUsed
    if feature == "assignment":
        return usage.assignmentUsed
    if feature == "pdf_analysis":
        return usage.pdfAnalysisUsed
    if feature == "summary":
        return usage.summaryUsed
    if feature == "study_plan":
        return usage.studyPlanUsed
    return 0


def _increment_feature(usage: AIUsage, feature: AiFeature) -> None:
    if feature == "chat":
        usage.dailyChatUsed += 1
        usage.monthlyChatUsed += 1
    elif feature == "quiz":
        usage.quizUsed += 1
    elif feature == "assignment":
        usage.assignmentUsed += 1
    elif feature == "pdf_analysis":
        usage.pdfAnalysisUsed += 1
    elif feature == "summary":
        usage.summaryUsed += 1
    elif feature == "study_plan":
        usage.studyPlanUsed += 1
    usage.updatedAt = _utcnow()


def _feature_status(
    feature: AiFeature,
    used: int,
    limit: int | None,
    period: str,
) -> AiUsageFeatureStatus:
    unlimited = is_unlimited(limit)
    remaining = None if unlimited else max(0, (limit or 0) - used)
    percent = 0.0
    if not unlimited and limit and limit > 0:
        percent = min(100.0, round((used / limit) * 100, 1))
    return AiUsageFeatureStatus(
        feature=feature,
        label=FEATURE_LABELS[feature],
        used=used,
        limit=limit,
        remaining=remaining,
        unlimited=unlimited,
        percent=percent,
        period=period,
    )


def build_overview(usage: AIUsage) -> AiUsageOverview:
    limits = get_plan_limits(usage.subscriptionPlan)
    features = [
        _feature_status(
            "chat",
            usage.dailyChatUsed,
            limits.get("daily_chat"),
            "day",
        ),
        _feature_status(
            "chat",
            usage.monthlyChatUsed,
            limits.get("monthly_chat"),
            "month",
        ),
        _feature_status("quiz", usage.quizUsed, limits.get("quiz"), "month"),
        _feature_status(
            "assignment", usage.assignmentUsed, limits.get("assignment"), "month"
        ),
        _feature_status(
            "pdf_analysis",
            usage.pdfAnalysisUsed,
            limits.get("pdf_analysis"),
            "month",
        ),
        _feature_status("summary", usage.summaryUsed, limits.get("summary"), "month"),
        _feature_status(
            "study_plan", usage.studyPlanUsed, limits.get("study_plan"), "month"
        ),
    ]

    # Deduplicate chat: keep both day and month as separate cards via feature+period
    # Rename first chat card feature key for clarity in UI
    features[0] = features[0].model_copy(update={"feature": "chat_daily"})
    features[1] = features[1].model_copy(update={"feature": "chat_monthly"})

    warning = _compute_warning(features)

    return AiUsageOverview(
        subscriptionPlan=usage.subscriptionPlan,
        dailyChatUsed=usage.dailyChatUsed,
        monthlyChatUsed=usage.monthlyChatUsed,
        quizUsed=usage.quizUsed,
        assignmentUsed=usage.assignmentUsed,
        pdfAnalysisUsed=usage.pdfAnalysisUsed,
        summaryUsed=usage.summaryUsed,
        studyPlanUsed=usage.studyPlanUsed,
        resetDate=usage.resetDate,
        dailyResetAt=usage.dailyResetAt,
        features=features,
        warningLevel=warning,
    )


def _compute_warning(features: list[AiUsageFeatureStatus]) -> str | None:
    max_pct = 0.0
    any_exhausted = False
    for f in features:
        if f.unlimited:
            continue
        if f.remaining == 0 and (f.limit or 0) > 0:
            any_exhausted = True
        max_pct = max(max_pct, f.percent)
    if any_exhausted:
        return "exhausted"
    if max_pct >= 90:
        return "warn90"
    if max_pct >= 75:
        return "warn75"
    return None


def _deny_message(feature: AiFeature, period: str) -> str:
    label = FEATURE_LABELS[feature]
    if feature == "chat" and period == "day":
        return (
            f"You have reached your daily {label} limit. "
            "Upgrade to Pro to continue, or try again tomorrow."
        )
    return (
        f"You have reached your monthly {label} limit. "
        "Upgrade to Pro to continue."
    )


def check_feature(
    db: Session, user_id: str, feature: str
) -> AiUsageCheckResponse:
    if feature not in VALID_FEATURES:
        raise ValueError(f"Invalid feature: {feature}")

    user = get_user(db, user_id)
    if not user:
        raise ValueError("User not found")

    usage = get_or_create_usage(db, user)
    db.commit()
    db.refresh(usage)

    feat = feature  # type: ignore[assignment]
    limits = get_plan_limits(usage.subscriptionPlan)
    overview = build_overview(usage)

    if feat == "chat":
        daily_limit = limits.get("daily_chat")
        monthly_limit = limits.get("monthly_chat")
        if not is_unlimited(daily_limit) and usage.dailyChatUsed >= (daily_limit or 0):
            return AiUsageCheckResponse(
                allowed=False,
                message=_deny_message("chat", "day"),
                overview=overview,
            )
        if not is_unlimited(monthly_limit) and usage.monthlyChatUsed >= (
            monthly_limit or 0
        ):
            return AiUsageCheckResponse(
                allowed=False,
                message=_deny_message("chat", "month"),
                overview=overview,
            )
        return AiUsageCheckResponse(
            allowed=True, message="OK", overview=overview
        )

    limit_key = FEATURE_TO_LIMIT_KEY[feat]  # type: ignore[index]
    limit = limits.get(limit_key)
    used = _used_for_feature(usage, feat)  # type: ignore[arg-type]
    if not is_unlimited(limit) and used >= (limit or 0):
        return AiUsageCheckResponse(
            allowed=False,
            message=_deny_message(feat, "month"),  # type: ignore[arg-type]
            overview=overview,
        )
    return AiUsageCheckResponse(allowed=True, message="OK", overview=overview)


def consume_feature(
    db: Session,
    user_id: str,
    feature: str,
    tokens: int = 0,
) -> AiUsageConsumeResponse:
    check = check_feature(db, user_id, feature)
    if not check.allowed:
        return AiUsageConsumeResponse(
            success=False,
            message=check.message,
            overview=check.overview,
        )

    user = get_user(db, user_id)
    if not user:
        raise ValueError("User not found")

    usage = get_or_create_usage(db, user)
    _increment_feature(usage, feature)  # type: ignore[arg-type]
    if tokens > 0:
        usage.tokensUsed += tokens
    db.commit()
    db.refresh(usage)

    return AiUsageConsumeResponse(
        success=True,
        message="Usage recorded",
        overview=build_overview(usage),
    )


def get_overview(db: Session, user_id: str) -> AiUsageOverview:
    user = get_user(db, user_id)
    if not user:
        raise ValueError("User not found")
    usage = get_or_create_usage(db, user)
    db.commit()
    db.refresh(usage)
    return build_overview(usage)


def reset_daily_all(db: Session) -> int:
    """Reset daily chat counters for all users whose dailyResetAt has passed."""
    now = _utcnow()
    rows = db.scalars(
        select(AIUsage).where(
            (AIUsage.dailyResetAt.is_(None)) | (AIUsage.dailyResetAt <= now)
        )
    ).all()
    count = 0
    tomorrow = _start_of_tomorrow(now)
    for usage in rows:
        usage.dailyChatUsed = 0
        usage.dailyResetAt = tomorrow
        usage.updatedAt = now
        count += 1
    db.commit()
    return count


def reset_monthly_all(db: Session) -> int:
    """Reset monthly feature counters for all users whose resetDate has passed."""
    now = _utcnow()
    rows = db.scalars(
        select(AIUsage).where(
            (AIUsage.resetDate.is_(None)) | (AIUsage.resetDate <= now)
        )
    ).all()
    count = 0
    next_month = _start_of_next_month(now)
    for usage in rows:
        usage.monthlyChatUsed = 0
        usage.quizUsed = 0
        usage.assignmentUsed = 0
        usage.pdfAnalysisUsed = 0
        usage.summaryUsed = 0
        usage.studyPlanUsed = 0
        usage.resetDate = next_month
        usage.updatedAt = now
        count += 1
    db.commit()
    return count
