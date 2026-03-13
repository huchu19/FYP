from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ClassroomBase(BaseModel):
    name: str = Field(..., example="Physics 101")
    code: str = Field(..., example="PHYS-ABC")
    description: Optional[str] = Field(default=None, example="Intro to mechanics and waves")


class ClassroomCreate(ClassroomBase):
    model_config = ConfigDict(extra="forbid")


class ClassroomJoin(BaseModel):
    code: str

    model_config = ConfigDict(extra="forbid")


class Classroom(ClassroomBase):
    id: int
    teacher_id: int

    model_config = ConfigDict(from_attributes=True)
