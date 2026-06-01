from datetime import datetime
from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field


class StudySessionItem(BaseModel):
    id: str
    subject: str
    started_at: datetime = Field(alias="startedAt")
    ended_at: datetime | None = Field(default=None, alias="endedAt")
    duration_mins: int | None = Field(default=None, alias="durationMins")
    notes: str | None = None
    subjects: list[str] = Field(default_factory=list)
    subject_time_log: dict[str, int] | None = Field(
        default=None, alias="subjectTimeLog"
    )
    time_log_completed: bool = Field(default=False, alias="timeLogCompleted")
    is_deleted: bool = Field(default=False, alias="isDeleted")
    deleted_at: datetime | None = Field(default=None, alias="deletedAt")
    delete_reason: str | None = Field(default=None, alias="deleteReason")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class StudySessionCreate(BaseModel):
    subjects: list[str] = Field(min_length=1, max_length=20)
    notes: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class StudySessionEnd(BaseModel):
    action: Literal["end"] = "end"
    duration_mins: int = Field(alias="durationMins", ge=1)
    ended_at: datetime | None = Field(default=None, alias="endedAt")
    notes: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class StudySessionLogTime(BaseModel):
    action: Literal["logTime"] = "logTime"
    subject_time_log: dict[str, int] = Field(alias="subjectTimeLog")

    model_config = ConfigDict(populate_by_name=True)


class StudySessionRestore(BaseModel):
    action: Literal["restore"] = "restore"

    model_config = ConfigDict(populate_by_name=True)


StudySessionPatch = Annotated[
    Union[StudySessionEnd, StudySessionLogTime, StudySessionRestore],
    Field(discriminator="action"),
]


class SubjectMergeRequest(BaseModel):
    from_subjects: list[str] = Field(
        min_length=1, max_length=20, alias="from"
    )
    into: str = Field(min_length=1, max_length=120)

    model_config = ConfigDict(populate_by_name=True)


class SubjectMergeResponse(BaseModel):
    sessions_updated: int = Field(alias="sessionsUpdated")
    message: str

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class SubjectTotalStatsItem(BaseModel):
    subject: str
    total_minutes: int = Field(alias="totalMinutes")
    percentage: float
    color: str

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class SessionTimeLogPayload(BaseModel):
    session_id: str = Field(alias="sessionId")
    subject_time_log: dict[str, int] = Field(alias="subjectTimeLog")

    model_config = ConfigDict(populate_by_name=True)


class StudyPlanItem(BaseModel):
    id: str
    title: str
    subject: str
    description: str | None = None
    goal_date: datetime | None = Field(default=None, alias="goalDate")
    is_active: bool = Field(alias="isActive")
    created_at: datetime = Field(alias="createdAt")
    task_count: int = Field(0, alias="taskCount")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class StudyPlanCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    subject: str = Field(min_length=1, max_length=120)
    description: str | None = None
    goal_date: datetime | None = Field(default=None, alias="goalDate")

    model_config = ConfigDict(populate_by_name=True)


class StudyPlanUpdate(BaseModel):
    title: str | None = None
    subject: str | None = None
    description: str | None = None
    goal_date: datetime | None = Field(default=None, alias="goalDate")
    is_active: bool | None = Field(default=None, alias="isActive")

    model_config = ConfigDict(populate_by_name=True)


class TaskItem(BaseModel):
    id: str
    plan_id: str | None = Field(default=None, alias="planId")
    title: str
    completed: bool
    due_date: datetime | None = Field(default=None, alias="dueDate")
    priority: str
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    plan_id: str | None = Field(default=None, alias="planId")
    due_date: datetime | None = Field(default=None, alias="dueDate")
    priority: str = "MEDIUM"

    model_config = ConfigDict(populate_by_name=True)


class TaskUpdate(BaseModel):
    title: str | None = None
    completed: bool | None = None
    due_date: datetime | None = Field(default=None, alias="dueDate")
    priority: str | None = None
    plan_id: str | None = Field(default=None, alias="planId")

    model_config = ConfigDict(populate_by_name=True)


class ReminderItem(BaseModel):
    id: str
    title: str
    body: str | None = None
    scheduled_at: datetime = Field(alias="scheduledAt")
    sent: bool
    type: str

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class ReminderCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str | None = None
    scheduled_at: datetime = Field(alias="scheduledAt")
    type: str = "STUDY"

    model_config = ConfigDict(populate_by_name=True)
