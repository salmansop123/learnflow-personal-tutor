from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import (
    sqlalchemy_exception_handler,
    validation_exception_handler,
)

settings = get_settings()

app = FastAPI(
    title="LearnFlow API",
    description="Python FastAPI backend for LearnFlow",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "LearnFlow API",
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
    }
