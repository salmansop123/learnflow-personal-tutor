from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(ROOT_DIR / ".env.local", ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = (
        "postgresql://postgres:postgres@localhost:5434/learnflow"
    )
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000"

    auth_secret: str = "change-me"
    auth_url: str = "http://localhost:3000"
    frontend_url: str = "http://localhost:3000"
    auth_google_id: str = ""
    auth_google_secret: str = ""
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    resend_api_key: str = ""
    email_from: str = "LearnFlow <onboarding@resend.dev>"
    cron_secret: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
