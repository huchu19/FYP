from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)

    quizzes = relationship("Quiz", back_populates="lesson", cascade="all, delete-orphan", passive_deletes=True)
    title = Column(String, nullable=False)
    prompt = Column(Text, nullable=True)
    outline = Column(ARRAY(String), default=list)
    body = Column(Text, nullable=True)
    content_format = Column(String, nullable=False, default="slides")  # slides|pdf_report|presentation|flashcards
    flashcards = Column(JSONB, nullable=True)  # [{front: str, back: str}, ...]
    status = Column(String, nullable=False, default="draft")
    generated_by_ai = Column(Boolean, nullable=False, default=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
