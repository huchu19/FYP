import logging
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lesson import Lesson
from app.models.user import User
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.lesson_repository import LessonRepository
from app.schemas.lesson import LessonCreate, LessonUpdate
from app.services.ai import AIService
from app.services.analytics import AnalyticsService

logger = logging.getLogger(__name__)


class LessonService:
    def __init__(
        self,
        lesson_repository: Optional[LessonRepository] = None,
        classroom_repository: Optional[ClassroomRepository] = None,
        ai_service: Optional[AIService] = None,
        analytics_service: Optional[AnalyticsService] = None,
    ) -> None:
        self.lesson_repository = lesson_repository or LessonRepository()
        self.classroom_repository = classroom_repository or ClassroomRepository()
        self.ai_service = ai_service or AIService()
        self.analytics = analytics_service or AnalyticsService()

    def list_lessons(self, db: Session) -> list[Lesson]:
        return self.lesson_repository.list_all(db)

    def list_for_classroom(
        self, db: Session, classroom_id: int, published_only: bool = False
    ) -> list[Lesson]:
        return self.lesson_repository.list_for_classroom(
            db, classroom_id, published_only=published_only
        )

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
        flashcards = None
        generated_by_ai = False

        if use_ai and payload.prompt:
            try:
                ai_prompt = payload.prompt
                if getattr(payload, "reference_text", None):
                    ai_prompt += f"\n\nReference material:\n{payload.reference_text[:8000]}"

                ai_result = self.ai_service.generate_lesson(
                    ai_prompt,
                    content_format=payload.content_format,
                )
                title = ai_result["title"]
                outline = ai_result["outline"]
                body = ai_result["body"]
                flashcards = ai_result.get("flashcards")
                generated_by_ai = True
            except Exception as exc:
                logger.exception("AI lesson generation failed")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"AI generation failed: {exc}",
                )

        lesson = self.lesson_repository.create(
            db,
            classroom_id=payload.classroom_id,
            title=title,
            prompt=payload.prompt,
            outline=outline,
            body=body,
            created_by_user_id=actor_user.id,
            status="draft",
            generated_by_ai=generated_by_ai,
            content_format=payload.content_format,
            flashcards=flashcards,
        )

        self.analytics.log_event(
            db,
            user_id=actor_user.id,
            classroom_id=payload.classroom_id,
            event_type="lesson_created",
            payload={
                "lesson_id": lesson.id,
                "title": title,
                "content_format": payload.content_format,
                "generated_by_ai": generated_by_ai,
            },
        )
        db.commit()

        return lesson

    def reformat_lesson(
        self,
        db: Session,
        lesson_id: int,
        *,
        content_format: str,
        actor_user: User,
    ) -> Lesson:
        lesson = self.get_lesson(db, lesson_id)
        classroom = self.classroom_repository.get_by_id(db, lesson.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
            )

        prompt = lesson.prompt or lesson.title
        try:
            ai_result = self.ai_service.generate_lesson(
                prompt, content_format=content_format
            )
        except Exception as exc:
            logger.exception("AI reformat failed")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI generation failed: {exc}",
            )

        lesson.body = ai_result["body"]
        lesson.outline = ai_result.get("outline", lesson.outline)
        lesson.content_format = content_format
        lesson.flashcards = ai_result.get("flashcards", lesson.flashcards)

        db.add(lesson)
        db.commit()
        db.refresh(lesson)
        return lesson

    def publish_lesson(self, db: Session, lesson_id: int, *, actor_user: User) -> Lesson:
        lesson = self.get_lesson(db, lesson_id)
        classroom = self.classroom_repository.get_by_id(db, lesson.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        result = self.lesson_repository.publish(db, lesson)
        self.analytics.log_event(
            db,
            user_id=actor_user.id,
            classroom_id=lesson.classroom_id,
            event_type="lesson_published",
            payload={"lesson_id": lesson.id, "title": lesson.title},
        )
        db.commit()
        return result

    def unpublish_lesson(self, db: Session, lesson_id: int, *, actor_user: User) -> Lesson:
        lesson = self.get_lesson(db, lesson_id)
        classroom = self.classroom_repository.get_by_id(db, lesson.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return self.lesson_repository.unpublish(db, lesson)

    def update_lesson(
        self,
        db: Session,
        lesson_id: int,
        payload: LessonUpdate,
        *,
        actor_user: User,
    ) -> Lesson:
        lesson = self.get_lesson(db, lesson_id)
        classroom = self.classroom_repository.get_by_id(db, lesson.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        # Apply updates
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(lesson, key, value)

        db.add(lesson)
        db.commit()
        db.refresh(lesson)

        self.analytics.log_event(
            db,
            user_id=actor_user.id,
            classroom_id=lesson.classroom_id,
            event_type="lesson_updated",
            payload={"lesson_id": lesson.id, "title": lesson.title},
        )
        return lesson

    def delete_lesson(self, db: Session, lesson_id: int, *, actor_user: User) -> None:
        lesson = self.get_lesson(db, lesson_id)
        classroom = self.classroom_repository.get_by_id(db, lesson.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        self.lesson_repository.delete(db, lesson)
