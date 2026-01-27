from typing import List, Optional

from pydantic import BaseModel, Field


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

    class Config:
        orm_mode = True
