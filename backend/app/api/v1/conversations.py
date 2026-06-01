from fastapi import APIRouter, HTTPException

from app.api.deps import DashboardUserId, DbSession
from app.schemas.conversation import (
    AppendMessagesRequest,
    ConversationCreate,
    ConversationDetail,
    ConversationItem,
    ConversationUpdate,
    MessageItem,
)
from app.services import conversation_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationItem])
def list_conversations(
    db: DbSession,
    user_id: DashboardUserId,
) -> list[ConversationItem]:
    return conversation_service.list_conversations(db, user_id)


@router.post("", response_model=ConversationItem)
def create_conversation(
    body: ConversationCreate,
    db: DbSession,
    user_id: DashboardUserId,
) -> ConversationItem:
    return conversation_service.create_conversation(db, user_id, body)


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: str,
    db: DbSession,
    user_id: DashboardUserId,
) -> ConversationDetail:
    try:
        return conversation_service.get_conversation_detail(
            db, user_id, conversation_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{conversation_id}", response_model=ConversationItem)
def update_conversation(
    conversation_id: str,
    body: ConversationUpdate,
    db: DbSession,
    user_id: DashboardUserId,
) -> ConversationItem:
    try:
        return conversation_service.update_conversation(
            db, user_id, conversation_id, body
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post(
    "/{conversation_id}/messages",
    response_model=list[MessageItem],
)
def append_messages(
    conversation_id: str,
    body: AppendMessagesRequest,
    db: DbSession,
    user_id: DashboardUserId,
) -> list[MessageItem]:
    try:
        return conversation_service.append_messages(
            db, user_id, conversation_id, body
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    db: DbSession,
    user_id: DashboardUserId,
) -> dict[str, bool]:
    try:
        conversation_service.delete_conversation(db, user_id, conversation_id)
        return {"ok": True}
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
