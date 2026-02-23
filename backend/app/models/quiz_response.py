from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.db import Base


class QuizResponse(Base):
    __tablename__ = "quiz_responses"
    __table_args__ = (UniqueConstraint("attempt_id", "question_index", name="uq_attempt_question"),)

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    question_index = Column(Integer, nullable=False)
    question_payload = Column(JSONB, nullable=False, default=dict)
    selected_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=False, default=False)
    awarded_xp = Column(Integer, nullable=False, default=0)
    answered_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
