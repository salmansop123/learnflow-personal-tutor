"""add quiz attempt partial and section breakdown fields

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-05-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "h8i9j0k1l2m3"
down_revision: Union[str, None] = "g7h8i9j0k1l2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "QuizAttempt",
        sa.Column("isPartial", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "QuizAttempt",
        sa.Column("partialReason", sa.String(), nullable=True),
    )
    op.add_column(
        "QuizAttempt",
        sa.Column("sectionBreakdownJson", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("QuizAttempt", "sectionBreakdownJson")
    op.drop_column("QuizAttempt", "partialReason")
    op.drop_column("QuizAttempt", "isPartial")
