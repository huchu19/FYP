from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    quiz = relationship("Quiz", back_populates="attempts")
    responses = relationship("QuizResponse", back_populates="attempt", cascade="all, delete-orphan", passive_deletes=True)
    score = Column(Float, nullable=True)
    max_score = Column(Integer, nullable=True)
    time_taken_seconds = Column(Integer, nullable=True)
    difficulty_snapshot = Column(String, nullable=True)
    feedback = Column(JSONB, nullable=False, default=dict)
    started_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    # Metacognition: post-quiz reflection
    reflection = Column(Text, nullable=True)
    self_rated_understanding = Column(Integer, nullable=True)  # 1-5 scale
