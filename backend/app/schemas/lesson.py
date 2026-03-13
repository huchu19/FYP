from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class LessonBase(BaseModel):
    classroom_id: int
    title: str = Field(..., example="Newton's Laws")
    prompt: str = Field(..., example="Explain Newton's laws for beginners")
    outline: List[str] = Field(default_factory=list)
    body: Optional[str] = Field(default=None, example="Full lesson content")


class LessonCreate(LessonBase):
    pass


class Lesson(LessonBase):
    id: int
    status: str
    generated_by_ai: bool
    created_by_user_id: Optional[int]
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
