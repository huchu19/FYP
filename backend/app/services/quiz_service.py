from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.quiz import Quiz
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.quiz_repository import QuizRepository
from app.schemas.quiz import QuizCreate


class QuizService:
    def __init__(
        self,
        quiz_repository: Optional[QuizRepository] = None,
        classroom_repository: Optional[ClassroomRepository] = None,
    ) -> None:
        self.quiz_repository = quiz_repository or QuizRepository()
        self.classroom_repository = classroom_repository or ClassroomRepository()

    def list_quizzes(self, db: Session) -> list[Quiz]:
        return self.quiz_repository.list_all(db)

    def get_quiz(self, db: Session, quiz_id: int) -> Quiz:
        quiz = self.quiz_repository.get_by_id(db, quiz_id)
        if quiz is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
        return quiz

    def create_quiz(self, db: Session, payload: QuizCreate) -> Quiz:
        classroom = self.classroom_repository.get_by_id(db, payload.classroom_id)
        if classroom is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

        return self.quiz_repository.create(
            db,
            classroom_id=payload.classroom_id,
            title=payload.title,
            difficulty=payload.difficulty,
            questions=payload.questions,
            created_by_user_id=classroom.teacher_id,
        )
