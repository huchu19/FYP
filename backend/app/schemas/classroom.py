from typing import Optional

from pydantic import BaseModel, Field


class ClassroomBase(BaseModel):
    name: str = Field(..., example="Physics 101")
    code: str = Field(..., example="PHYS-ABC")
    teacher_id: int
    description: Optional[str] = Field(default=None, example="Intro to mechanics and waves")


class ClassroomCreate(ClassroomBase):
    pass


class Classroom(ClassroomBase):
    id: int

    class Config:
        orm_mode = True
