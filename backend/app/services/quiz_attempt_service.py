from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.quiz_attempt import QuizAttempt
from app.models.user import User
from app.repositories.gamification_repository import GamificationRepository
from app.repositories.quiz_attempt_repository import QuizAttemptRepository
from app.repositories.quiz_repository import QuizRepository
from app.services.analytics import AnalyticsService
from app.services.knowledge_graph import KnowledgeGraphService

logger = logging.getLogger(__name__)

XP_PER_CORRECT = 10
XP_PERFECT_BONUS = 20
MAX_HINT_LEVELS = 3
HINT_PENALTY_STEP = 0.25
MIN_HINT_CREDIT = 0.25


def _coerce_hints_used(raw_hint_value: Any) -> int:
    try:
        return max(int(raw_hint_value or 0), 0)
    except (TypeError, ValueError):
        return 0


def _normalize_hints_used(hints_used: int, available_hints: int) -> int:
    if available_hints <= 0:
        return 0
    return min(hints_used, available_hints, MAX_HINT_LEVELS)


def _credit_for_hint_usage(hints_used: int) -> float:
    return round(
        max(MIN_HINT_CREDIT, 1.0 - (HINT_PENALTY_STEP * min(hints_used, MAX_HINT_LEVELS))),
        2,
    )


def _xp_for_credit(credit_earned: float) -> int:
    return int((XP_PER_CORRECT * credit_earned) + 0.5)


def _extract_answer_detail(
    raw,
) -> tuple[str, int | None, str | None, dict | None, int]:
    """Extract selected_answer + metacognition fields from an answer entry.

    The answer can be a plain string, a raw dict, or a Pydantic AnswerDetail model.
    Returns (selected_answer, confidence_level, reasoning_text, reasoning_steps, hints_used).
    """
    if isinstance(raw, str):
        return raw, None, None, None, 0
    # Handle both Pydantic models (from FastAPI) and raw dicts (from tests/curl)
    if hasattr(raw, "selected_answer"):
        selected = raw.selected_answer
        confidence = raw.confidence_level
        reasoning_text = raw.reasoning_text
        reasoning_steps = raw.reasoning_steps
        hints_used = _coerce_hints_used(getattr(raw, "hints_used", 0))
    else:
        selected = raw.get("selected_answer", "")
        confidence = raw.get("confidence_level")
        reasoning_text = raw.get("reasoning_text")
        reasoning_steps = raw.get("reasoning_steps")
        hints_used = _coerce_hints_used(raw.get("hints_used"))
    return selected, confidence, reasoning_text, reasoning_steps, hints_used


def _calculate_calibration(responses_data: list[tuple[bool, int | None]]) -> float | None:
    """Calculate calibration score: how well confidence predicts correctness.

    Maps confidence 1-5 to expected accuracy 0.0-1.0, then compares to actual.
    Returns a score from 0.0 (poor calibration) to 1.0 (perfect calibration),
    or None if no confidence data was provided.
    """
    rated = [(correct, conf) for correct, conf in responses_data if conf is not None]
    if not rated:
        return None

    confidence_to_expected = {1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0}
    total_error = 0.0
    for is_correct, confidence in rated:
        expected = confidence_to_expected.get(confidence, 0.5)
        actual = 1.0 if is_correct else 0.0
        total_error += abs(expected - actual)

    return round(1.0 - (total_error / len(rated)), 3)


