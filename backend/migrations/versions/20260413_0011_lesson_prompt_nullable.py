"""Make lesson prompt column nullable for manual authoring.

Revision ID: 20260413_0011
Revises: 20260405_0010
Create Date: 2026-04-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260413_0011"
down_revision = "20260405_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("lessons", "prompt", existing_type=sa.Text(), nullable=True)


def downgrade() -> None:
    op.alter_column("lessons", "prompt", existing_type=sa.Text(), nullable=False)
