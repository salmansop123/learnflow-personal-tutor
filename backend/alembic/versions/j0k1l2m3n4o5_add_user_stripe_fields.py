"""add user stripe fields

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2026-06-23

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.db.migration_helpers import column_exists

revision: str = "j0k1l2m3n4o5"
down_revision: Union[str, None] = "i9j0k1l2m3n4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not column_exists("User", "stripeCustomerId"):
        op.add_column("User", sa.Column("stripeCustomerId", sa.String(), nullable=True))
        op.create_index(
            "ix_User_stripeCustomerId",
            "User",
            ["stripeCustomerId"],
            unique=True,
        )
    if not column_exists("User", "stripeSubscriptionId"):
        op.add_column(
            "User", sa.Column("stripeSubscriptionId", sa.String(), nullable=True)
        )


def downgrade() -> None:
    if column_exists("User", "stripeSubscriptionId"):
        op.drop_column("User", "stripeSubscriptionId")
    if column_exists("User", "stripeCustomerId"):
        op.drop_index("ix_User_stripeCustomerId", table_name="User")
        op.drop_column("User", "stripeCustomerId")
