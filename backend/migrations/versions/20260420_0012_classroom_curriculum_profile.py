"""Add curriculum profile columns to classrooms table.

Revision ID: 20260420_0012
Revises: 20260413_0011
Create Date: 2026-04-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260420_0012"
down_revision = "20260413_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("classrooms", sa.Column("subject", sa.String(), nullable=True))
    op.add_column("classrooms", sa.Column("year_group", sa.String(), nullable=True))
    op.add_column("classrooms", sa.Column("learning_objectives", sa.Text(), nullable=True))
    op.add_column("classrooms", sa.Column("syllabus_notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("classrooms", "syllabus_notes")
    op.drop_column("classrooms", "learning_objectives")
    op.drop_column("classrooms", "year_group")
    op.drop_column("classrooms", "subject")
