"""Formative Assessment model — lightweight assessments that feed the student model."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.db import Base


class FormativeAssessment(Base):
    __tablename__ = "formative_assessments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True)

    # diagnostic | pulse | inventory
    assessment_type = Column(String, nullable=False)

    # The questions asked and student responses
    questions = Column(JSONB, nullable=False, default=list)
    responses = Column(JSONB, nullable=False, default=list)

    # Computed results
    score = Column(Float, nullable=True)  # 0.0-1.0
    max_questions = Column(Integer, nullable=False, default=0)
    correct_count = Column(Integer, nullable=False, default=0)

    # AI-generated recommendations based on results
    recommended_actions = Column(JSONB, nullable=True)
    # e.g. [{"action": "review", "concept": "Photosynthesis", "reason": "..."}]

    # Concept IDs assessed (for mastery updates)
    concept_ids_assessed = Column(JSONB, default=list)

    summary = Column(Text, nullable=True)  # AI-generated plain text summary

    created_at = Column(DateTime(timezone=True), server_default=func.now())
