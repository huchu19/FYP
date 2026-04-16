from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class LessonBase(BaseModel):
    classroom_id: int
    title: str = Field(..., example="Newton's Laws")
    prompt: Optional[str] = Field(default=None, example="Explain Newton's laws for beginners")
    outline: List[str] = Field(default_factory=list)
    body: Optional[str] = Field(default=None, example="Full lesson content")
    content_format: str = Field(default="slides", example="slides|pdf_report|presentation|flashcards")


class LessonCreate(LessonBase):
    reference_text: Optional[str] = Field(
        default=None,
        description="Extracted text from uploaded documents to feed into AI generation",
    )


class LessonReformat(BaseModel):
    content_format: str = Field(..., example="pdf_report")


class LessonUpdate(BaseModel):
    title: Optional[str] = Field(None, example="Updated Title")
    body: Optional[str] = Field(None, example="Updated lesson content")
    outline: Optional[List[str]] = Field(None)
    content_format: Optional[str] = Field(None, example="slides|pdf_report|presentation|flashcards")


class LessonDocument(BaseModel):
    id: int
    lesson_id: int
    filename: str
    mime_type: str
    extracted_text: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Lesson(LessonBase):
    id: int
    status: str
    generated_by_ai: bool
    created_by_user_id: Optional[int]
    published_at: Optional[datetime]
    flashcards: Optional[list] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
