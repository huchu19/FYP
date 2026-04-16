from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.models.quiz_attempt import QuizAttempt
from app.models.quiz_response import QuizResponse


class QuizAttemptRepository:
    def get_by_id(self, db: Session, attempt_id: int) -> Optional[QuizAttempt]:
        return db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()

    def list_for_student(
        self, db: Session, student_id: int, *, quiz_id: Optional[int] = None
    ) -> list[QuizAttempt]:
        q = db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id)
        if quiz_id is not None:
            q = q.filter(QuizAttempt.quiz_id == quiz_id)
        return q.order_by(QuizAttempt.id.desc()).all()

    def list_for_quiz(self, db: Session, quiz_id: int) -> list[QuizAttempt]:
        return (
            db.query(QuizAttempt)
            .filter(QuizAttempt.quiz_id == quiz_id)
            .order_by(QuizAttempt.id.desc())
            .all()
        )

    def create(
        self,
        db: Session,
        *,
        quiz_id: int,
        student_id: int,
        score: float,
        max_score: int,
        time_taken_seconds: Optional[int] = None,
        difficulty_snapshot: Optional[str] = None,
    ) -> QuizAttempt:
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            student_id=student_id,
            score=score,
            max_score=max_score,
            time_taken_seconds=time_taken_seconds,
            difficulty_snapshot=difficulty_snapshot,
        )
        db.add(attempt)
        db.flush()  # Get the ID without committing yet
        return attempt

    def add_response(
        self,
        db: Session,
        *,
        attempt_id: int,
        question_index: int,
        question_payload: dict,
        selected_answer: str,
        is_correct: bool,
        awarded_xp: int = 0,
        hints_used: int = 0,
        confidence_level: int | None = None,
        reasoning_text: str | None = None,
        reasoning_steps: dict | None = None,
    ) -> QuizResponse:
        response = QuizResponse(
            attempt_id=attempt_id,
            question_index=question_index,
            question_payload=question_payload,
            selected_answer=selected_answer,
            is_correct=is_correct,
            awarded_xp=awarded_xp,
            hints_used=hints_used,
            confidence_level=confidence_level,
            reasoning_text=reasoning_text,
            reasoning_steps=reasoning_steps,
        )
        db.add(response)
        return response

    def get_responses(self, db: Session, attempt_id: int) -> list[QuizResponse]:
        return (
            db.query(QuizResponse)
            .filter(QuizResponse.attempt_id == attempt_id)
            .order_by(QuizResponse.question_index)
            .all()
        )
