"""add note ai summary fields

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-05-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.db.migration_helpers import column_exists

revision: str = "i9j0k1l2m3n4"
down_revision: Union[str, None] = "h8i9j0k1l2m3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not column_exists("Note", "aiSummary"):
        op.add_column("Note", sa.Column("aiSummary", sa.Text(), nullable=True))
    if not column_exists("Note", "aiSummaryGeneratedAt"):
        op.add_column(
            "Note", sa.Column("aiSummaryGeneratedAt", sa.DateTime(), nullable=True)
        )


def downgrade() -> None:
    op.drop_column("Note", "aiSummaryGeneratedAt")
    op.drop_column("Note", "aiSummary")
