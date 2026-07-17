from fastapi import APIRouter

from app.api.v1 import (
    ai,
    ai_usage,
    auth,
    conversations,
    cron,
    dashboard,
    health,
    notes,
    profile,
    quiz,
    reminders,
    study,
    users,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(profile.router)
api_router.include_router(conversations.router)
api_router.include_router(dashboard.router)
api_router.include_router(notes.router)
api_router.include_router(study.router)
api_router.include_router(quiz.router)
api_router.include_router(ai.router)
api_router.include_router(ai_usage.router)
api_router.include_router(reminders.router)
api_router.include_router(cron.router)
