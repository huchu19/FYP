from typing import Optional

from sqlalchemy.orm import Session

from app.models.lesson import Lesson


class LessonRepository:
    def list_all(self, db: Session) -> list[Lesson]:
        return db.query(Lesson).order_by(Lesson.id.asc()).all()

    def get_by_id(self, db: Session, lesson_id: int) -> Optional[Lesson]:
        return db.query(Lesson).filter(Lesson.id == lesson_id).first()

    def create(
        self,
        db: Session,
        *,
        classroom_id: int,
        title: str,
        prompt: str,
        outline: list[str],
        body: Optional[str],
        created_by_user_id: Optional[int],
        status: str = "draft",
        generated_by_ai: bool = False,
    ) -> Lesson:
        lesson = Lesson(
            classroom_id=classroom_id,
            title=title,
            prompt=prompt,
            outline=outline,
            body=body,
            created_by_user_id=created_by_user_id,
            status=status,
            generated_by_ai=generated_by_ai,
        )
        db.add(lesson)
        db.commit()
        db.refresh(lesson)
        return lesson
