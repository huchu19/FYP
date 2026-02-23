from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.services.lesson_service import LessonService
from app.schemas.lesson import Lesson, LessonCreate

router = APIRouter(prefix="/lessons", tags=["lessons"])
service = LessonService()


@router.get("/", response_model=list[Lesson])
def list_lessons(db: Session = Depends(get_db)) -> list[Lesson]:
    return service.list_lessons(db)


@router.post("/", response_model=Lesson, status_code=201)
def create_lesson(payload: LessonCreate, db: Session = Depends(get_db)) -> Lesson:
    return service.create_lesson(db, payload)


@router.get("/{lesson_id}", response_model=Lesson)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)) -> Lesson:
    return service.get_lesson(db, lesson_id)
