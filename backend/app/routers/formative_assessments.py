"""Formative Assessment API endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.schemas.formative_assessment import (
    ConceptInventoryRequest,
    PrerequisiteDiagnosticRequest,
    PulseCheckRequest,
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


@router.post("/pulse-check")
def pulse_check(
    body: PulseCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> dict[str, Any]:
    """Generate a short pulse check on a single lesson's concepts."""
    return fa_service.pulse_check(
        db,
        student_id=current_user.id,
        lesson_id=body.lesson_id,
        num_questions=body.num_questions,
    )


@router.post("/prerequisite-diagnostic")
def prerequisite_diagnostic(
    body: PrerequisiteDiagnosticRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> dict[str, Any]:
    """Generate a readiness check over a concept's prerequisites."""
    return fa_service.prerequisite_diagnostic(
        db,
        student_id=current_user.id,
        concept_id=body.concept_id,
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
    student_id: int | None = Query(
        None, description="Teachers only: whose history to fetch. Students always see their own."
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """List formative assessments for a student in a classroom.

    Students always see their own history. Teachers must pass ``student_id`` to
    view a specific student's history.
    """
    if current_user.role == "student":
        sid = current_user.id
    else:
        if student_id is None:
            raise HTTPException(
                status_code=400,
                detail="Teachers must provide a student_id to view formative history.",
            )
        sid = student_id
    return fa_service.list_assessments(
        db, student_id=sid, classroom_id=classroom_id, assessment_type=assessment_type
    )
