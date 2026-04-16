"""Add cascade deletes for lesson->quiz->attempt->response

Revision ID: 20260315_0004
Revises: 20260315_0003
Create Date: 2026-03-15

"""
from alembic import op

revision = "20260315_0004"
down_revision = "20260315_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # quizzes.lesson_id -> lessons.id  (add ON DELETE CASCADE)
    op.drop_constraint("fk_quizzes_lesson_id_lessons", "quizzes", type_="foreignkey")
    op.create_foreign_key(
        "fk_quizzes_lesson_id_lessons", "quizzes", "lessons",
        ["lesson_id"], ["id"], ondelete="CASCADE",
    )

    # quiz_attempts.quiz_id -> quizzes.id  (add ON DELETE CASCADE)
    op.drop_constraint("quiz_attempts_quiz_id_fkey", "quiz_attempts", type_="foreignkey")
    op.create_foreign_key(
        "quiz_attempts_quiz_id_fkey", "quiz_attempts", "quizzes",
        ["quiz_id"], ["id"], ondelete="CASCADE",
    )

    # quiz_responses.attempt_id -> quiz_attempts.id  (add ON DELETE CASCADE)
    op.drop_constraint("quiz_responses_attempt_id_fkey", "quiz_responses", type_="foreignkey")
    op.create_foreign_key(
        "quiz_responses_attempt_id_fkey", "quiz_responses", "quiz_attempts",
        ["attempt_id"], ["id"], ondelete="CASCADE",
    )


def downgrade() -> None:
    # Revert to plain FK without CASCADE
    op.drop_constraint("quiz_responses_attempt_id_fkey", "quiz_responses", type_="foreignkey")
    op.create_foreign_key(
        "quiz_responses_attempt_id_fkey", "quiz_responses", "quiz_attempts",
        ["attempt_id"], ["id"],
    )

    op.drop_constraint("quiz_attempts_quiz_id_fkey", "quiz_attempts", type_="foreignkey")
    op.create_foreign_key(
        "quiz_attempts_quiz_id_fkey", "quiz_attempts", "quizzes",
        ["quiz_id"], ["id"],
    )

    op.drop_constraint("fk_quizzes_lesson_id_lessons", "quizzes", type_="foreignkey")
    op.create_foreign_key(
        "fk_quizzes_lesson_id_lessons", "quizzes", "lessons",
        ["lesson_id"], ["id"],
    )
