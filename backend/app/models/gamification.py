from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.db import Base


class Gamification(Base):
    __tablename__ = "gamification"
    __table_args__ = (UniqueConstraint("classroom_id", "user_id", name="uq_gamification_classroom_user"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    xp = Column(Integer, default=0)
    badges = Column(JSONB, default=list, nullable=False)
    streak_days = Column(Integer, nullable=False, default=0)
    last_activity_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
