from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AiUsageFeatureStatus(BaseModel):
    feature: str
    label: str
    used: int
    limit: int | None = None
    remaining: int | None = None
    unlimited: bool = False
    percent: float = 0
    period: str = "month"  # "day" | "month"


class AiUsageOverview(BaseModel):
    subscription_plan: str = Field(alias="subscriptionPlan")
    daily_chat_used: int = Field(alias="dailyChatUsed")
    monthly_chat_used: int = Field(alias="monthlyChatUsed")
    quiz_used: int = Field(alias="quizUsed")
    assignment_used: int = Field(alias="assignmentUsed")
    pdf_analysis_used: int = Field(alias="pdfAnalysisUsed")
    summary_used: int = Field(alias="summaryUsed")
    study_plan_used: int = Field(alias="studyPlanUsed")
    reset_date: datetime | None = Field(None, alias="resetDate")
    daily_reset_at: datetime | None = Field(None, alias="dailyResetAt")
    features: list[AiUsageFeatureStatus]
    warning_level: str | None = Field(
        None, alias="warningLevel"
    )  # "warn75" | "warn90" | "exhausted" | None

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class AiUsageConsumeRequest(BaseModel):
    feature: str
    tokens: int = Field(default=0, ge=0)


class AiUsageConsumeResponse(BaseModel):
    success: bool
    message: str
    overview: AiUsageOverview | None = None

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class AiUsageCheckResponse(BaseModel):
    allowed: bool
    message: str
    overview: AiUsageOverview

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)
