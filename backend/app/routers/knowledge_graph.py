"""Knowledge Graph API endpoints."""

from typing import Any, Optional

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.services.knowledge_graph import KnowledgeGraphService


class ConceptCreate(BaseModel):
    classroom_id: int
    name: str
    description: Optional[str] = None


class ConceptUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

router = APIRouter(prefix="/knowledge-graph", tags=["knowledge-graph"])
kg_service = KnowledgeGraphService()


@router.get("/concepts")
def list_concepts(
    classroom_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    concepts = kg_service.list_concepts(db, classroom_id)
    return [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "lesson_id": c.lesson_id,
        }
        for c in concepts
    ]


@router.post("/concepts", status_code=status.HTTP_201_CREATED)
def create_concept(
    payload: ConceptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> dict[str, Any]:
    """Manually create a concept in a classroom's knowledge graph."""
    concept = kg_service.create_concept(
        db,
        classroom_id=payload.classroom_id,
        name=payload.name,
        description=payload.description,
    )
    db.commit()
    return {
        "id": concept.id,
        "name": concept.name,
        "description": concept.description,
        "lesson_id": concept.lesson_id,
    }


@router.patch("/concepts/{concept_id}")
def update_concept(
    concept_id: int,
    payload: ConceptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> dict[str, Any]:
    """Update a concept's name or description."""
    concept = kg_service.update_concept(
        db,
        concept_id,
        name=payload.name,
        description=payload.description,
    )
    db.commit()
    return {
        "id": concept.id,
        "name": concept.name,
        "description": concept.description,
        "lesson_id": concept.lesson_id,
    }


@router.delete("/concepts/{concept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_concept(
    concept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> None:
    """Delete a concept and its prerequisite edges."""
    kg_service.delete_concept(db, concept_id)
    db.commit()


class PrerequisiteCreate(BaseModel):
    concept_id: int
    prerequisite_id: int


@router.post("/prerequisites", status_code=status.HTTP_201_CREATED)
def add_prerequisite(
    payload: PrerequisiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> dict[str, Any]:
    """Add a prerequisite relationship between two concepts."""
    edge = kg_service.add_prerequisite(
        db, concept_id=payload.concept_id, prerequisite_id=payload.prerequisite_id
    )
    db.commit()
    return {"concept_id": edge.concept_id, "prerequisite_id": edge.prerequisite_id}


@router.delete("/prerequisites", status_code=status.HTTP_204_NO_CONTENT)
def remove_prerequisite(
    concept_id: int = Query(...),
    prerequisite_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> None:
    """Remove a prerequisite relationship between two concepts."""
    kg_service.remove_prerequisite(db, concept_id=concept_id, prerequisite_id=prerequisite_id)
    db.commit()


@router.post("/generate")
def generate_concepts(
    lesson_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> dict[str, Any]:
    """Use AI to extract concepts and prerequisites from a lesson."""
    return kg_service.generate_from_lesson(
        db, lesson_id=lesson_id, actor_user=current_user
    )


@router.get("/graph")
def get_graph(
    classroom_id: int = Query(...),
    student_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Get the concept graph (nodes + links) for a classroom.

    If student_id is provided, includes mastery scores per node.
    Students viewing their own graph get their own mastery automatically.
    """
    sid = student_id
    if current_user.role == "student":
        sid = current_user.id
    return kg_service.get_graph(db, classroom_id, student_id=sid)


@router.get("/blind-spots")
def get_blind_spots(
    classroom_id: int = Query(...),
    student_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Get low-mastery prerequisite concepts (blind spots) for a student."""
    sid = student_id if current_user.role == "teacher" else current_user.id
    return kg_service.get_blind_spots(db, classroom_id, sid)


@router.get("/practice-targets")
def get_practice_targets(
    classroom_id: int = Query(...),
    max_concepts: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> list[dict[str, Any]]:
    """Preview which concepts the adaptive engine would target for practice."""
    return kg_service.get_practice_targets(
        db, classroom_id, current_user.id, max_concepts=max_concepts
    )


@router.post("/practice-quiz")
def generate_practice_quiz(
    classroom_id: int = Query(...),
    num_questions: int = Query(5, ge=3, le=15),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> dict[str, Any]:
    """Generate a targeted quiz based on the student's weakest concepts."""
    return kg_service.generate_practice_quiz(
        db, classroom_id, current_user.id, num_questions=num_questions
    )
