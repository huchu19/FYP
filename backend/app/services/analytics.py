"""
Analytics Service – EduNexus

Aggregates and queries learning analytics data for teacher and student dashboards.
Also provides event logging to the analytics_events table.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.analytics_event import AnalyticsEvent
from app.models.classroom_enrollment import ClassroomEnrollment
from app.models.gamification import Gamification
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz_response import QuizResponse
from app.models.quiz import Quiz
from app.models.user import User

logger = logging.getLogger(__name__)


class AnalyticsService:
    # -----------------------------------------------------------------
    # Event logging
    # -----------------------------------------------------------------

    def log_event(
        self,
        db: Session,
        *,
        user_id: int | None,
        classroom_id: int | None,
        event_type: str,
        payload: dict[str, Any] | None = None,
    ) -> AnalyticsEvent:
        """Write a typed event to the analytics_events table."""
        event = AnalyticsEvent(
            user_id=user_id,
            classroom_id=classroom_id,
            event_type=event_type,
            payload=payload or {},
        )
        db.add(event)
        db.flush()
        return event

    # -----------------------------------------------------------------
    # Student dashboard queries
    # -----------------------------------------------------------------

    def student_quiz_history(
        self, db: Session, student_id: int, *, classroom_id: int | None = None
    ) -> list[dict[str, Any]]:
        """Score trends over time for a student."""
        q = db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id)
        if classroom_id:
            q = q.join(Quiz, Quiz.id == QuizAttempt.quiz_id).filter(
                Quiz.classroom_id == classroom_id
            )
        attempts = q.order_by(QuizAttempt.started_at).all()
        return [
            {
                "attempt_id": a.id,
                "quiz_id": a.quiz_id,
                "score": a.score,
                "max_score": a.max_score,
                "percentage": round((a.score / a.max_score) * 100, 1) if a.max_score else 0,
                "time_taken_seconds": a.time_taken_seconds,
                "reflection": a.reflection,
                "self_rated_understanding": a.self_rated_understanding,
                "started_at": a.started_at.isoformat() if a.started_at else None,
            }
            for a in attempts
        ]

    def student_calibration_score(
        self, db: Session, student_id: int
    ) -> dict[str, Any]:
        """Overall confidence calibration for a student across all attempts."""
        responses = (
            db.query(QuizResponse)
            .join(QuizAttempt, QuizAttempt.id == QuizResponse.attempt_id)
            .filter(QuizAttempt.student_id == student_id)
            .filter(QuizResponse.confidence_level.isnot(None))
            .all()
        )
        if not responses:
            return {"calibration_score": None, "total_rated": 0}

        confidence_to_expected = {1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0}
        total_error = 0.0
        for r in responses:
            expected = confidence_to_expected.get(r.confidence_level, 0.5)
            actual = 1.0 if r.is_correct else 0.0
            total_error += abs(expected - actual)

        calibration = round(1.0 - (total_error / len(responses)), 3)
        return {"calibration_score": calibration, "total_rated": len(responses)}

    def student_topic_mastery(
        self, db: Session, student_id: int
    ) -> list[dict[str, Any]]:
        """Per-quiz-title accuracy breakdown as a proxy for topic mastery."""
        results = (
            db.query(
                Quiz.title,
                func.count(QuizResponse.id).label("total_questions"),
                func.sum(case((QuizResponse.is_correct == True, 1), else_=0)).label("correct"),  # noqa: E712
            )
            .join(QuizAttempt, QuizAttempt.quiz_id == Quiz.id)
            .join(QuizResponse, QuizResponse.attempt_id == QuizAttempt.id)
            .filter(QuizAttempt.student_id == student_id)
            .group_by(Quiz.title)
            .all()
        )
        return [
            {
                "topic": r.title,
                "total_questions": r.total_questions,
                "correct": int(r.correct or 0),
                "accuracy": round((int(r.correct or 0) / r.total_questions) * 100, 1)
                if r.total_questions
                else 0,
            }
            for r in results
        ]

    # -----------------------------------------------------------------
    # Teacher dashboard queries
    # -----------------------------------------------------------------

    def class_summary(
        self, db: Session, classroom_id: int
    ) -> dict[str, Any]:
        """Aggregated class-level stats for a teacher dashboard."""
        attempts = (
            db.query(QuizAttempt)
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .filter(Quiz.classroom_id == classroom_id)
            .all()
        )
        if not attempts:
            return {
                "total_attempts": 0,
                "avg_score_pct": 0,
                "unique_students": 0,
            }

        total_pct = sum(
            (a.score / a.max_score * 100) if a.max_score else 0 for a in attempts
        )
        unique_students = len({a.student_id for a in attempts})
        return {
            "total_attempts": len(attempts),
            "avg_score_pct": round(total_pct / len(attempts), 1),
            "unique_students": unique_students,
        }

    def student_process_data(
        self, db: Session, student_id: int, quiz_id: int
    ) -> list[dict[str, Any]]:
        """Per-question process data for a student's attempts at a quiz.

        Returns time spent, answer changes, reasoning — for teacher inspection.
        """
        responses = (
            db.query(QuizResponse)
            .join(QuizAttempt, QuizAttempt.id == QuizResponse.attempt_id)
            .filter(
                QuizAttempt.student_id == student_id,
                QuizAttempt.quiz_id == quiz_id,
            )
            .order_by(QuizAttempt.started_at, QuizResponse.question_index)
            .all()
        )
        return [
            {
                "attempt_id": r.attempt_id,
                "question_index": r.question_index,
                "selected_answer": r.selected_answer,
                "is_correct": r.is_correct,
                "hints_used": r.hints_used,
                "confidence_level": r.confidence_level,
                "reasoning_text": r.reasoning_text,
                "reasoning_steps": r.reasoning_steps,
            }
            for r in responses
        ]

    def classroom_students_summary(
        self, db: Session, classroom_id: int
    ) -> list[dict[str, Any]]:
        """Per-student summary for a classroom: attempts, avg score, XP, streak, badges."""
        enrollments = (
            db.query(ClassroomEnrollment, User)
            .join(User, User.id == ClassroomEnrollment.student_id)
            .filter(ClassroomEnrollment.classroom_id == classroom_id)
            .all()
        )
        quiz_ids_sub = db.query(Quiz.id).filter(Quiz.classroom_id == classroom_id)

        results = []
        for enrollment, student in enrollments:
            attempts = (
                db.query(QuizAttempt)
                .filter(
                    QuizAttempt.student_id == student.id,
                    QuizAttempt.quiz_id.in_(quiz_ids_sub),
                )
                .all()
            )
            total_attempts = len(attempts)
            avg_pct = 0.0
            if total_attempts:
                avg_pct = round(
                    sum(
                        (a.score / a.max_score * 100) if a.max_score else 0
                        for a in attempts
                    )
                    / total_attempts,
                    1,
                )

            gam = (
                db.query(Gamification)
                .filter(
                    Gamification.user_id == student.id,
                    Gamification.classroom_id == classroom_id,
                )
                .first()
            )

            results.append(
                {
                    "student_id": student.id,
                    "name": student.name,
                    "email": student.email,
                    "total_attempts": total_attempts,
                    "avg_score_pct": avg_pct,
                    "xp": gam.xp if gam else 0,
                    "streak_days": gam.streak_days if gam else 0,
                    "badges": gam.badges if gam else [],
                    "joined_at": enrollment.joined_at.isoformat() if enrollment.joined_at else None,
                }
            )

        return results
