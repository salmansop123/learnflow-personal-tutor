from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuizAttemptCreate(BaseModel):
    subject: str
    topic: str | None = None
    difficulty: str = "medium"
    total_questions: int = Field(alias="totalQuestions", ge=1)
    correct_answers: int = Field(alias="correctAnswers", ge=0)
    score: float = Field(ge=0, le=100)
    time_taken: int | None = Field(default=None, alias="timeTaken")
    questions_json: str = Field(alias="questionsJson")
    is_partial: bool = Field(default=False, alias="isPartial")
    partial_reason: str | None = Field(default=None, alias="partialReason")
    section_breakdown_json: str | None = Field(
        default=None, alias="sectionBreakdownJson"
    )

    model_config = ConfigDict(populate_by_name=True)


class QuizAttemptItem(BaseModel):
    id: str
    subject: str
    topic: str | None = None
    difficulty: str
    total_questions: int = Field(alias="totalQuestions")
    correct_answers: int = Field(alias="correctAnswers")
    score: float
    time_taken: int | None = Field(default=None, alias="timeTaken")
    is_partial: bool = Field(default=False, alias="isPartial")
    partial_reason: str | None = Field(default=None, alias="partialReason")
    section_breakdown_json: str | None = Field(
        default=None, alias="sectionBreakdownJson"
    )
    created_at: datetime = Field(alias="createdAt")
    questions_json: str | None = Field(default=None, alias="questionsJson")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)
