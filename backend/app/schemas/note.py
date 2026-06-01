from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NoteItem(BaseModel):
    id: str
    title: str
    content: str
    subject: str | None = None
    tags: list[str] = []
    pinned_from: str | None = Field(default=None, alias="pinnedFrom")
    file_url: str | None = Field(default=None, alias="fileUrl")
    ai_summary: str | None = Field(default=None, alias="aiSummary")
    ai_summary_generated_at: datetime | None = Field(
        default=None, alias="aiSummaryGeneratedAt"
    )
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(default="")
    subject: str | None = None
    tags: list[str] = []
    pinned_from: str | None = Field(default=None, alias="pinnedFrom")
    file_url: str | None = Field(default=None, alias="fileUrl")

    model_config = ConfigDict(populate_by_name=True)


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, min_length=1)
    subject: str | None = None
    tags: list[str] | None = None
    pinned_from: str | None = Field(default=None, alias="pinnedFrom")
    file_url: str | None = Field(default=None, alias="fileUrl")
    ai_summary: str | None = Field(default=None, alias="aiSummary")
    ai_summary_generated_at: datetime | None = Field(
        default=None, alias="aiSummaryGeneratedAt"
    )

    model_config = ConfigDict(populate_by_name=True)


class NoteListQuery(BaseModel):
    q: str | None = None
    subject: str | None = None
    tag: str | None = None
