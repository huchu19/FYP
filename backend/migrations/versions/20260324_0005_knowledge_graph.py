"""Add knowledge graph tables: concepts, concept_prerequisites, student_concept_mastery

Revision ID: 20260324_0005
Revises: 20260315_0004
Create Date: 2026-03-24

"""
import sqlalchemy as sa
from alembic import op

revision = "20260324_0005"
down_revision = "20260315_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "concepts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("classroom_id", sa.Integer(), sa.ForeignKey("classrooms.id"), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("classroom_id", "name", name="uq_classroom_concept"),
    )
    op.create_index("ix_concepts_id", "concepts", ["id"])
    op.create_index("ix_concepts_classroom_id", "concepts", ["classroom_id"])

    op.create_table(
        "concept_prerequisites",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("concept_id", sa.Integer(), sa.ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("prerequisite_id", sa.Integer(), sa.ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("concept_id", "prerequisite_id", name="uq_concept_prereq"),
    )
    op.create_index("ix_concept_prerequisites_id", "concept_prerequisites", ["id"])

    op.create_table(
        "student_concept_mastery",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("concept_id", sa.Integer(), sa.ForeignKey("concepts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("mastery_score", sa.Float(), default=0.0),
        sa.Column("attempts", sa.Integer(), default=0),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("student_id", "concept_id", name="uq_student_concept"),
    )
    op.create_index("ix_student_concept_mastery_id", "student_concept_mastery", ["id"])


def downgrade() -> None:
    op.drop_table("student_concept_mastery")
    op.drop_table("concept_prerequisites")
    op.drop_table("concepts")
