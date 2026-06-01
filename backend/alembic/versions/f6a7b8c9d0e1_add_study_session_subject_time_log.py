"""add study session subject time tracking fields

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-05-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "StudySession",
        sa.Column(
            "subjects",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "StudySession",
        sa.Column("subjectTimeLog", sa.Text(), nullable=True),
    )
    op.add_column(
        "StudySession",
        sa.Column(
            "timeLogCompleted",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )


def downgrade() -> None:
    op.drop_column("StudySession", "timeLogCompleted")
    op.drop_column("StudySession", "subjectTimeLog")
    op.drop_column("StudySession", "subjects")
