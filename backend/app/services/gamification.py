from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.gamification_repository import GamificationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.gamification import GamificationSummary


class GamificationService:
    def __init__(
        self,
        gamification_repository: Optional[GamificationRepository] = None,
        user_repository: Optional[UserRepository] = None,
    ) -> None:
        self.gamification_repository = gamification_repository or GamificationRepository()
        self.user_repository = user_repository or UserRepository()

    def leaderboard(
        self,
        db: Session,
        *,
        classroom_id: Optional[int],
        limit: int,
    ) -> list[GamificationSummary]:
        rows = self.gamification_repository.leaderboard(db, classroom_id=classroom_id, limit=limit)
        return [
            GamificationSummary(
                user_id=user.id,
                display_name=user.name,
                xp=record.xp,
                badges=record.badges or [],
            )
            for record, user in rows
        ]

    def user_summary(
        self,
        db: Session,
        *,
        user_id: int,
        classroom_id: Optional[int],
    ) -> GamificationSummary:
        user = self.user_repository.get_by_id(db, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        rows = self.gamification_repository.user_rows(db, user_id=user_id, classroom_id=classroom_id)
        xp = self.gamification_repository.user_total_xp(db, user_id=user_id, classroom_id=classroom_id)

        badges: list[str] = []
        for row in rows:
            for badge in row.badges or []:
                if badge not in badges:
                    badges.append(badge)

        return GamificationSummary(
            user_id=user.id,
            display_name=user.name,
            xp=xp,
            badges=badges,
        )
