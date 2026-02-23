from typing import Optional

from sqlalchemy.orm import Session

from app.models.quiz import Quiz


class QuizRepository:
    def list_all(self, db: Session) -> list[Quiz]:
        return db.query(Quiz).order_by(Quiz.id.asc()).all()

    def get_by_id(self, db: Session, quiz_id: int) -> Optional[Quiz]:
        return db.query(Quiz).filter(Quiz.id == quiz_id).first()

    def create(
        self,
        db: Session,
        *,
        classroom_id: int,
        title: str,
        difficulty: str,
        questions: list[dict],
        lesson_id: Optional[int] = None,
        created_by_user_id: Optional[int] = None,
    ) -> Quiz:
        quiz = Quiz(
            classroom_id=classroom_id,
            lesson_id=lesson_id,
            title=title,
            difficulty=difficulty,
            questions=questions,
            created_by_user_id=created_by_user_id,
            is_published=False,
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        return quiz
