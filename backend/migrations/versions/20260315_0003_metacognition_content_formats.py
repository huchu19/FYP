"""Add metacognition fields, content formats, and quiz types.

Adds confidence_level, reasoning_text, reasoning_steps to quiz_responses.
Adds reflection, self_rated_understanding to quiz_attempts.
Adds content_format, flashcards to lessons.
Adds quiz_type to quizzes.

Revision ID: 20260315_0003
Revises: 20260220_0002
Create Date: 2026-03-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260315_0003"
down_revision = "20260220_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # quiz_responses: metacognition fields
    op.add_column("quiz_responses", sa.Column("confidence_level", sa.Integer(), nullable=True))
    op.add_column("quiz_responses", sa.Column("reasoning_text", sa.Text(), nullable=True))
    op.add_column(
        "quiz_responses",
        sa.Column(
            "reasoning_steps",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )

    # quiz_attempts: reflection fields
    op.add_column("quiz_attempts", sa.Column("reflection", sa.Text(), nullable=True))
    op.add_column("quiz_attempts", sa.Column("self_rated_understanding", sa.Integer(), nullable=True))

    # lessons: content format and flashcards
    op.add_column(
        "lessons",
        sa.Column("content_format", sa.String(), nullable=False, server_default="slides"),
    )
    op.add_column(
        "lessons",
        sa.Column(
            "flashcards",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )

    # quizzes: quiz type
    op.add_column(
        "quizzes",
        sa.Column("quiz_type", sa.String(), nullable=False, server_default="standard"),
    )


def downgrade() -> None:
    op.drop_column("quizzes", "quiz_type")
    op.drop_column("lessons", "flashcards")
    op.drop_column("lessons", "content_format")
    op.drop_column("quiz_attempts", "self_rated_understanding")
    op.drop_column("quiz_attempts", "reflection")
    op.drop_column("quiz_responses", "reasoning_steps")
    op.drop_column("quiz_responses", "reasoning_text")
    op.drop_column("quiz_responses", "confidence_level")
