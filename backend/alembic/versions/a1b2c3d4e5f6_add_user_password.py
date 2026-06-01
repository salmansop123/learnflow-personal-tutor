"""add user password

Revision ID: a1b2c3d4e5f6
Revises: ff74b0f69d0e
Create Date: 2026-05-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "ff74b0f69d0e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("User", sa.Column("hashedPassword", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("User", "hashedPassword")
