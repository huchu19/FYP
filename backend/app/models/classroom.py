from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.db import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String, nullable=True)
    year_group = Column(String, nullable=True)
    learning_objectives = Column(Text, nullable=True)
    syllabus_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
