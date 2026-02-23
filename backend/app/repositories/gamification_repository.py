from typing import Optional

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.gamification import Gamification
from app.models.user import User


class GamificationRepository:
    def leaderboard(
        self,
        db: Session,
        *,
        classroom_id: Optional[int],
        limit: int = 20,
    ) -> list[tuple[Gamification, User]]:
        query = (
            db.query(Gamification, User)
            .join(User, User.id == Gamification.user_id)
            .order_by(desc(Gamification.xp), desc(Gamification.updated_at))
        )

        if classroom_id is not None:
            query = query.filter(Gamification.classroom_id == classroom_id)

        return query.limit(limit).all()

    def user_rows(
        self,
        db: Session,
        *,
        user_id: int,
        classroom_id: Optional[int],
    ) -> list[Gamification]:
        query = db.query(Gamification).filter(Gamification.user_id == user_id)
        if classroom_id is not None:
            query = query.filter(Gamification.classroom_id == classroom_id)
        return query.order_by(desc(Gamification.xp)).all()

    def user_total_xp(
        self,
        db: Session,
        *,
        user_id: int,
        classroom_id: Optional[int],
    ) -> int:
        query = db.query(func.coalesce(func.sum(Gamification.xp), 0)).filter(Gamification.user_id == user_id)
        if classroom_id is not None:
            query = query.filter(Gamification.classroom_id == classroom_id)
        return int(query.scalar() or 0)