class QuizAttemptService:
    def __init__(
        self,
        quiz_repo: Optional[QuizRepository] = None,
        attempt_repo: Optional[QuizAttemptRepository] = None,
        gamification_repo: Optional[GamificationRepository] = None,
        analytics_service: Optional[AnalyticsService] = None,
        knowledge_graph_service: Optional[KnowledgeGraphService] = None,
    ) -> None:
        self.quiz_repo = quiz_repo or QuizRepository()
        self.attempt_repo = attempt_repo or QuizAttemptRepository()
        self.gamification_repo = gamification_repo or GamificationRepository()
        self.analytics = analytics_service or AnalyticsService()
        self.kg = knowledge_graph_service or KnowledgeGraphService()

    def submit_attempt(
        self,
        db: Session,
        *,
        quiz_id: int,
        answers: dict[str, str | dict[str, Any]],
        actor_user: User,
        time_taken_seconds: Optional[int] = None,
        reflection: Optional[str] = None,
        self_rated_understanding: Optional[int] = None,
    ) -> QuizAttempt:
        """Submit a quiz attempt: score it, save responses, award XP and badges."""
        if actor_user.role != "student":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can take quizzes")

        quiz = self.quiz_repo.get_by_id(db, quiz_id)
        if quiz is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
        # Allow unpublished quizzes only for the student who created them (self-assessment quizzes).
        if not quiz.is_published and quiz.created_by_user_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Quiz is not published")

        questions = quiz.questions or []
        max_score = len(questions)
        score = 0.0
        total_xp = 0
        calibration_data: list[tuple[bool, int | None]] = []
        total_hints_used = 0
        hinted_questions = 0

        # Create the attempt
        attempt = self.attempt_repo.create(
            db,
            quiz_id=quiz_id,
            student_id=actor_user.id,
            score=0.0,
            max_score=max_score,
            time_taken_seconds=time_taken_seconds,
            difficulty_snapshot=quiz.difficulty,
        )

        # Score each question and create responses
        concept_mastery_updates: list[tuple[int, bool, int | None, int, float]] = []

        for idx, question in enumerate(questions):
            raw_answer = answers.get(str(idx), "")
            selected, confidence, reasoning_text, reasoning_steps, raw_hints_used = _extract_answer_detail(raw_answer)

            correct_answer = (question.get("correct_answer") or "").strip()
            is_correct = (selected or "").strip() == correct_answer
            hints_used = _normalize_hints_used(
                raw_hints_used,
                len(question.get("hints") or []),
            )
            credit_earned = _credit_for_hint_usage(hints_used) if is_correct else 0.0
            xp = _xp_for_credit(credit_earned) if is_correct else 0

            if is_correct:
                score += credit_earned
                total_xp += xp
            if hints_used > 0:
                total_hints_used += hints_used
                hinted_questions += 1

            calibration_data.append((is_correct, confidence))

            self.attempt_repo.add_response(
                db,
                attempt_id=attempt.id,
                question_index=idx,
                question_payload=question,
                selected_answer=selected,
                is_correct=is_correct,
                awarded_xp=xp,
                hints_used=hints_used,
                confidence_level=confidence,
                reasoning_text=reasoning_text,
                reasoning_steps=reasoning_steps,
            )

            # Collect concept mastery updates for this question
            for cid in question.get("concept_ids", []):
                concept_mastery_updates.append(
                    (cid, is_correct, confidence, hints_used, credit_earned)
                )

        # Snapshot mastery before updates for the diff panel
        unique_concept_ids = list({cid for cid, *_ in concept_mastery_updates})
        mastery_before_map: dict[int, float] = {}
        if unique_concept_ids:
            from app.models.concept import Concept, StudentConceptMastery as SCM
            pre_rows = (
                db.query(SCM)
                .filter(
                    SCM.student_id == actor_user.id,
                    SCM.concept_id.in_(unique_concept_ids),
                )
                .all()
            )
            mastery_before_map = {r.concept_id: r.mastery_score for r in pre_rows}

        # Update concept mastery from quiz responses
        for concept_id, is_correct, confidence, hints_used, credit_earned in concept_mastery_updates:
            try:
                self.kg.update_mastery(
                    db,
                    student_id=actor_user.id,
                    concept_id=concept_id,
                    is_correct=is_correct,
                    confidence=confidence,
                    attempt_id=attempt.id,
                    hints_used=hints_used,
                    credit_earned=credit_earned,
                )
            except Exception:
                logger.warning("Failed to update mastery for concept %d", concept_id, exc_info=True)

        # Build concept deltas (snapshot after vs before) with concept names
        concept_deltas: list[dict] = []
        if unique_concept_ids:
            from app.models.concept import Concept, StudentConceptMastery as SCM
            concept_name_map = {
                c.id: c.name
                for c in db.query(Concept).filter(Concept.id.in_(unique_concept_ids)).all()
            }
            post_rows = (
                db.query(SCM)
                .filter(
                    SCM.student_id == actor_user.id,
                    SCM.concept_id.in_(unique_concept_ids),
                )
                .all()
            )
            mastery_after_map = {r.concept_id: r.mastery_score for r in post_rows}
            for cid in unique_concept_ids:
                before = round(mastery_before_map.get(cid, 0.0), 3)
                after = round(mastery_after_map.get(cid, 0.0), 3)
                concept_deltas.append(
                    {
                        "concept_id": cid,
                        "concept_name": concept_name_map.get(cid, f"Concept {cid}"),
                        "mastery_before": before,
                        "mastery_after": after,
                        "delta": round(after - before, 3),
                    }
                )

        score = round(score, 2)
        perfect_attempt = max_score > 0 and score == float(max_score)

        # Perfect score bonus
        if perfect_attempt:
            total_xp += XP_PERFECT_BONUS

        # Update attempt score and reflection
        attempt.score = score
        attempt.reflection = reflection
        attempt.self_rated_understanding = self_rated_understanding

        # Award XP
        if total_xp > 0:
            self.gamification_repo.add_xp(
                db,
                user_id=actor_user.id,
                classroom_id=quiz.classroom_id,
                xp=total_xp,
            )

        # Update streak
        self.gamification_repo.update_streak(
            db,
            user_id=actor_user.id,
            classroom_id=quiz.classroom_id,
        )

        # Award badges
        if perfect_attempt:
            self.gamification_repo.add_badge(
                db,
                user_id=actor_user.id,
                classroom_id=quiz.classroom_id,
                badge="perfect_score",
            )

        # Check for first quiz badge
        previous_attempts = self.attempt_repo.list_for_student(db, actor_user.id)
        if len(previous_attempts) <= 1:
            self.gamification_repo.add_badge(
                db,
                user_id=actor_user.id,
                classroom_id=quiz.classroom_id,
                badge="first_quiz",
            )

        # Metacognition badges
        calibration_score = _calculate_calibration(calibration_data)
        if calibration_score is not None and calibration_score >= 0.75:
            self.gamification_repo.add_badge(
                db,
                user_id=actor_user.id,
                classroom_id=quiz.classroom_id,
                badge="good_calibration",
            )

        # Growth mindset: improved score on a quiz retry
        past_attempts = self.attempt_repo.list_for_student(db, actor_user.id, quiz_id=quiz_id)
        if len(past_attempts) > 1:
            previous_best = max(a.score or 0.0 for a in past_attempts if a.id != attempt.id)
            if score > previous_best:
                self.gamification_repo.add_badge(
                    db,
                    user_id=actor_user.id,
                    classroom_id=quiz.classroom_id,
                    badge="growth_mindset",
                )

        # Reflective learner: 5+ reflections across all attempts
        if reflection:
            all_attempts = self.attempt_repo.list_for_student(db, actor_user.id)
            reflection_count = sum(1 for a in all_attempts if a.reflection)
            if reflection_count >= 5:
                self.gamification_repo.add_badge(
                    db,
                    user_id=actor_user.id,
                    classroom_id=quiz.classroom_id,
                    badge="reflective_learner",
                )

        # Log analytics events
        self.analytics.log_event(
            db,
            user_id=actor_user.id,
            classroom_id=quiz.classroom_id,
            event_type="quiz_attempt_completed",
            payload={
                "quiz_id": quiz_id,
                "attempt_id": attempt.id,
                "score": score,
                "max_score": max_score,
                "percentage": round((score / max_score) * 100, 1) if max_score else 0,
                "time_taken_seconds": time_taken_seconds,
                "xp_earned": total_xp,
                "hinted_questions": hinted_questions,
                "total_hints_used": total_hints_used,
                "calibration_score": calibration_score,
                "has_reflection": reflection is not None,
            },
        )

        db.commit()
        db.refresh(attempt)

        # Attach transient attributes for the response
        attempt._calibration_score = calibration_score
        attempt._concept_deltas = concept_deltas or []
        return attempt

    def get_attempt(self, db: Session, attempt_id: int) -> QuizAttempt:
        attempt = self.attempt_repo.get_by_id(db, attempt_id)
        if attempt is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
        return attempt

    def update_reflection(
        self,
        db: Session,
        attempt_id: int,
        *,
        actor_user: User,
        reflection: Optional[str] = None,
        self_rated_understanding: Optional[int] = None,
    ) -> QuizAttempt:
        attempt = self.get_attempt(db, attempt_id)
        if attempt.student_id != actor_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your attempt")
        if reflection is not None:
            attempt.reflection = reflection
        if self_rated_understanding is not None:
            attempt.self_rated_understanding = self_rated_understanding
        db.commit()
        db.refresh(attempt)

        # Check reflective_learner badge
        if reflection:
            all_attempts = self.attempt_repo.list_for_student(db, actor_user.id)
            reflection_count = sum(1 for a in all_attempts if a.reflection)
            if reflection_count >= 5:
                quiz = self.quiz_repo.get_by_id(db, attempt.quiz_id)
                if quiz:
                    self.gamification_repo.add_badge(
                        db,
                        user_id=actor_user.id,
                        classroom_id=quiz.classroom_id,
                        badge="reflective_learner",
                    )
                    db.commit()

        return attempt

    def list_student_attempts(
        self, db: Session, student_id: int, *, quiz_id: Optional[int] = None
    ) -> list[QuizAttempt]:
        return self.attempt_repo.list_for_student(db, student_id, quiz_id=quiz_id)
