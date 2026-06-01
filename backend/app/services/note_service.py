from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.models import Conversation, Message, Note
from app.schemas.note import NoteCreate, NoteItem, NoteUpdate


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _note_item(note: Note) -> NoteItem:
    return NoteItem(
        id=note.id,
        title=note.title,
        content=note.content,
        subject=note.subject,
        tags=list(note.tags or []),
        pinnedFrom=note.pinnedFrom,
        fileUrl=note.fileUrl,
        aiSummary=note.aiSummary,
        aiSummaryGeneratedAt=note.aiSummaryGeneratedAt,
        createdAt=note.createdAt,
        updatedAt=note.updatedAt,
    )


def _verify_pinned_message(db: Session, user_id: str, message_id: str) -> None:
    row = db.scalar(
        select(Message)
        .join(Conversation, Conversation.id == Message.conversationId)
        .where(
            Message.id == message_id,
            Conversation.userId == user_id,
        )
    )
    if not row:
        raise ValueError("Pinned message not found")


def list_notes(
    db: Session,
    user_id: str,
    q: str | None = None,
    subject: str | None = None,
    tag: str | None = None,
) -> list[NoteItem]:
    stmt = select(Note).where(Note.userId == user_id)

    if subject:
        stmt = stmt.where(Note.subject == subject)
    if tag:
        stmt = stmt.where(Note.tags.contains([tag]))
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            or_(Note.title.ilike(pattern), Note.content.ilike(pattern))
        )

    rows = db.scalars(stmt.order_by(Note.updatedAt.desc())).all()
    return [_note_item(n) for n in rows]


def get_note(db: Session, user_id: str, note_id: str) -> NoteItem:
    note = db.scalar(
        select(Note).where(Note.id == note_id, Note.userId == user_id)
    )
    if not note:
        raise ValueError("Note not found")
    return _note_item(note)


def create_note(db: Session, user_id: str, body: NoteCreate) -> NoteItem:
    if body.pinned_from:
        _verify_pinned_message(db, user_id, body.pinned_from)
        message = db.scalar(select(Message).where(Message.id == body.pinned_from))
        if message:
            message.pinnedToNote = True

    note = Note(
        userId=user_id,
        title=body.title,
        content=body.content,
        subject=body.subject,
        tags=body.tags or [],
        pinnedFrom=body.pinned_from,
        fileUrl=body.file_url,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return _note_item(note)


def update_note(
    db: Session, user_id: str, note_id: str, body: NoteUpdate
) -> NoteItem:
    note = db.scalar(
        select(Note).where(Note.id == note_id, Note.userId == user_id)
    )
    if not note:
        raise ValueError("Note not found")

    if body.title is not None:
        note.title = body.title
    if body.content is not None:
        note.content = body.content
    if body.subject is not None:
        note.subject = body.subject
    if body.tags is not None:
        note.tags = body.tags
    if body.file_url is not None:
        note.fileUrl = body.file_url
    if body.pinned_from is not None:
        note.pinnedFrom = body.pinned_from
    if body.ai_summary is not None:
        note.aiSummary = body.ai_summary
    if body.ai_summary_generated_at is not None:
        note.aiSummaryGeneratedAt = body.ai_summary_generated_at

    note.updatedAt = _utcnow()
    db.commit()
    db.refresh(note)
    return _note_item(note)


def delete_note(db: Session, user_id: str, note_id: str) -> None:
    note = db.scalar(
        select(Note).where(Note.id == note_id, Note.userId == user_id)
    )
    if not note:
        raise ValueError("Note not found")
    db.delete(note)
    db.commit()
