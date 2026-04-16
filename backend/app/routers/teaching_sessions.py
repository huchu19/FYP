"""Peer Teaching Session API endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.schemas.teaching_session import (
    CompleteSessionRequest,
    SendMessageRequest,
    StartSessionRequest,
)
from app.services.teaching_service import TeachingService

router = APIRouter(prefix="/teaching-sessions", tags=["teaching-sessions"])
teaching_service = TeachingService()


@router.post("/start")
def start_session(
    body: StartSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> dict[str, Any]:
    """Start a new peer teaching session with the AI confused learner."""
    return teaching_service.start_session(
        db,
        student_id=current_user.id,
        lesson_id=body.lesson_id,
        concept_id=body.concept_id,
    )


@router.post("/message")
def send_message(
    body: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> dict[str, Any]:
    """Send a message in an active teaching session."""
    return teaching_service.send_message(
        db,
        session_id=body.session_id,
        student_id=current_user.id,
        message=body.message,
    )


@router.post("/complete")
def complete_session(
    body: CompleteSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> dict[str, Any]:
    """Complete a teaching session and trigger AI assessment."""
    return teaching_service.complete_session(
        db,
        session_id=body.session_id,
        student_id=current_user.id,
    )


@router.get("/{session_id}")
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Get a teaching session by ID."""
    return teaching_service.get_session(
        db,
        session_id=session_id,
        user_id=current_user.id,
        user_role=current_user.role,
    )


@router.get("/")
def list_sessions(
    classroom_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """List teaching sessions for a classroom."""
    student_id = current_user.id if current_user.role == "student" else None
    return teaching_service.list_sessions(
        db, student_id=student_id, classroom_id=classroom_id
    )
