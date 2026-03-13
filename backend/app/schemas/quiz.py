from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class QuizBase(BaseModel):
    classroom_id: int
    title: str = Field(..., example="Kinematics basics")
    difficulty: str = Field(default="medium", example="easy|medium|hard")
    questions: List[Dict[str, Any]] = Field(default_factory=list)


class QuizCreate(QuizBase):
    lesson_id: Optional[int] = None


class Quiz(QuizBase):
    id: int
    lesson_id: Optional[int]
    is_published: bool
    created_by_user_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
