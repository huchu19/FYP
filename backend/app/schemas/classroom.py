from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ClassroomBase(BaseModel):
    name: str = Field(..., example="Physics 101")
    code: str = Field(..., example="PHYS-ABC")
    description: Optional[str] = Field(default=None, example="Intro to mechanics and waves")
    subject: Optional[str] = Field(default=None, example="Physics")
    year_group: Optional[str] = Field(default=None, example="Year 10")
    learning_objectives: Optional[str] = Field(default=None, example="Understand Newton's three laws")
    syllabus_notes: Optional[str] = Field(default=None, example="AQA GCSE spec — avoid nuclear physics")


class ClassroomCreate(ClassroomBase):
    model_config = ConfigDict(extra="forbid")


class ClassroomUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    year_group: Optional[str] = None
    learning_objectives: Optional[str] = None
    syllabus_notes: Optional[str] = None


class ClassroomJoin(BaseModel):
    code: str

    model_config = ConfigDict(extra="forbid")


class Classroom(ClassroomBase):
    id: int
    teacher_id: int

    model_config = ConfigDict(from_attributes=True)
