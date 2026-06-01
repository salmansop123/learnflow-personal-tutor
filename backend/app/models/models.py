from datetime import datetime, timezone
from typing import Optional


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import (
    EducationLevel,
    LearningStyle,
    MessageRole,
    Plan,
    Priority,
    ReminderType,
    StudyTime,
    UniversityLevel,
)


def cuid() -> str:
    import uuid

    return str(uuid.uuid4()).replace("-", "")[:25]


class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=cuid)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, unique=True)
    emailVerified: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    image: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    plan: Mapped[Plan] = mapped_column(Enum(Plan), default=Plan.FREE)
    language: Mapped[str] = mapped_column(String, default="en")
    educationLevel: Mapped[Optional[EducationLevel]] = mapped_column(
        Enum(EducationLevel), nullable=True
    )
    educationArchetype: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    educationTier: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    educationLevelLabel: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    educationTrack: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    educationArchetypeOverride: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    hashedPassword: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    onboardingComplete: Mapped[bool] = mapped_column(Boolean, default=False)
    fullName: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    gradeOrYear: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    universityLevel: Mapped[Optional[UniversityLevel]] = mapped_column(
        Enum(UniversityLevel), nullable=True
    )
    totalSubjects: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    subjectNames: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, server_default="{}"
    )
    weakSubjects: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, server_default="{}"
    )
    strongSubjects: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, server_default="{}"
    )
    dailyStudyHoursGoal: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    preferredStudyTime: Mapped[Optional[StudyTime]] = mapped_column(
        Enum(StudyTime), nullable=True
    )
    preferredStudyTimes: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, server_default="{}"
    )
    learningGoals: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    learningStyle: Mapped[Optional[LearningStyle]] = mapped_column(
        Enum(LearningStyle), nullable=True
    )
    learningStyles: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, server_default="{}"
    )
    examType: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    examPrepDetails: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    profileCompletedAt: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    createdAt: Mapped[datetime] = mapped_column(
        DateTime, default=_utcnow, server_default=func.now()
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime,
        default=_utcnow,
        server_default=func.now(),
        onupdate=_utcnow,
    )

    accounts: Mapped[list["Account"]] = relationship(back_populates="user")
    sessions: Mapped[list["Session"]] = relationship(back_populates="user")
    studySessions: Mapped[list["StudySession"]] = relationship(
        back_populates="user"
    )
    studyPlans: Mapped[list["StudyPlan"]] = relationship(back_populates="user")
    tasks: Mapped[list["Task"]] = relationship(back_populates="user")
    notes: Mapped[list["Note"]] = relationship(back_populates="user")
    conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="user"
    )
    quizAttempts: Mapped[list["QuizAttempt"]] = relationship(
        back_populates="user"
    )
    reminders: Mapped[list["Reminder"]] = relationship(back_populates="user")


class StudySession(Base):
    __tablename__ = "StudySession"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), index=True
    )
    subject: Mapped[str] = mapped_column(String)
    startedAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    endedAt: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    durationMins: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    subjects: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, server_default="{}"
    )
    subjectTimeLog: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timeLogCompleted: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    isDeleted: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false"
    )
    deletedAt: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    deleteReason: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship(back_populates="studySessions")


class StudyPlan(Base):
    __tablename__ = "StudyPlan"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String)
    subject: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    goalDate: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="studyPlans")
    tasks: Mapped[list["Task"]] = relationship(back_populates="plan")


class Task(Base):
    __tablename__ = "Task"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), index=True
    )
    planId: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("StudyPlan.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(String)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    dueDate: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    priority: Mapped[Priority] = mapped_column(Enum(Priority), default=Priority.MEDIUM)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="tasks")
    plan: Mapped[Optional["StudyPlan"]] = relationship(back_populates="tasks")


class Note(Base):
    __tablename__ = "Note"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(Text)
    subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    pinnedFrom: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    fileUrl: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    aiSummary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    aiSummaryGeneratedAt: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    createdAt: Mapped[datetime] = mapped_column(
        DateTime, default=_utcnow, server_default=func.now()
    )
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime,
        default=_utcnow,
        server_default=func.now(),
        onupdate=_utcnow,
    )

    user: Mapped["User"] = relationship(back_populates="notes")


class Conversation(Base):
    __tablename__ = "Conversation"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), index=True
    )
    subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    title: Mapped[str] = mapped_column(String, default="New Chat")
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Message(Base):
    __tablename__ = "Message"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=cuid)
    conversationId: Mapped[str] = mapped_column(
        String, ForeignKey("Conversation.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole))
    content: Mapped[str] = mapped_column(Text)
    pinnedToNote: Mapped[bool] = mapped_column(Boolean, default=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


class QuizAttempt(Base):
    __tablename__ = "QuizAttempt"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), index=True
    )
    subject: Mapped[str] = mapped_column(String)
    topic: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    difficulty: Mapped[str] = mapped_column(String, default="medium")
    totalQuestions: Mapped[int] = mapped_column(Integer)
    correctAnswers: Mapped[int] = mapped_column(Integer)
    score: Mapped[float] = mapped_column(Float)
    timeTaken: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    questionsJson: Mapped[str] = mapped_column(Text)
    isPartial: Mapped[bool] = mapped_column(Boolean, default=False)
    partialReason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sectionBreakdownJson: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="quizAttempts")


class Reminder(Base):
    __tablename__ = "Reminder"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String)
    body: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scheduledAt: Mapped[datetime] = mapped_column(DateTime)
    sent: Mapped[bool] = mapped_column(Boolean, default=False)
    type: Mapped[ReminderType] = mapped_column(
        Enum(ReminderType), default=ReminderType.STUDY
    )

    user: Mapped["User"] = relationship(back_populates="reminders")

    __table_args__ = (Index("ix_reminder_user_sent", "userId", "sent"),)


class Account(Base):
    __tablename__ = "Account"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=cuid)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE")
    )
    type: Mapped[str] = mapped_column(String)
    provider: Mapped[str] = mapped_column(String)
    providerAccountId: Mapped[str] = mapped_column(String)
    refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expires_at: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    token_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scope: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    id_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    session_state: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship(back_populates="accounts")

    __table_args__ = (
        UniqueConstraint("provider", "providerAccountId"),
    )


class Session(Base):
    __tablename__ = "Session"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=cuid)
    sessionToken: Mapped[str] = mapped_column(String, unique=True)
    userId: Mapped[str] = mapped_column(
        String, ForeignKey("User.id", ondelete="CASCADE")
    )
    expires: Mapped[datetime] = mapped_column(DateTime)

    user: Mapped["User"] = relationship(back_populates="sessions")


class VerificationToken(Base):
    __tablename__ = "VerificationToken"

    identifier: Mapped[str] = mapped_column(String, primary_key=True)
    token: Mapped[str] = mapped_column(String, primary_key=True)
    expires: Mapped[datetime] = mapped_column(DateTime)
