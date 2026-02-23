from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.services.gamification import GamificationService
from app.schemas.gamification import GamificationSummary

router = APIRouter(prefix="/gamification", tags=["gamification"])
service = GamificationService()


@router.get("/leaderboard", response_model=list[GamificationSummary])
def leaderboard(
    classroom_id: Optional[int] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[GamificationSummary]:
    return service.leaderboard(db, classroom_id=classroom_id, limit=limit)


@router.get("/me", response_model=GamificationSummary)
def my_stats(
    user_id: int = Query(..., ge=1),
    classroom_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
) -> GamificationSummary:
    return service.user_summary(db, user_id=user_id, classroom_id=classroom_id)
