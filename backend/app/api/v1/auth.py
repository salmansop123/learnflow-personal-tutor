from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import DbSession
from app.schemas.auth import (
    AuthSessionResponse,
    GoogleOAuthRequest,
    LoginRequest,
    MagicLinkRequest,
    MagicLinkVerifyRequest,
    MessageResponse,
    RegisterRequest,
    SessionValidateRequest,
    UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthSessionResponse)
def register(body: RegisterRequest, db: DbSession) -> AuthSessionResponse:
    try:
        return auth_service.register_user(
            db, body.name, body.email, body.password
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/login", response_model=AuthSessionResponse)
def login(body: LoginRequest, db: DbSession) -> AuthSessionResponse:
    try:
        return auth_service.login_with_password(db, body.email, body.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc


@router.post("/magic-link", response_model=MessageResponse)
def request_magic_link(body: MagicLinkRequest, db: DbSession) -> MessageResponse:
    auth_service.request_magic_link(db, body.email)
    return MessageResponse(
        message="If an account exists for this email, a sign-in link has been sent."
    )


@router.post("/magic-link/verify", response_model=AuthSessionResponse)
def verify_magic_link(
    body: MagicLinkVerifyRequest, db: DbSession
) -> AuthSessionResponse:
    try:
        return auth_service.verify_magic_link(db, body.email, body.token)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/session/validate", response_model=UserResponse)
def validate_session(
    body: SessionValidateRequest, db: DbSession
) -> UserResponse:
    user = auth_service.validate_session_token(db, body.session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user


@router.post("/oauth/google", response_model=UserResponse)
def google_oauth_sync(body: GoogleOAuthRequest, db: DbSession) -> UserResponse:
    return auth_service.sync_google_user(db, body)
