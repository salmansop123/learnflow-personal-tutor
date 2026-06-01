from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.models.enums import MessageRole
from app.models.models import Conversation, Message, Note
from app.schemas.conversation import (
    AppendMessagesRequest,
    ConversationCreate,
    ConversationDetail,
    ConversationItem,
    ConversationUpdate,
    MessageItem,
)


def _message_item(message: Message) -> MessageItem:
    role = message.role.value if hasattr(message.role, "value") else str(message.role)
    return MessageItem(
        id=message.id,
        conversationId=message.conversationId,
        role=role,
        content=message.content,
        pinnedToNote=message.pinnedToNote,
        createdAt=message.createdAt,
    )


def get_conversation_or_404(
    db: Session, user_id: str, conversation_id: str
) -> Conversation:
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.userId == user_id,
        )
    )
    if not conversation:
        raise ValueError("Conversation not found")
    return conversation


def list_conversations(db: Session, user_id: str) -> list[ConversationItem]:
    rows = db.execute(
        select(
            Conversation,
            func.count(Message.id).label("message_count"),
        )
        .outerjoin(Message, Message.conversationId == Conversation.id)
        .where(Conversation.userId == user_id)
        .group_by(Conversation.id)
        .order_by(Conversation.createdAt.desc())
    ).all()

    return [
        ConversationItem(
            id=conversation.id,
            title=conversation.title,
            subject=conversation.subject,
            createdAt=conversation.createdAt,
            messageCount=message_count or 0,
        )
        for conversation, message_count in rows
    ]


def create_conversation(
    db: Session, user_id: str, body: ConversationCreate
) -> ConversationItem:
    conversation = Conversation(
        userId=user_id,
        title=body.title,
        subject=body.subject,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return ConversationItem(
        id=conversation.id,
        title=conversation.title,
        subject=conversation.subject,
        createdAt=conversation.createdAt,
        messageCount=0,
    )


def get_conversation_detail(
    db: Session, user_id: str, conversation_id: str
) -> ConversationDetail:
    conversation = get_conversation_or_404(db, user_id, conversation_id)
    messages = db.scalars(
        select(Message)
        .where(Message.conversationId == conversation_id)
        .order_by(Message.createdAt.asc())
    ).all()
    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        subject=conversation.subject,
        createdAt=conversation.createdAt,
        messageCount=len(messages),
        messages=[_message_item(m) for m in messages],
    )


def update_conversation(
    db: Session,
    user_id: str,
    conversation_id: str,
    body: ConversationUpdate,
) -> ConversationItem:
    conversation = get_conversation_or_404(db, user_id, conversation_id)
    if body.title is not None:
        conversation.title = body.title
    if body.subject is not None:
        conversation.subject = body.subject
    db.commit()
    db.refresh(conversation)
    count = db.scalar(
        select(func.count())
        .select_from(Message)
        .where(Message.conversationId == conversation_id)
    ) or 0
    return ConversationItem(
        id=conversation.id,
        title=conversation.title,
        subject=conversation.subject,
        createdAt=conversation.createdAt,
        messageCount=count,
    )


def append_messages(
    db: Session,
    user_id: str,
    conversation_id: str,
    body: AppendMessagesRequest,
) -> list[MessageItem]:
    conversation = get_conversation_or_404(db, user_id, conversation_id)
    created: list[Message] = []
    for item in body.messages:
        role = MessageRole(item.role)
        message = Message(
            conversationId=conversation.id,
            role=role,
            content=item.content,
        )
        db.add(message)
        created.append(message)

    if body.messages and conversation.title == "New Chat":
        first = body.messages[0].content.strip()
        if first:
            conversation.title = first[:60] + ("…" if len(first) > 60 else "")

    db.commit()
    for message in created:
        db.refresh(message)
    return [_message_item(m) for m in created]


def delete_conversation(
    db: Session, user_id: str, conversation_id: str
) -> None:
    conversation = get_conversation_or_404(db, user_id, conversation_id)

    message_ids = list(
        db.scalars(
            select(Message.id).where(Message.conversationId == conversation_id)
        ).all()
    )

    if message_ids:
        db.execute(
            update(Note)
            .where(
                Note.userId == user_id,
                Note.pinnedFrom.in_(message_ids),
            )
            .values(pinnedFrom=None)
        )
        db.execute(
            delete(Message).where(Message.conversationId == conversation_id)
        )

    db.delete(conversation)
    db.commit()
