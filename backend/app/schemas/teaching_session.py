"""Pydantic schemas for peer teaching session endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class StartSessionRequest(BaseModel):
    lesson_id: int
    concept_id: int | None = None


class SendMessageRequest(BaseModel):
    session_id: int
    message: str = Field(..., min_length=1, max_length=2000)


class CompleteSessionRequest(BaseModel):
    session_id: int
