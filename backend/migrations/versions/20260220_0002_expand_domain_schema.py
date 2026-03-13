"""Expand domain schema for classroom enrollment, attempts, and analytics.

Revision ID: 20260220_0002
Revises: 20260202_0001
Create Date: 2026-02-20
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260220_0002"
down_revision = "20260202_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("classroom_id", sa.Integer(), nullable=True),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column(
            "payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["classroom_id"], ["classrooms.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_analytics_events_created_at"), "analytics_events", ["created_at"], unique=False)
    op.create_index(op.f("ix_analytics_events_event_type"), "analytics_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_analytics_events_id"), "analytics_events", ["id"], unique=False)

    op.create_table(
        "classroom_enrollments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("classroom_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["classroom_id"], ["classrooms.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("classroom_id", "student_id", name="uq_classroom_student"),
    )
    op.create_index(op.f("ix_classroom_enrollments_id"), "classroom_enrollments", ["id"], unique=False)

    op.create_table(
        "quiz_attempts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("quiz_id", sa.Integer(), nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("max_score", sa.Integer(), nullable=True),
        sa.Column("time_taken_seconds", sa.Integer(), nullable=True),
        sa.Column("difficulty_snapshot", sa.String(), nullable=True),
        sa.Column(
            "feedback",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["quiz_id"], ["quizzes.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_quiz_attempts_id"), "quiz_attempts", ["id"], unique=False)

    op.create_table(
        "quiz_responses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("attempt_id", sa.Integer(), nullable=False),
        sa.Column("question_index", sa.Integer(), nullable=False),
        sa.Column(
            "question_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("selected_answer", sa.Text(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("awarded_xp", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "answered_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["attempt_id"], ["quiz_attempts.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("attempt_id", "question_index", name="uq_attempt_question"),
    )
    op.create_index(op.f("ix_quiz_responses_id"), "quiz_responses", ["id"], unique=False)

    op.add_column(
        "classrooms",
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.add_column(
        "classrooms",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.add_column("gamification", sa.Column("classroom_id", sa.Integer(), nullable=False))
    op.add_column("gamification", sa.Column("streak_days", sa.Integer(), nullable=False, server_default=sa.text("0")))
    op.add_column("gamification", sa.Column("last_activity_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "gamification",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.alter_column(
        "gamification",
        "badges",
        existing_type=sa.String(),
        existing_server_default=None,
        server_default=None,
    )
    op.alter_column(
        "gamification",
        "badges",
        existing_type=sa.String(),
        type_=postgresql.JSONB(astext_type=sa.Text()),
        nullable=False,
        postgresql_using=(
            "CASE "
            "WHEN badges IS NULL OR btrim(badges) = '' THEN '[]'::jsonb "
            "ELSE to_jsonb(string_to_array(badges, ',')) "
            "END"
        ),
    )
    op.alter_column(
        "gamification",
        "badges",
        server_default=sa.text("'[]'::jsonb"),
    )
    op.create_foreign_key(
        "fk_gamification_classroom_id_classrooms",
        "gamification",
        "classrooms",
        ["classroom_id"],
        ["id"],
    )
    op.create_unique_constraint("uq_gamification_classroom_user", "gamification", ["classroom_id", "user_id"])

    op.add_column("lessons", sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'draft'")))
    op.add_column(
        "lessons",
        sa.Column("generated_by_ai", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column("lessons", sa.Column("created_by_user_id", sa.Integer(), nullable=True))
    op.add_column("lessons", sa.Column("published_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "lessons",
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.add_column(
        "lessons",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_foreign_key(
        "fk_lessons_created_by_user_id_users",
        "lessons",
        "users",
        ["created_by_user_id"],
        ["id"],
    )

    op.add_column("quizzes", sa.Column("lesson_id", sa.Integer(), nullable=True))
    op.add_column(
        "quizzes",
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("quizzes", sa.Column("created_by_user_id", sa.Integer(), nullable=True))
    op.add_column(
        "quizzes",
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.add_column(
        "quizzes",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_foreign_key(
        "fk_quizzes_created_by_user_id_users",
        "quizzes",
        "users",
        ["created_by_user_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_quizzes_lesson_id_lessons",
        "quizzes",
        "lessons",
        ["lesson_id"],
        ["id"],
    )

    op.add_column("users", sa.Column("role", sa.String(), nullable=False, server_default=sa.text("'student'")))
    op.add_column("users", sa.Column("password_hash", sa.String(), nullable=False, server_default=sa.text("''")))
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column(
        "users",
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.add_column(
        "users",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_column("users", "updated_at")
    op.drop_column("users", "created_at")
    op.drop_column("users", "is_active")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "role")

    op.drop_constraint("fk_quizzes_lesson_id_lessons", "quizzes", type_="foreignkey")
    op.drop_constraint("fk_quizzes_created_by_user_id_users", "quizzes", type_="foreignkey")
    op.drop_column("quizzes", "updated_at")
    op.drop_column("quizzes", "created_at")
    op.drop_column("quizzes", "created_by_user_id")
    op.drop_column("quizzes", "is_published")
    op.drop_column("quizzes", "lesson_id")

    op.drop_constraint("fk_lessons_created_by_user_id_users", "lessons", type_="foreignkey")
    op.drop_column("lessons", "updated_at")
    op.drop_column("lessons", "created_at")
    op.drop_column("lessons", "published_at")
    op.drop_column("lessons", "created_by_user_id")
    op.drop_column("lessons", "generated_by_ai")
    op.drop_column("lessons", "status")

    op.drop_constraint("uq_gamification_classroom_user", "gamification", type_="unique")
    op.drop_constraint("fk_gamification_classroom_id_classrooms", "gamification", type_="foreignkey")
    op.alter_column(
        "gamification",
        "badges",
        existing_type=postgresql.JSONB(astext_type=sa.Text()),
        type_=sa.String(),
        nullable=False,
        server_default=sa.text("''"),
        postgresql_using=(
            "CASE "
            "WHEN jsonb_typeof(badges) = 'array' "
            "THEN array_to_string(ARRAY(SELECT jsonb_array_elements_text(badges)), ',') "
            "ELSE COALESCE(badges::text, '') "
            "END"
        ),
    )
    op.drop_column("gamification", "updated_at")
    op.drop_column("gamification", "last_activity_at")
    op.drop_column("gamification", "streak_days")
    op.drop_column("gamification", "classroom_id")

    op.drop_column("classrooms", "updated_at")
    op.drop_column("classrooms", "created_at")

    op.drop_index(op.f("ix_quiz_responses_id"), table_name="quiz_responses")
    op.drop_table("quiz_responses")

    op.drop_index(op.f("ix_quiz_attempts_id"), table_name="quiz_attempts")
    op.drop_table("quiz_attempts")

    op.drop_index(op.f("ix_classroom_enrollments_id"), table_name="classroom_enrollments")
    op.drop_table("classroom_enrollments")

    op.drop_index(op.f("ix_analytics_events_id"), table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_event_type"), table_name="analytics_events")
    op.drop_index(op.f("ix_analytics_events_created_at"), table_name="analytics_events")
    op.drop_table("analytics_events")
