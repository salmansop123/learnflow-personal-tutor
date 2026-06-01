from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DueReminderItem(BaseModel):
    id: str
    title: str
    body: str | None = None
    scheduled_at: datetime = Field(alias="scheduledAt")
    user_email: str = Field(alias="userEmail")
    user_name: str | None = Field(alias="userName")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class CronProcessResponse(BaseModel):
    processed: int
    failed: int
    total: int
