from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.services.lesson_service import LessonService
from app.schemas.lesson import Lesson, LessonCreate

router = APIRouter(prefix="/lessons", tags=["lessons"])
service = LessonService()


@router.get("/", response_model=list[Lesson])
def list_lessons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Lesson]:
    return service.list_lessons(db)


@router.post("/", response_model=Lesson, status_code=201)
def create_lesson(
    payload: LessonCreate,
    generate: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Lesson:
    return service.create_lesson(db, payload, actor_user=current_user, use_ai=generate)


@router.get("/{lesson_id}", response_model=Lesson)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Lesson:
    return service.get_lesson(db, lesson_id)


@router.patch("/{lesson_id}/publish", response_model=Lesson)
def publish_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Lesson:
    return service.publish_lesson(db, lesson_id, actor_user=current_user)


@router.patch("/{lesson_id}/unpublish", response_model=Lesson)
def unpublish_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Lesson:
    return service.unpublish_lesson(db, lesson_id, actor_user=current_user)


@router.delete("/{lesson_id}", status_code=204)
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
):
    service.delete_lesson(db, lesson_id, actor_user=current_user)
    return Response(status_code=204)
