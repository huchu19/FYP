from typing import List, Dict, Any

from pydantic import BaseModel, ConfigDict, Field


class QuizBase(BaseModel):
    classroom_id: int
    title: str = Field(..., example="Kinematics basics")
    difficulty: str = Field(default="medium", example="easy|medium|hard")
    questions: List[Dict[str, Any]] = Field(default_factory=list)


class QuizCreate(QuizBase):
    pass


class Quiz(QuizBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
