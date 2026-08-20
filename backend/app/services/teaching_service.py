"""
Peer Teaching Service – EduNexus

Students teach an AI "confused learner" (Alex) to deepen understanding.
After the conversation, the AI assesses teaching quality across four dimensions:
completeness, accuracy, clarity, and depth.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models.concept import Concept, StudentConceptMastery
from app.models.lesson import Lesson
from app.models.teaching_session import TeachingSession
from app.repositories.gamification_repository import GamificationRepository
from app.services.ai import AIService

logger = logging.getLogger(__name__)

MAX_TURNS = 20


class TeachingService:
    def __init__(self, ai_service: AIService | None = None) -> None:
        self.ai = ai_service or AIService()
        self.gamification = GamificationRepository()

    # -----------------------------------------------------------------
    # Start a session
    # -----------------------------------------------------------------

    def start_session(
        self,
        db: Session,
        *,
        student_id: int,
        lesson_id: int,
        concept_id: int | None = None,
    ) -> dict[str, Any]:
        """Create a teaching session and generate the learner's opening question."""
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if lesson is None:
            raise ValueError("Lesson not found")

        # Determine topic from concept or lesson title
        concept_description = ""
        if concept_id:
            concept = db.query(Concept).filter(Concept.id == concept_id).first()
            topic = concept.name if concept else lesson.title
            concept_description = (concept.description or "") if concept else ""
        else:
            topic = lesson.title

        # Generate the confused learner's opening line
        opening = self.ai.generate_learner_response(
            topic=topic,
            lesson_context=lesson.body or "",
            conversation=[],
            concept_description=concept_description,
        )

        conversation = [{"role": "learner", "content": opening}]

        session = TeachingSession(
            student_id=student_id,
            classroom_id=lesson.classroom_id,
            lesson_id=lesson_id,
            concept_id=concept_id,
            topic=topic,
            conversation=conversation,
            status="active",
            turn_count=1,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        return self._session_to_dict(session)

    # -----------------------------------------------------------------
    # Send a message (student speaks, learner responds)
    # -----------------------------------------------------------------

    def send_message(
        self,
        db: Session,
        *,
        session_id: int,
        student_id: int,
        message: str,
    ) -> dict[str, Any]:
        """Append the student's message and generate the learner's response."""
        session = self._get_session(db, session_id, student_id)

        if session.status != "active":
            raise ValueError("Session is not active")
        if session.turn_count >= MAX_TURNS:
            raise ValueError(f"Maximum turns ({MAX_TURNS}) reached. Please complete the session.")

        # Append student message
        conversation = list(session.conversation or [])
        conversation.append({"role": "student", "content": message})

        # Get lesson context for grounding
        lesson = db.query(Lesson).filter(Lesson.id == session.lesson_id).first()
        lesson_body = lesson.body if lesson else ""

        concept_description = ""
        if session.concept_id:
            concept = db.query(Concept).filter(Concept.id == session.concept_id).first()
            concept_description = (concept.description or "") if concept else ""

        # Generate learner response
        learner_reply = self.ai.generate_learner_response(
            topic=session.topic,
            lesson_context=lesson_body,
            conversation=conversation,
            concept_description=concept_description,
        )
        conversation.append({"role": "learner", "content": learner_reply})

        session.conversation = conversation
        session.turn_count = len([m for m in conversation if m["role"] == "student"])
        db.commit()
        db.refresh(session)

        return self._session_to_dict(session)

    # -----------------------------------------------------------------
    # Complete session (triggers assessment)
    # -----------------------------------------------------------------

    def complete_session(
        self,
        db: Session,
        *,
        session_id: int,
        student_id: int,
    ) -> dict[str, Any]:
        """End the session, run AI assessment, award XP and badges."""
        session = self._get_session(db, session_id, student_id)

        if session.status != "active":
            raise ValueError("Session is already completed or abandoned")

        student_messages = [m for m in (session.conversation or []) if m["role"] == "student"]
        if len(student_messages) < 2:
            raise ValueError("Please send at least 2 messages before completing the session.")

        # Run AI assessment
        concept_description = ""
        if session.concept_id:
            concept = db.query(Concept).filter(Concept.id == session.concept_id).first()
            concept_description = (concept.description or "") if concept else ""

        assessment = self.ai.assess_teaching_session(
            topic=session.topic,
            conversation=session.conversation,
            concept_description=concept_description,
        )

        session.assessment = assessment
        session.overall_score = float(assessment.get("overall_score", 0.5))
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)

        # Award XP: 25 base + up to 25 bonus based on score
        base_xp = 25
        bonus_xp = round(session.overall_score * 25)
        total_xp = base_xp + bonus_xp
        self.gamification.add_xp(
            db, user_id=student_id, classroom_id=session.classroom_id, xp=total_xp
        )

        # Award badges (returns the ones newly unlocked this session)
        badges_earned = self._award_badges(
            db, student_id=student_id, session=session, assessment=assessment
        )

        # Update concept mastery if concept_id is set
        if session.concept_id:
            self._update_concept_mastery(
                db,
                student_id=student_id,
                concept_id=session.concept_id,
                overall_score=session.overall_score,
            )

        # Update streak
        self.gamification.update_streak(
            db, user_id=student_id, classroom_id=session.classroom_id
        )

        db.commit()
        db.refresh(session)

        result = self._session_to_dict(session)
        result["xp_earned"] = total_xp
        result["badges_earned"] = badges_earned
        return result

    # -----------------------------------------------------------------
    # Read operations
    # -----------------------------------------------------------------

    def get_session(
        self,
        db: Session,
        *,
        session_id: int,
        user_id: int,
        user_role: str,
    ) -> dict[str, Any]:
        """Get a session by ID. Students can only see their own; teachers can see any."""
        if user_role == "teacher":
            session = db.query(TeachingSession).filter(TeachingSession.id == session_id).first()
        else:
            session = self._get_session(db, session_id, user_id)
        if session is None:
            raise ValueError("Session not found")
        return self._session_to_dict(session)

    def list_sessions(
        self,
        db: Session,
        *,
        student_id: int | None = None,
        classroom_id: int,
    ) -> list[dict[str, Any]]:
        """List teaching sessions for a classroom, optionally filtered by student."""
        query = db.query(TeachingSession).filter(
            TeachingSession.classroom_id == classroom_id
        )
        if student_id is not None:
            query = query.filter(TeachingSession.student_id == student_id)
        sessions = query.order_by(TeachingSession.created_at.desc()).all()
        return [
            {
                "id": s.id,
                "topic": s.topic,
                "status": s.status,
                "turn_count": s.turn_count,
                "overall_score": s.overall_score,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            }
            for s in sessions
        ]

    # -----------------------------------------------------------------
    # Internal helpers
    # -----------------------------------------------------------------

    @staticmethod
    def _get_session(db: Session, session_id: int, student_id: int) -> TeachingSession:
        session = (
            db.query(TeachingSession)
            .filter(
                TeachingSession.id == session_id,
                TeachingSession.student_id == student_id,
            )
            .first()
        )
        if session is None:
            raise ValueError("Session not found")
        return session

    @staticmethod
    def _session_to_dict(session: TeachingSession) -> dict[str, Any]:
        return {
            "id": session.id,
            "student_id": session.student_id,
            "classroom_id": session.classroom_id,
            "lesson_id": session.lesson_id,
            "concept_id": session.concept_id,
            "topic": session.topic,
            "conversation": session.conversation,
            "status": session.status,
            "turn_count": session.turn_count,
            "assessment": session.assessment,
            "overall_score": session.overall_score,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        }

    def _award_badges(
        self,
        db: Session,
        *,
        student_id: int,
        session: TeachingSession,
        assessment: dict[str, Any],
    ) -> list[str]:
        """Award eligible badges and return the ones newly unlocked this session."""
        classroom_id = session.classroom_id
        existing = set(self._current_badges(db, student_id=student_id, classroom_id=classroom_id))
        earned: list[str] = []

        def award(badge: str) -> None:
            if badge in existing:
                return
            self.gamification.add_badge(
                db, user_id=student_id, classroom_id=classroom_id, badge=badge
            )
            existing.add(badge)
            earned.append(badge)

        # first_teaching — first completed session
        completed_count = (
            db.query(TeachingSession)
            .filter(
                TeachingSession.student_id == student_id,
                TeachingSession.status == "completed",
            )
            .count()
        )
        if completed_count <= 1:  # This is the first (count includes current)
            award("first_teaching")

        # clear_explainer — clarity score >= 0.8
        if assessment.get("clarity", 0) >= 0.8:
            award("clear_explainer")

        # patient_teacher — at least 10 turns and overall >= 0.7
        if session.turn_count >= 10 and assessment.get("overall_score", 0) >= 0.7:
            award("patient_teacher")

        return earned

    def _current_badges(
        self,
        db: Session,
        *,
        student_id: int,
        classroom_id: int,
    ) -> list[str]:
        """Return the student's currently-held badges for this classroom."""
        rows = self.gamification.user_rows(
            db, user_id=student_id, classroom_id=classroom_id
        )
        return list(rows[0].badges) if rows and rows[0].badges else []

    @staticmethod
    def _update_concept_mastery(
        db: Session,
        *,
        student_id: int,
        concept_id: int,
        overall_score: float,
    ) -> None:
        """Boost concept mastery based on teaching quality.

        Teaching well is strong evidence of understanding, so we give a mastery
        boost proportional to the teaching score.
        """
        row = (
            db.query(StudentConceptMastery)
            .filter(
                StudentConceptMastery.student_id == student_id,
                StudentConceptMastery.concept_id == concept_id,
            )
            .first()
        )
        if row is None:
            row = StudentConceptMastery(
                student_id=student_id,
                concept_id=concept_id,
                mastery_score=0.0,
                attempts=0,
            )
            db.add(row)
            db.flush()

        # Teaching boost: up to 0.15 mastery increase for perfect teaching
        boost = overall_score * 0.15
        row.mastery_score = min(1.0, row.mastery_score + boost)
        row.attempts += 1

        # Append evidence
        evidence = list(row.evidence or [])
        evidence.append({
            "source": "teaching_session",
            "score": overall_score,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        row.evidence = evidence[-20:]  # Keep last 20 data points
