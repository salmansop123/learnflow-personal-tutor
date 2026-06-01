import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html: str) -> bool:
    settings = get_settings()
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not set — skipping email to %s", to)
        return False

    response = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": settings.email_from,
            "to": [to],
            "subject": subject,
            "html": html,
        },
        timeout=15.0,
    )
    response.raise_for_status()
    return True


def send_magic_link_email(to: str, magic_link: str) -> bool:
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Sign in to LearnFlow</h2>
      <p>Click the button below to sign in. This link expires in 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="{magic_link}"
           style="background: #111; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 8px; display: inline-block;">
          Sign in to LearnFlow
        </a>
      </p>
      <p style="color: #666; font-size: 12px;">
        If you did not request this email, you can ignore it.
      </p>
    </div>
    """
    return send_email(to, "Your LearnFlow sign-in link", html)


def send_welcome_email(to: str, name: str | None) -> bool:
    display = name or "there"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2>Welcome to LearnFlow, {display}!</h2>
      <p>Your account is ready. Start studying with your AI tutor, notes, and quizzes.</p>
      <p style="margin: 24px 0;">
        <a href="{get_settings().frontend_url}/dashboard"
           style="background: #111; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 8px; display: inline-block;">
          Go to Dashboard
        </a>
      </p>
    </div>
    """
    return send_email(to, "Welcome to LearnFlow", html)
