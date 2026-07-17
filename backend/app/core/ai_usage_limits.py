"""Central plan limits for AI feature usage (feature-based, not tokens)."""

from __future__ import annotations

from typing import Literal

from app.models.enums import Plan

AiFeature = Literal[
    "chat",
    "quiz",
    "assignment",
    "pdf_analysis",
    "summary",
    "study_plan",
]

# None = unlimited (fair-usage; still tracked for monitoring)
PlanLimits = dict[str, int | None]

PLAN_LIMITS: dict[str, PlanLimits] = {
    Plan.FREE.value: {
        "daily_chat": 25,
        "monthly_chat": 600,
        "quiz": 10,
        "assignment": 5,
        "pdf_analysis": 3,
        "summary": 10,
        "study_plan": 2,
    },
    Plan.PRO.value: {
        "daily_chat": None,
        "monthly_chat": None,
        "quiz": None,
        "assignment": None,
        "pdf_analysis": None,
        "summary": None,
        "study_plan": None,
    },
    Plan.PREMIUM_PLUS.value: {
        "daily_chat": None,
        "monthly_chat": None,
        "quiz": None,
        "assignment": None,
        "pdf_analysis": None,
        "summary": None,
        "study_plan": None,
    },
    Plan.ENTERPRISE.value: {
        "daily_chat": None,
        "monthly_chat": None,
        "quiz": None,
        "assignment": None,
        "pdf_analysis": None,
        "summary": None,
        "study_plan": None,
    },
}

FEATURE_LABELS: dict[AiFeature, str] = {
    "chat": "AI Chat",
    "quiz": "Quiz Generation",
    "assignment": "Assignment Generation",
    "pdf_analysis": "PDF Analysis",
    "summary": "AI Note Summary",
    "study_plan": "Study Plan Generation",
}

FEATURE_TO_LIMIT_KEY: dict[AiFeature, str] = {
    "chat": "monthly_chat",  # chat also checks daily separately
    "quiz": "quiz",
    "assignment": "assignment",
    "pdf_analysis": "pdf_analysis",
    "summary": "summary",
    "study_plan": "study_plan",
}


def get_plan_limits(plan: str | Plan) -> PlanLimits:
    key = plan.value if isinstance(plan, Plan) else str(plan).upper()
    return PLAN_LIMITS.get(key, PLAN_LIMITS[Plan.FREE.value])


def is_unlimited(limit: int | None) -> bool:
    return limit is None
