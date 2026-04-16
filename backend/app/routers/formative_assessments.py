"""Formative Assessment API endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.schemas.formative_assessment import (
    ConceptInventoryRequest,
    SubmitResponsesRequest,
)
from app.services.formative_assessment_service import FormativeAssessmentService

router = APIRouter(prefix="/formative-assessments", tags=["formative-assessments"])
fa_service = FormativeAssessmentService()


@router.post("/concept-inventory")
def concept_inventory(
    body: ConceptInventoryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> dict[str, Any]:
    """Generate an adaptive concept inventory for the classroom."""
    return fa_service.concept_inventory(
        db,
        student_id=current_user.id,
        classroom_id=body.classroom_id,
        num_questions=body.num_questions,
    )


@router.post("/submit")
def submit_responses(
    body: SubmitResponsesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> dict[str, Any]:
    """Score submitted responses and update concept mastery."""
    return fa_service.submit_responses(
        db,
        assessment_id=body.assessment_id,
        student_id=current_user.id,
        responses=[r.model_dump() for r in body.responses],
    )


@router.get("/history")
def list_assessments(
    classroom_id: int = Query(...),
    assessment_type: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """List formative assessments for the current student in a classroom."""
    sid = current_user.id if current_user.role == "student" else None
    if sid is None:
        # Teachers can query via student_id param (not implemented yet — return empty)
        return []
    return fa_service.list_assessments(
        db, student_id=sid, classroom_id=classroom_id, assessment_type=assessment_type
    )
