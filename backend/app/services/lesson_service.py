from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lesson import Lesson
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.lesson_repository import LessonRepository
from app.schemas.lesson import LessonCreate


class LessonService:
    def __init__(
        self,
        lesson_repository: Optional[LessonRepository] = None,
        classroom_repository: Optional[ClassroomRepository] = None,
    ) -> None:
        self.lesson_repository = lesson_repository or LessonRepository()
        self.classroom_repository = classroom_repository or ClassroomRepository()

    def list_lessons(self, db: Session) -> list[Lesson]:
        return self.lesson_repository.list_all(db)

    def get_lesson(self, db: Session, lesson_id: int) -> Lesson:
        lesson = self.lesson_repository.get_by_id(db, lesson_id)
        if lesson is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
        return lesson

    def create_lesson(self, db: Session, payload: LessonCreate) -> Lesson:
        classroom = self.classroom_repository.get_by_id(db, payload.classroom_id)
        if classroom is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

        return self.lesson_repository.create(
            db,
            classroom_id=payload.classroom_id,
            title=payload.title,
            prompt=payload.prompt,
            outline=payload.outline,
            body=payload.body,
            created_by_user_id=classroom.teacher_id,
            status="draft",
            generated_by_ai=False,
        )
