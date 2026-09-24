"""add admin audit log table

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
Create Date: 2026-07-20

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.db.migration_helpers import table_exists

revision: str = "l2m3n4o5p6q7"
down_revision: Union[str, None] = "k1l2m3n4o5p6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if table_exists("AdminAuditLog"):
        return

    op.create_table(
        "AdminAuditLog",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("adminEmail", sa.String(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("targetType", sa.String(), nullable=True),
        sa.Column("targetId", sa.String(), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("ipAddress", sa.String(), nullable=True),
        sa.Column("userAgent", sa.String(), nullable=True),
        sa.Column("createdAt", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_AdminAuditLog_adminEmail", "AdminAuditLog", ["adminEmail"])
    op.create_index("ix_AdminAuditLog_createdAt", "AdminAuditLog", ["createdAt"])


def downgrade() -> None:
    if not table_exists("AdminAuditLog"):
        return
    op.drop_index("ix_AdminAuditLog_createdAt", table_name="AdminAuditLog")
    op.drop_index("ix_AdminAuditLog_adminEmail", table_name="AdminAuditLog")
    op.drop_table("AdminAuditLog")
