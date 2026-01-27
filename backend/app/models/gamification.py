from sqlalchemy import Column, ForeignKey, Integer, String

from app.db import Base


class Gamification(Base):
    __tablename__ = "gamification"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    xp = Column(Integer, default=0)
    badges = Column(String, default="")
