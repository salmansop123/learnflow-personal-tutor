"""Shared helpers for idempotent Alembic migrations."""

from alembic import op
import sqlalchemy as sa


def table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    return table_name in sa.inspect(bind).get_table_names()


def column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    return column_name in {col["name"] for col in inspector.get_columns(table_name)}


def enum_type_exists(type_name: str) -> bool:
    bind = op.get_bind()
    result = bind.execute(
        sa.text("SELECT 1 FROM pg_type WHERE typname = :type_name LIMIT 1"),
        {"type_name": type_name},
    ).scalar()
    return result is not None
