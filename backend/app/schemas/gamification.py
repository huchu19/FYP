from typing import List

from pydantic import BaseModel


class GamificationSummary(BaseModel):
    user_id: int
    display_name: str
    xp: int
    badges: List[str]
