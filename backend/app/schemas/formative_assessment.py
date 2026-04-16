"""Pydantic schemas for formative assessment endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field

class ConceptInventoryRequest(BaseModel):
    classroom_id: int
    num_questions: int = Field(default=5, ge=3, le=10)


class SubmitResponseItem(BaseModel):
    question_index: int
    selected_answer: str
    confidence: int | None = Field(default=None, ge=1, le=5)


class SubmitResponsesRequest(BaseModel):
    assessment_id: int
    responses: list[SubmitResponseItem]
