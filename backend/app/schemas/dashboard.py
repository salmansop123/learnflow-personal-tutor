from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DashboardStats(BaseModel):
    study_hours: float = Field(alias="studyHours")
    session_count: int = Field(alias="sessionCount")
    tasks_done: int = Field(alias="tasksDone")
    quiz_count: int = Field(alias="quizCount")
    notes_count: int = Field(alias="notesCount")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class ActivityPoint(BaseModel):
    date: str
    minutes: int

    model_config = ConfigDict(serialize_by_alias=True)


class RecentChatItem(BaseModel):
    id: str
    title: str
    subject: str | None = None
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class UpcomingReminderItem(BaseModel):
    id: str
    title: str
    body: str | None = None
    scheduled_at: datetime = Field(alias="scheduledAt")
    type: str

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class StudySessionItem(BaseModel):
    id: str
    subject: str
    started_at: datetime = Field(alias="startedAt")
    ended_at: datetime | None = Field(default=None, alias="endedAt")
    duration_mins: int | None = Field(default=None, alias="durationMins")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class TaskItem(BaseModel):
    id: str
    title: str
    completed: bool
    due_date: datetime | None = Field(default=None, alias="dueDate")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class QuizItem(BaseModel):
    id: str
    subject: str
    score: float
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class NotesCountResponse(BaseModel):
    count: int


class DashboardOverviewResponse(BaseModel):
    stats: DashboardStats
    activity: list[ActivityPoint]
    recent_chats: list[RecentChatItem] = Field(alias="recentChats")
    upcoming_reminders: list[UpcomingReminderItem] = Field(
        alias="upcomingReminders"
    )

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)
