"""Add hint scaffolding and ZPD mastery fields

Revision ID: 20260401_0007
Revises: 20260331_0006
Create Date: 2026-04-01
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260401_0007"
down_revision = "20260331_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "quiz_attempts",
        "score",
        existing_type=sa.Integer(),
        type_=sa.Float(),
        existing_nullable=True,
        postgresql_using="score::double precision",
    )
    op.add_column(
        "quiz_responses",
        sa.Column("hints_used", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "student_concept_mastery",
        sa.Column("unaided_mastery", sa.Float(), nullable=True),
    )
    op.add_column(
        "student_concept_mastery",
        sa.Column("aided_mastery", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("student_concept_mastery", "aided_mastery")
    op.drop_column("student_concept_mastery", "unaided_mastery")
    op.drop_column("quiz_responses", "hints_used")
    op.alter_column(
        "quiz_attempts",
        "score",
        existing_type=sa.Float(),
        type_=sa.Integer(),
        existing_nullable=True,
        postgresql_using="round(score)::integer",
    )
