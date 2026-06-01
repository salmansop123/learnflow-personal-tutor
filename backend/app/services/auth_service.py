import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.email_service import send_magic_link_email, send_welcome_email
from app.core.config import get_settings
from app.core.security import hash_password, verify_password
from app.models.enums import Plan
from app.models.models import Account, Session as DbSession, User, VerificationToken, cuid
from app.schemas.auth import (
    AuthSessionResponse,
    GoogleOAuthRequest,
    UserResponse,
)

SESSION_MAX_AGE_DAYS = 30
MAGIC_LINK_EXPIRE_HOURS = 1


def _user_to_response(user: User) -> UserResponse:
    edu = user.educationLevel
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        image=user.image,
        plan=user.plan.value if hasattr(user.plan, "value") else str(user.plan),
        language=user.language,
        education_level=edu,
        onboarding_complete=user.onboardingComplete,
    )


def _create_session(db: Session, user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=SESSION_MAX_AGE_DAYS)
    db.add(
        DbSession(
            id=cuid(),
            sessionToken=token,
            userId=user_id,
            expires=expires,
        )
    )
    db.commit()
    return token


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def register_user(db: Session, name: str, email: str, password: str) -> AuthSessionResponse:
    email_lower = email.lower()
    existing = get_user_by_email(db, email_lower)
    if existing:
        if existing.hashedPassword:
            raise ValueError("An account with this email already exists")
        existing.name = name or existing.name
        existing.hashedPassword = hash_password(password)
        existing.emailVerified = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        session_token = _create_session(db, existing.id)
        return AuthSessionResponse(
            user=_user_to_response(existing),
            sessionToken=session_token,
        )

    user = User(
        id=cuid(),
        name=name,
        email=email_lower,
        hashedPassword=hash_password(password),
        plan=Plan.FREE,
        emailVerified=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    try:
        send_welcome_email(user.email, user.name)
    except Exception:
        pass  # registration succeeds even if email fails
    session_token = _create_session(db, user.id)
    return AuthSessionResponse(
        user=_user_to_response(user),
        sessionToken=session_token,
    )


def login_with_password(db: Session, email: str, password: str) -> AuthSessionResponse:
    email_lower = email.lower()
    user = get_user_by_email(db, email_lower)
    if not user or not user.hashedPassword:
        raise ValueError("Invalid email or password")
    if not verify_password(password, user.hashedPassword):
        raise ValueError("Invalid email or password")

    session_token = _create_session(db, user.id)
    return AuthSessionResponse(
        user=_user_to_response(user),
        sessionToken=session_token,
    )


def request_magic_link(db: Session, email: str) -> None:
    settings = get_settings()
    email_lower = email.lower()
    user = get_user_by_email(db, email_lower)
    if not user:
        user = User(id=cuid(), email=email_lower, plan=Plan.FREE)
        db.add(user)
        db.commit()
        db.refresh(user)

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=MAGIC_LINK_EXPIRE_HOURS)

    # Remove old tokens for this email
    for row in db.scalars(
        select(VerificationToken).where(VerificationToken.identifier == email_lower)
    ).all():
        db.delete(row)

    db.add(
        VerificationToken(
            identifier=email_lower,
            token=token,
            expires=expires,
        )
    )
    db.commit()

    magic_link = (
        f"{settings.frontend_url}/login/verify"
        f"?email={email_lower}&token={token}"
    )
    send_magic_link_email(email_lower, magic_link)


def verify_magic_link(db: Session, email: str, token: str) -> AuthSessionResponse:
    email_lower = email.lower()
    row = db.get(VerificationToken, (email_lower, token))
    if not row:
        raise ValueError("Invalid or expired sign-in link")

    now = datetime.now(timezone.utc)
    expires = row.expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        db.delete(row)
        db.commit()
        raise ValueError("Sign-in link has expired")

    user = get_user_by_email(db, email_lower)
    if not user:
        raise ValueError("User not found")

    user.emailVerified = now
    db.delete(row)
    db.commit()
    db.refresh(user)

    session_token = _create_session(db, user.id)
    return AuthSessionResponse(
        user=_user_to_response(user),
        sessionToken=session_token,
    )


def validate_session_token(db: Session, session_token: str) -> UserResponse | None:
    row = db.scalar(
        select(DbSession).where(DbSession.sessionToken == session_token)
    )
    if not row:
        return None

    now = datetime.now(timezone.utc)
    expires = row.expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        db.delete(row)
        db.commit()
        return None

    user = db.get(User, row.userId)
    if not user:
        return None

    return _user_to_response(user)


def sync_google_user(db: Session, data: GoogleOAuthRequest) -> UserResponse:
    email_lower = data.email.lower()
    user = get_user_by_email(db, email_lower)
    is_new = user is None

    if not user:
        user = User(
            id=cuid(),
            email=email_lower,
            name=data.name,
            image=data.image,
            plan=Plan.FREE,
            emailVerified=datetime.now(timezone.utc),
        )
        db.add(user)
        db.flush()
    else:
        user.name = data.name or user.name
        user.image = data.image or user.image
        user.emailVerified = user.emailVerified or datetime.now(timezone.utc)

    account = db.scalar(
        select(Account).where(
            Account.provider == data.provider,
            Account.providerAccountId == data.provider_account_id,
        )
    )
    if not account:
        db.add(
            Account(
                id=cuid(),
                userId=user.id,
                type="oauth",
                provider=data.provider,
                providerAccountId=data.provider_account_id,
            )
        )

    db.commit()
    db.refresh(user)

    if is_new:
        send_welcome_email(user.email, user.name)

    return _user_to_response(user)
