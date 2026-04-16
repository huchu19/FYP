from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.gamification import Gamification
from app.models.user import User


class GamificationRepository:
    def _get_or_create(self, db: Session, *, user_id: int, classroom_id: int) -> Gamification:
        """Return the gamification row for user+classroom, creating and flushing if needed."""
        row = (
            db.query(Gamification)
            .filter(Gamification.user_id == user_id, Gamification.classroom_id == classroom_id)
            .first()
        )
        if row is None:
            row = Gamification(user_id=user_id, classroom_id=classroom_id, xp=0, badges=[], streak_days=0)
            db.add(row)
            db.flush()
        return row

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

    def add_xp(
        self,
        db: Session,
        *,
        user_id: int,
        classroom_id: int,
        xp: int,
    ) -> Gamification:
        """Add XP to a user's gamification row, creating it if needed."""
        row = self._get_or_create(db, user_id=user_id, classroom_id=classroom_id)
        row.xp += xp
        return row

    def add_badge(
        self,
        db: Session,
        *,
        user_id: int,
        classroom_id: int,
        badge: str,
    ) -> Gamification:
        """Add a badge to a user's gamification row if not already present."""
        row = self._get_or_create(db, user_id=user_id, classroom_id=classroom_id)
        if badge not in (row.badges or []):
            row.badges = (row.badges or []) + [badge]
        return row

    def update_streak(
        self,
        db: Session,
        *,
        user_id: int,
        classroom_id: int,
    ) -> Gamification:
        """Update streak_days based on consecutive daily activity.

        If last activity was yesterday, increment streak. If today, no change.
        Otherwise, reset to 1.
        """
        row = self._get_or_create(db, user_id=user_id, classroom_id=classroom_id)
        now = datetime.now(timezone.utc)
        today = now.date()

        if row.last_activity_at is not None:
            last_date = row.last_activity_at.date()
            if last_date == today:
                # Already active today — no change
                return row
            delta = (today - last_date).days
            if delta == 1:
                row.streak_days = (row.streak_days or 0) + 1
            else:
                # Gap in activity — reset streak
                row.streak_days = 1
        else:
            row.streak_days = 1

        row.last_activity_at = now
        return row
