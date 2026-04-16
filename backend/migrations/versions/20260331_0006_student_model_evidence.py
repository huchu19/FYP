"""Add evidence and metacognitive_score to student_concept_mastery

Revision ID: 20260331_0006
Revises: 20260324_0005
Create Date: 2026-03-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260331_0006"
down_revision = "20260324_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "student_concept_mastery",
        sa.Column("metacognitive_score", sa.Float(), nullable=True),
    )
    op.add_column(
        "student_concept_mastery",
        sa.Column("evidence", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("student_concept_mastery", "evidence")
    op.drop_column("student_concept_mastery", "metacognitive_score")
