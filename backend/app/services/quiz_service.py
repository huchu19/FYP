import logging
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.classroom_enrollment import ClassroomEnrollment
from app.models.concept import Concept
from app.models.quiz import Quiz
from app.models.user import User
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.lesson_repository import LessonRepository
from app.repositories.quiz_repository import QuizRepository
from app.schemas.quiz import QuizCreate
from app.services.ai import AIService

logger = logging.getLogger(__name__)


class QuizService:
    def __init__(
        self,
        quiz_repository: Optional[QuizRepository] = None,
        classroom_repository: Optional[ClassroomRepository] = None,
        lesson_repository: Optional[LessonRepository] = None,
        ai_service: Optional[AIService] = None,
    ) -> None:
        self.quiz_repository = quiz_repository or QuizRepository()
        self.classroom_repository = classroom_repository or ClassroomRepository()
        self.lesson_repository = lesson_repository or LessonRepository()
        self.ai_service = ai_service or AIService()

    def list_quizzes(self, db: Session) -> list[Quiz]:
        return self.quiz_repository.list_all(db)

    def list_for_classroom(
        self, db: Session, classroom_id: int, published_only: bool = False
    ) -> list[Quiz]:
        return self.quiz_repository.list_for_classroom(
            db, classroom_id, published_only=published_only
        )

    def get_quiz(self, db: Session, quiz_id: int) -> Quiz:
        quiz = self.quiz_repository.get_by_id(db, quiz_id)
        if quiz is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
        return quiz

    def create_quiz(
        self,
        db: Session,
        payload: QuizCreate,
        *,
        actor_user: User,
        use_ai: bool = False,
    ) -> Quiz:
        if actor_user.role != "teacher":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can create quizzes")

        classroom = self.classroom_repository.get_by_id(db, payload.classroom_id)
        if classroom is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
        if classroom.teacher_id != actor_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the classroom teacher can create quizzes",
            )

        questions = payload.questions
        title = payload.title

        if use_ai and payload.lesson_id:
            lesson = self.lesson_repository.get_by_id(db, payload.lesson_id)
            if lesson is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

            # Look up existing concepts for this lesson to pass to the AI
            concept_names = [
                c.name
                for c in db.query(Concept.name)
                .filter(Concept.lesson_id == lesson.id)
                .all()
            ]

            try:
                questions = self.ai_service.generate_quiz(
                    lesson_title=lesson.title,
                    lesson_body=lesson.body or "",
                    difficulty=payload.difficulty,
                    num_questions=5,
                    quiz_type=payload.quiz_type,
                    concept_names=concept_names or None,
                )
                title = f"Quiz: {lesson.title}"

                # Resolve concept_tags names to concept IDs for each question
                if concept_names:
                    name_to_id = {
                        c.name: c.id
                        for c in db.query(Concept)
                        .filter(
                            Concept.classroom_id == payload.classroom_id,
                            Concept.name.in_(concept_names),
                        )
                        .all()
                    }
                    for q in questions:
                        tags = q.get("concept_tags", [])
                        q["concept_ids"] = [
                            name_to_id[t] for t in tags if t in name_to_id
                        ]
            except Exception as exc:
                logger.exception("AI quiz generation failed")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"AI quiz generation failed: {exc}",
                )

        return self.quiz_repository.create(
            db,
            classroom_id=payload.classroom_id,
            lesson_id=payload.lesson_id,
            title=title,
            difficulty=payload.difficulty,
            quiz_type=payload.quiz_type,
            questions=questions,
            created_by_user_id=actor_user.id,
        )

    def update_quiz(self, db: Session, quiz_id: int, payload, *, actor_user: User) -> Quiz:
        """Update quiz content (title, difficulty, type, questions). Teacher-only."""
        quiz = self.get_quiz(db, quiz_id)
        classroom = self.classroom_repository.get_by_id(db, quiz.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return self.quiz_repository.update(db, quiz, **payload.model_dump(exclude_unset=True))

    def publish_quiz(self, db: Session, quiz_id: int, *, actor_user: User) -> Quiz:
        quiz = self.get_quiz(db, quiz_id)
        classroom = self.classroom_repository.get_by_id(db, quiz.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return self.quiz_repository.publish(db, quiz)

    def unpublish_quiz(self, db: Session, quiz_id: int, *, actor_user: User) -> Quiz:
        quiz = self.get_quiz(db, quiz_id)
        classroom = self.classroom_repository.get_by_id(db, quiz.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        return self.quiz_repository.unpublish(db, quiz)

    def delete_quiz(self, db: Session, quiz_id: int, *, actor_user: User) -> None:
        quiz = self.get_quiz(db, quiz_id)
        classroom = self.classroom_repository.get_by_id(db, quiz.classroom_id)
        if classroom is None or classroom.teacher_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        self.quiz_repository.delete(db, quiz)

    def create_self_quiz(
        self,
        db: Session,
        lesson_id: int,
        *,
        actor_user: User,
        difficulty: str = "medium",
        quiz_type: str = "standard",
        num_questions: int = 5,
    ) -> Quiz:
        """Create a student self-assessment quiz for a published lesson."""
        if actor_user.role != "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Only students can create self-quizzes"
            )

        lesson = self.lesson_repository.get_by_id(db, lesson_id)
        if lesson is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

        if not lesson.published_at:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Lesson must be published to create a self-quiz"
            )

        # Verify student is enrolled in the classroom
        enrollment = (
            db.query(ClassroomEnrollment)
            .filter(
                ClassroomEnrollment.classroom_id == lesson.classroom_id,
                ClassroomEnrollment.student_id == actor_user.id,
            )
            .first()
        )
        if enrollment is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You are not enrolled in this classroom"
            )

        # Get concept names to pass to AI
        concept_names = [
            c.name
            for c in db.query(Concept.name)
            .filter(Concept.lesson_id == lesson.id)
            .all()
        ]

        # Generate quiz
        try:
            questions = self.ai_service.generate_quiz(
                lesson_title=lesson.title,
                lesson_body=lesson.body or "",
                difficulty=difficulty,
                num_questions=num_questions,
                quiz_type=quiz_type,
                concept_names=concept_names or None,
            )
        except Exception as exc:
            logger.exception("AI quiz generation failed for self-quiz")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI quiz generation failed: {exc}",
            )

        # Save quiz as private (not published)
        quiz = self.quiz_repository.create(
            db,
            classroom_id=lesson.classroom_id,
            lesson_id=lesson.id,
            title=f"Practice: {lesson.title}",
            difficulty=difficulty,
            quiz_type=quiz_type,
            questions=questions,
            created_by_user_id=actor_user.id,
        )

        logger.info(f"Created self-quiz {quiz.id} for student {actor_user.id} on lesson {lesson_id}")
        return quiz
