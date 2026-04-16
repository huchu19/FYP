"""Peer Teaching Simulator model — students teach an AI 'confused learner'."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.db import Base


class TeachingSession(Base):
    __tablename__ = "teaching_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True)
    concept_id = Column(Integer, ForeignKey("concepts.id", ondelete="SET NULL"), nullable=True)

    # The concept/topic being taught
    topic = Column(String, nullable=False)

    # Chat history: [{"role": "student"|"learner", "content": "..."}]
    conversation = Column(JSONB, nullable=False, default=list)

    # active | completed | abandoned
    status = Column(String, nullable=False, default="active")

    # AI assessment after completion
    # {completeness, accuracy, clarity, depth, overall_score, feedback, strengths, improvements}
    assessment = Column(JSONB, nullable=True)
    overall_score = Column(Float, nullable=True)

    turn_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
