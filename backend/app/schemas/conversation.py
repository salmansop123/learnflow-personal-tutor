from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ConversationCreate(BaseModel):
    title: str = "New Chat"
    subject: str | None = None


class ConversationUpdate(BaseModel):
    title: str | None = None
    subject: str | None = None


class ConversationItem(BaseModel):
    id: str
    title: str
    subject: str | None = None
    created_at: datetime = Field(alias="createdAt")
    message_count: int = Field(0, alias="messageCount")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class MessageItem(BaseModel):
    id: str
    conversation_id: str = Field(alias="conversationId")
    role: str
    content: str
    pinned_to_note: bool = Field(alias="pinnedToNote")
    created_at: datetime = Field(alias="createdAt")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class ConversationDetail(ConversationItem):
    messages: list[MessageItem]


class MessageCreate(BaseModel):
    role: str
    content: str


class AppendMessagesRequest(BaseModel):
    messages: list[MessageCreate]
