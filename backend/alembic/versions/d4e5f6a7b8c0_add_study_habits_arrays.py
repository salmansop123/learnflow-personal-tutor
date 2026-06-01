"""add learningStyles and preferredStudyTimes arrays

Revision ID: d4e5f6a7b8c0
Revises: c3d4e5f6a7b8
Create Date: 2026-05-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d4e5f6a7b8c0"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "User",
        sa.Column(
            "learningStyles",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "User",
        sa.Column(
            "preferredStudyTimes",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.execute(
        """
        UPDATE "User"
        SET "learningStyles" = ARRAY["learningStyle"::text]
        WHERE "learningStyle" IS NOT NULL
        """
    )
    op.execute(
        """
        UPDATE "User"
        SET "preferredStudyTimes" = ARRAY["preferredStudyTime"::text]
        WHERE "preferredStudyTime" IS NOT NULL
        """
    )


def downgrade() -> None:
    op.drop_column("User", "preferredStudyTimes")
    op.drop_column("User", "learningStyles")
