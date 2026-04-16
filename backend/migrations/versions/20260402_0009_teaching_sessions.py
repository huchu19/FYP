"""add teaching_sessions table

Revision ID: 7c3e91df0b01
Revises: 20260402_0008
Create Date: 2026-04-02 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260402_0009'
down_revision = '20260402_0008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('teaching_sessions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('student_id', sa.Integer(), nullable=False),
    sa.Column('classroom_id', sa.Integer(), nullable=False),
    sa.Column('lesson_id', sa.Integer(), nullable=True),
    sa.Column('concept_id', sa.Integer(), nullable=True),
    sa.Column('topic', sa.String(), nullable=False),
    sa.Column('conversation', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('assessment', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('overall_score', sa.Float(), nullable=True),
    sa.Column('turn_count', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id'], ),
    sa.ForeignKeyConstraint(['concept_id'], ['concepts.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_teaching_sessions_id'), 'teaching_sessions', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_teaching_sessions_id'), table_name='teaching_sessions')
    op.drop_table('teaching_sessions')
