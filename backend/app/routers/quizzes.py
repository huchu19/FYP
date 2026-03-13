from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.services.quiz_service import QuizService
from app.schemas.quiz import Quiz, QuizCreate

router = APIRouter(prefix="/quizzes", tags=["quizzes"])
service = QuizService()


@router.get("/", response_model=list[Quiz])
def list_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Quiz]:
    return service.list_quizzes(db)


@router.post("/", response_model=Quiz, status_code=201)
def create_quiz(
    payload: QuizCreate,
    generate: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Quiz:
    return service.create_quiz(db, payload, actor_user=current_user, use_ai=generate)


@router.get("/{quiz_id}", response_model=Quiz)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Quiz:
    return service.get_quiz(db, quiz_id)


@router.patch("/{quiz_id}/publish", response_model=Quiz)
def publish_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Quiz:
    return service.publish_quiz(db, quiz_id, actor_user=current_user)


@router.patch("/{quiz_id}/unpublish", response_model=Quiz)
def unpublish_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Quiz:
    return service.unpublish_quiz(db, quiz_id, actor_user=current_user)


@router.delete("/{quiz_id}", status_code=204)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> None:
    service.delete_quiz(db, quiz_id, actor_user=current_user)
