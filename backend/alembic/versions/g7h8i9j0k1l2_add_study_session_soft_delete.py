"""add study session soft delete fields

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2026-05-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "g7h8i9j0k1l2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "StudySession",
        sa.Column("isDeleted", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "StudySession",
        sa.Column("deletedAt", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "StudySession",
        sa.Column("deleteReason", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("StudySession", "deleteReason")
    op.drop_column("StudySession", "deletedAt")
    op.drop_column("StudySession", "isDeleted")
