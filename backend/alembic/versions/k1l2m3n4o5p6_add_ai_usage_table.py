"""add ai usage table

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
Create Date: 2026-07-17

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.db.migration_helpers import table_exists

revision: str = "k1l2m3n4o5p6"
down_revision: Union[str, None] = "j0k1l2m3n4o5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if table_exists("AIUsage"):
        return

    op.create_table(
        "AIUsage",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("userId", sa.String(), nullable=False),
        sa.Column("subscriptionPlan", sa.String(), nullable=False, server_default="FREE"),
        sa.Column("dailyChatUsed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("monthlyChatUsed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("quizUsed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("assignmentUsed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pdfAnalysisUsed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("summaryUsed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("studyPlanUsed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tokensUsed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("dailyResetAt", sa.DateTime(), nullable=True),
        sa.Column("resetDate", sa.DateTime(), nullable=True),
        sa.Column("createdAt", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updatedAt", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["userId"], ["User.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("userId", name="uq_AIUsage_userId"),
    )
    op.create_index("ix_AIUsage_userId", "AIUsage", ["userId"])


def downgrade() -> None:
    if table_exists("AIUsage"):
        op.drop_index("ix_AIUsage_userId", table_name="AIUsage")
        op.drop_table("AIUsage")
