from fastapi import APIRouter, HTTPException, Request

from app.api.deps import DbSession, DashboardUserId
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


def _client_meta(request: Request) -> tuple[str, str]:
    forwarded = request.headers.get("x-forwarded-for")
    ip = (
        forwarded.split(",")[0].strip()
        if forwarded
        else request.headers.get("x-real-ip")
        or (request.client.host if request.client else "unknown")
    )
    ua = request.headers.get("user-agent") or "unknown"
    return ip, ua


@router.post("/register", response_model=AuthSessionResponse)
def register(
    body: RegisterRequest, request: Request, db: DbSession
) -> AuthSessionResponse:
    ip, ua = _client_meta(request)
    try:
        return auth_service.register_user(
            db,
            body.name,
            body.email,
            body.password,
            ip_address=ip,
            user_agent=ua,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/login", response_model=AuthSessionResponse)
def login(body: LoginRequest, request: Request, db: DbSession) -> AuthSessionResponse:
    ip, ua = _client_meta(request)
    try:
        return auth_service.login_with_password(
            db,
            body.email,
            body.password,
            ip_address=ip,
            user_agent=ua,
        )
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
    body: MagicLinkVerifyRequest, request: Request, db: DbSession
) -> AuthSessionResponse:
    ip, ua = _client_meta(request)
    try:
        return auth_service.verify_magic_link(
            db,
            body.email,
            body.token,
            ip_address=ip,
            user_agent=ua,
        )
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
def google_oauth_sync(
    body: GoogleOAuthRequest, request: Request, db: DbSession
) -> UserResponse:
    ip, ua = _client_meta(request)
    return auth_service.sync_google_user(
        db, body, ip_address=ip, user_agent=ua
    )


@router.post("/logout")
def logout(
    request: Request,
    db: DbSession,
    user_id: DashboardUserId,
) -> MessageResponse:
    """Record USER_LOGOUT in the audit log (called from Next.js before signOut)."""
    ip, ua = _client_meta(request)
    auth_service.log_user_logout(
        db, user_id, ip_address=ip, user_agent=ua
    )
    return MessageResponse(message="Logged out")
