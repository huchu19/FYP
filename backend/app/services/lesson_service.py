import logging
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lesson import Lesson
from app.models.user import User
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.lesson_repository import LessonRepository
from app.schemas.lesson import LessonCreate
from app.services.ai import AIService

logger = logging.getLogger(__name__)


class LessonService:
    def __init__(
        self,
        lesson_repository: Optional[LessonRepository] = None,
        classroom_repository: Optional[ClassroomRepository] = None,
        ai_service: Optional[AIService] = None,
    ) -> None:
        self.lesson_repository = lesson_repository or LessonRepository()
        self.classroom_repository = classroom_repository or ClassroomRepository()
        self.ai_service = ai_service or AIService()

    def list_lessons(self, db: Session) -> list[Lesson]:
        return self.lesson_repository.list_all(db)

    def list_for_classroom(self, db: Session, classroom_id: int) -> list[Lesson]:
        return self.lesson_repository.list_for_classroom(db, classroom_id)

    def get_lesson(self, db: Session, lesson_id: int) -> Lesson:
        lesson = self.lesson_repository.get_by_id(db, lesson_id)
        if lesson is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
        return lesson

    def create_lesson(
        self,
        db: Session,
        payload: LessonCreate,
        *,
        actor_user: User,
        use_ai: bool = True,
    ) -> Lesson:
        if actor_user.role != "teacher":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can create lessons")

        classroom = self.classroom_repository.get_by_id(db, payload.classroom_id)
        if classroom is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
        if classroom.teacher_id != actor_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the classroom teacher can create lessons",
            )

        title = payload.title
        outline = payload.outline
        body = payload.body
        generated_by_ai = False

        if use_ai and payload.prompt:
            try:
                ai_result = self.ai_service.generate_lesson(payload.prompt)
                title = ai_result["title"]
                outline = ai_result["outline"]
                body = ai_result["body"]
                generated_by_ai = True
            except Exception as exc:
                logger.exception("AI lesson generation failed")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"AI generation failed: {exc}",
                )

        return self.lesson_repository.create(
            db,
            classroom_id=payload.classroom_id,
            title=title,
            prompt=payload.prompt,
            outline=outline,
            body=body,
            created_by_user_id=actor_user.id,
            status="draft",
            generated_by_ai=generated_by_ai,
        )

    def publish_lesson(self, db: Session, lesson_id: int, *, actor_user: User) -> Lesson:
        lesson = self.get_lesson(db, lesson_id)
        classroom = self.classroom_repository.get_by_id(db, lesson.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return self.lesson_repository.publish(db, lesson)

    def unpublish_lesson(self, db: Session, lesson_id: int, *, actor_user: User) -> Lesson:
        lesson = self.get_lesson(db, lesson_id)
        classroom = self.classroom_repository.get_by_id(db, lesson.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return self.lesson_repository.unpublish(db, lesson)

    def delete_lesson(self, db: Session, lesson_id: int, *, actor_user: User) -> None:
        lesson = self.get_lesson(db, lesson_id)
        classroom = self.classroom_repository.get_by_id(db, lesson.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        self.lesson_repository.delete(db, lesson)
