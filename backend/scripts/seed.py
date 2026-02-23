"""
Seed the database with sample data.

Usage:
    cd backend
    python scripts/seed.py
"""

import os
import sys
from datetime import datetime

from sqlalchemy import text

# Allow script execution with `python scripts/seed.py`
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.analytics_event import AnalyticsEvent  # noqa: E402
from app.models.classroom_enrollment import ClassroomEnrollment  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.models.classroom import Classroom  # noqa: E402
from app.models.gamification import Gamification  # noqa: E402
from app.models.lesson import Lesson  # noqa: E402
from app.models.quiz import Quiz  # noqa: E402
from app.models.quiz_attempt import QuizAttempt  # noqa: E402
from app.models.quiz_response import QuizResponse  # noqa: E402
from app.models.user import User  # noqa: E402


def seed() -> None:
    db = SessionLocal()
    try:
        db.execute(
            text(
                "TRUNCATE TABLE gamification, quizzes, lessons, classrooms, users, "
                "quiz_responses, quiz_attempts, classroom_enrollments, analytics_events "
                "RESTART IDENTITY CASCADE"
            )
        )

        teacher = User(
            name="Teacher One",
            email="teacher@example.com",
            role="teacher",
            password_hash="dev_teacher_hash",
            is_active=True,
        )
        student = User(
            name="Student One",
            email="student@example.com",
            role="student",
            password_hash="dev_student_hash",
            is_active=True,
        )
        db.add_all([teacher, student])
        db.flush()

        classroom = Classroom(
            name="Algebra 101",
            code="ALG101",
            teacher_id=teacher.id,
            description="Intro to algebra",
        )
        db.add(classroom)
        db.flush()

        lesson = Lesson(
            classroom_id=classroom.id,
            title="Linear Equations",
            prompt="Teach solving linear equations",
            outline=["variables", "balancing", "examples"],
            body="Lesson body text goes here.",
            status="published",
            generated_by_ai=True,
            created_by_user_id=teacher.id,
        )
        db.add(lesson)
        db.flush()

        quiz = Quiz(
            classroom_id=classroom.id,
            title="Linear Equations Quiz",
            difficulty="easy",
            lesson_id=lesson.id,
            questions=[
                {"q": "Solve 2x=6", "choices": ["2", "3", "4"], "answer": "3"},
                {"q": "Solve x+4=9", "choices": ["4", "5", "6"], "answer": "5"},
            ],
            is_published=True,
            created_by_user_id=teacher.id,
        )
        db.add(quiz)
        db.flush()

        db.add(
            ClassroomEnrollment(
                classroom_id=classroom.id,
                student_id=student.id,
            )
        )

        attempt = QuizAttempt(
            quiz_id=quiz.id,
            student_id=student.id,
            score=2,
            max_score=2,
            time_taken_seconds=120,
            difficulty_snapshot="easy",
            feedback={"message": "Great work"},
        )
        db.add(attempt)
        db.flush()

        db.add_all(
            [
                QuizResponse(
                    attempt_id=attempt.id,
                    question_index=0,
                    question_payload={"q": "Solve 2x=6"},
                    selected_answer="3",
                    is_correct=True,
                    awarded_xp=10,
                ),
                QuizResponse(
                    attempt_id=attempt.id,
                    question_index=1,
                    question_payload={"q": "Solve x+4=9"},
                    selected_answer="5",
                    is_correct=True,
                    awarded_xp=10,
                ),
            ]
        )

        db.add_all(
            [
                Gamification(
                    user_id=teacher.id,
                    classroom_id=classroom.id,
                    xp=100,
                    badges=["mentor"],
                    streak_days=5,
                ),
                Gamification(
                    user_id=student.id,
                    classroom_id=classroom.id,
                    xp=20,
                    badges=["rookie"],
                    streak_days=1,
                ),
                AnalyticsEvent(
                    user_id=student.id,
                    classroom_id=classroom.id,
                    event_type="quiz_completed",
                    payload={"quiz_id": quiz.id, "score": 2, "max_score": 2},
                ),
            ]
        )

        db.commit()
        print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Seed completed.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
