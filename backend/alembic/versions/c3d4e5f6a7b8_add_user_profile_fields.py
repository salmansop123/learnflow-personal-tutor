"""add user profile fields

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from app.db.migration_helpers import column_exists, enum_type_exists

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

education_level_enum = postgresql.ENUM(
    "SCHOOL", "COLLEGE", "UNIVERSITY", "JOB_TEST", name="educationlevel", create_type=False
)
university_level_enum = postgresql.ENUM(
    "BACHELORS", "MASTERS", "PHD", name="universitylevel", create_type=False
)
learning_style_enum = postgresql.ENUM(
    "SHORT_NOTES",
    "DETAILED_EXPLANATIONS",
    "VISUAL_LEARNING",
    "QUIZ_BASED",
    name="learningstyle",
    create_type=False,
)
study_time_enum = postgresql.ENUM(
    "MORNING", "AFTERNOON", "EVENING", "NIGHT", name="studytime", create_type=False
)


def upgrade() -> None:
    if column_exists("User", "onboardingComplete"):
        return

    if not enum_type_exists("educationlevel"):
        op.execute(
            "CREATE TYPE educationlevel AS ENUM "
            "('SCHOOL', 'COLLEGE', 'UNIVERSITY', 'JOB_TEST')"
        )
    if not enum_type_exists("universitylevel"):
        op.execute(
            "CREATE TYPE universitylevel AS ENUM ('BACHELORS', 'MASTERS', 'PHD')"
        )
    if not enum_type_exists("learningstyle"):
        op.execute(
            "CREATE TYPE learningstyle AS ENUM "
            "('SHORT_NOTES', 'DETAILED_EXPLANATIONS', 'VISUAL_LEARNING', 'QUIZ_BASED')"
        )
    if not enum_type_exists("studytime"):
        op.execute(
            "CREATE TYPE studytime AS ENUM "
            "('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT')"
        )

    op.add_column(
        "User",
        sa.Column("onboardingComplete", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column("User", sa.Column("fullName", sa.String(), nullable=True))
    op.add_column("User", sa.Column("age", sa.Integer(), nullable=True))
    op.add_column("User", sa.Column("country", sa.String(), nullable=True))
    op.add_column("User", sa.Column("gradeOrYear", sa.String(), nullable=True))
    op.add_column(
        "User",
        sa.Column("universityLevel", university_level_enum, nullable=True),
    )
    op.add_column("User", sa.Column("totalSubjects", sa.Integer(), nullable=True))
    op.add_column(
        "User",
        sa.Column(
            "subjectNames",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "User",
        sa.Column(
            "weakSubjects",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column(
        "User",
        sa.Column(
            "strongSubjects",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
        ),
    )
    op.add_column("User", sa.Column("dailyStudyHoursGoal", sa.Float(), nullable=True))
    op.add_column(
        "User",
        sa.Column("preferredStudyTime", study_time_enum, nullable=True),
    )
    op.add_column("User", sa.Column("learningGoals", sa.Text(), nullable=True))
    op.add_column(
        "User",
        sa.Column("learningStyle", learning_style_enum, nullable=True),
    )
    op.add_column("User", sa.Column("examType", sa.String(), nullable=True))
    op.add_column("User", sa.Column("examPrepDetails", sa.Text(), nullable=True))
    op.add_column("User", sa.Column("profileCompletedAt", sa.DateTime(), nullable=True))

    op.add_column(
        "User",
        sa.Column("educationLevel_new", education_level_enum, nullable=True),
    )
    op.execute(
        """
        UPDATE "User" SET "educationLevel_new" = CASE
            WHEN "educationLevel" ILIKE '%high school%' OR "educationLevel" ILIKE '%school%'
                THEN 'SCHOOL'::educationlevel
            WHEN "educationLevel" ILIKE '%undergrad%' OR "educationLevel" ILIKE '%college%'
                THEN 'COLLEGE'::educationlevel
            WHEN "educationLevel" ILIKE '%grad%' OR "educationLevel" ILIKE '%university%'
                THEN 'UNIVERSITY'::educationlevel
            WHEN "educationLevel" ILIKE '%professional%' OR "educationLevel" ILIKE '%job%'
                THEN 'JOB_TEST'::educationlevel
            ELSE NULL
        END
        WHERE "educationLevel" IS NOT NULL
        """
    )
    op.drop_column("User", "educationLevel")
    op.alter_column("User", "educationLevel_new", new_column_name="educationLevel")

    op.execute(
        'UPDATE "User" SET "onboardingComplete" = true WHERE "onboardingComplete" = false'
    )


def downgrade() -> None:
    op.add_column("User", sa.Column("educationLevel_old", sa.String(), nullable=True))
    op.execute(
        """
        UPDATE "User" SET "educationLevel_old" = "educationLevel"::text
        WHERE "educationLevel" IS NOT NULL
        """
    )
    op.drop_column("User", "educationLevel")
    op.alter_column("User", "educationLevel_old", new_column_name="educationLevel")

    op.drop_column("User", "profileCompletedAt")
    op.drop_column("User", "examPrepDetails")
    op.drop_column("User", "examType")
    op.drop_column("User", "learningStyle")
    op.drop_column("User", "learningGoals")
    op.drop_column("User", "preferredStudyTime")
    op.drop_column("User", "dailyStudyHoursGoal")
    op.drop_column("User", "strongSubjects")
    op.drop_column("User", "weakSubjects")
    op.drop_column("User", "subjectNames")
    op.drop_column("User", "totalSubjects")
    op.drop_column("User", "universityLevel")
    op.drop_column("User", "gradeOrYear")
    op.drop_column("User", "country")
    op.drop_column("User", "age")
    op.drop_column("User", "fullName")
    op.drop_column("User", "onboardingComplete")

    op.execute("DROP TYPE IF EXISTS studytime")
    op.execute("DROP TYPE IF EXISTS learningstyle")
    op.execute("DROP TYPE IF EXISTS universitylevel")
    op.execute("DROP TYPE IF EXISTS educationlevel")
