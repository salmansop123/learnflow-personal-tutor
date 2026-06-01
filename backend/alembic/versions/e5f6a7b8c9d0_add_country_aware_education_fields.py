"""add country-aware education fields

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c0
Create Date: 2026-05-22

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "User",
        sa.Column("educationArchetype", sa.String(), nullable=True),
    )
    op.add_column(
        "User",
        sa.Column("educationTier", sa.String(), nullable=True),
    )
    op.add_column(
        "User",
        sa.Column("educationLevelLabel", sa.String(), nullable=True),
    )
    op.add_column(
        "User",
        sa.Column("educationTrack", sa.String(), nullable=True),
    )
    op.add_column(
        "User",
        sa.Column(
            "educationArchetypeOverride",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("User", "educationArchetypeOverride")
    op.drop_column("User", "educationTrack")
    op.drop_column("User", "educationLevelLabel")
    op.drop_column("User", "educationTier")
    op.drop_column("User", "educationArchetype")
