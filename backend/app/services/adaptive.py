"""
Adaptive Learning Service – EduNexus

Adjusts quiz difficulty based on student performance using a threshold-based
algorithm. Tracks per-student difficulty level and informs quiz generation.
"""

from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.quiz_attempt import QuizAttempt
from app.models.quiz_response import QuizResponse
from app.models.quiz import Quiz

logger = logging.getLogger(__name__)

DIFFICULTY_LEVELS = ["easy", "medium", "hard"]
ACCURACY_INCREASE_THRESHOLD = 0.80  # > 80% → increase difficulty
ACCURACY_DECREASE_THRESHOLD = 0.40  # < 40% → decrease difficulty
RECENT_WINDOW = 5  # number of recent attempts to consider


class AdaptiveService:
    def get_recommended_difficulty(
        self,
        db: Session,
        *,
        student_id: int,
        classroom_id: int,
    ) -> str:
        """Recommend a difficulty level based on the student's recent performance.

        Uses a simple threshold-based algorithm:
        - If recent accuracy > 80%: increase difficulty
        - If recent accuracy < 40%: decrease difficulty
        - Otherwise: maintain current difficulty
        """
        recent_attempts = (
            db.query(QuizAttempt)
            .join(Quiz, Quiz.id == QuizAttempt.quiz_id)
            .filter(
                QuizAttempt.student_id == student_id,
                Quiz.classroom_id == classroom_id,
                QuizAttempt.score.isnot(None),
            )
            .order_by(QuizAttempt.started_at.desc())
            .limit(RECENT_WINDOW)
            .all()
        )

        if not recent_attempts:
            return "medium"

        total_score = sum(a.score or 0 for a in recent_attempts)
        total_max = sum(a.max_score or 0 for a in recent_attempts)

        if total_max == 0:
            return "medium"

        accuracy = total_score / total_max
        current_difficulty = recent_attempts[0].difficulty_snapshot or "medium"

        try:
            current_idx = DIFFICULTY_LEVELS.index(current_difficulty)
        except ValueError:
            current_idx = 1  # default to medium

        if accuracy > ACCURACY_INCREASE_THRESHOLD and current_idx < len(DIFFICULTY_LEVELS) - 1:
            recommended = DIFFICULTY_LEVELS[current_idx + 1]
            logger.info(
                "Student %d accuracy %.0f%% > threshold, recommending %s (up from %s)",
                student_id, accuracy * 100, recommended, current_difficulty,
            )
            return recommended

        if accuracy < ACCURACY_DECREASE_THRESHOLD and current_idx > 0:
            recommended = DIFFICULTY_LEVELS[current_idx - 1]
            logger.info(
                "Student %d accuracy %.0f%% < threshold, recommending %s (down from %s)",
                student_id, accuracy * 100, recommended, current_difficulty,
            )
            return recommended

        return current_difficulty

    def generate_feedback(
        self,
        db: Session,
        *,
        attempt_id: int,
    ) -> dict:
        """Generate per-attempt feedback summary based on responses.

        Returns a feedback dict suitable for storing in quiz_attempts.feedback JSONB.
        """
        attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
        if not attempt:
            return {}

        responses = (
            db.query(QuizResponse)
            .filter(QuizResponse.attempt_id == attempt_id)
            .order_by(QuizResponse.question_index)
            .all()
        )

        if not responses:
            return {}

        correct_count = sum(1 for r in responses if r.is_correct)
        total = len(responses)
        accuracy = correct_count / total if total else 0

        # Identify weak areas (incorrect questions)
        weak_questions = [
            {
                "question_index": r.question_index,
                "question": r.question_payload.get("question", ""),
                "correct_answer": r.question_payload.get("correct_answer", ""),
                "student_answer": r.selected_answer,
                "explanation": r.question_payload.get("explanation", ""),
            }
            for r in responses
            if not r.is_correct
        ]

        # Confidence analysis
        rated = [r for r in responses if r.confidence_level is not None]
        overconfident = [r for r in rated if r.confidence_level >= 4 and not r.is_correct]
        underconfident = [r for r in rated if r.confidence_level <= 2 and r.is_correct]

        feedback = {
            "accuracy": round(accuracy * 100, 1),
            "correct": correct_count,
            "total": total,
            "weak_questions": weak_questions,
            "recommendation": (
                "Great work! Consider trying harder questions."
                if accuracy > ACCURACY_INCREASE_THRESHOLD
                else "Keep practicing — focus on the areas below."
                if accuracy < ACCURACY_DECREASE_THRESHOLD
                else "Good progress! Review the missed questions for improvement."
            ),
        }

        if overconfident:
            feedback["calibration_note"] = (
                f"You were confident but incorrect on {len(overconfident)} question(s). "
                "Consider reviewing these topics more carefully."
            )
        if underconfident:
            feedback["positive_note"] = (
                f"You got {len(underconfident)} question(s) right despite low confidence — "
                "trust your knowledge more!"
            )

        return feedback
