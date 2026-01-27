from typing import List

from fastapi import APIRouter

from app.schemas.gamification import GamificationSummary

router = APIRouter(prefix="/gamification", tags=["gamification"])


@router.get("/leaderboard", response_model=List[GamificationSummary])
def leaderboard() -> List[GamificationSummary]:
    return [
        GamificationSummary(user_id=1, display_name="Alice", xp=1200, badges=["Starter", "Streak 3"]),
        GamificationSummary(user_id=2, display_name="Ben", xp=950, badges=["Starter"]),
    ]


@router.get("/me", response_model=GamificationSummary)
def my_stats() -> GamificationSummary:
    # Stubbed current-user stats
    return GamificationSummary(user_id=99, display_name="You", xp=150, badges=["Welcome"])
