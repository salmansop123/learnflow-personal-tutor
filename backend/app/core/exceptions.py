from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError


async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation failed", "errors": exc.errors()},
    )


async def http_exception_handler(
    _request: Request, exc: HTTPException
) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, str):
        content: dict[str, object] = {"detail": detail}
    else:
        content = {"detail": detail}
    return JSONResponse(status_code=exc.status_code, content=content)


async def sqlalchemy_exception_handler(
    _request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    _ = exc
    return JSONResponse(
        status_code=500,
        content={"detail": "A database error occurred. Please try again."},
    )


async def unhandled_exception_handler(
    _request: Request, exc: Exception
) -> JSONResponse:
    if isinstance(exc, HTTPException):
        raise exc
    _ = exc
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred."},
    )
