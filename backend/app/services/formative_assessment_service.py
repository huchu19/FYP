"""
Formative Assessment Service – EduNexus

Adaptive formative assessment flows that feed the student model without full quiz overhead.
Current active path: concept inventory across all concepts in a classroom.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.concept import StudentConceptMastery
from app.models.formative_assessment import FormativeAssessment
from app.services.ai import AIService
from app.services.knowledge_graph import KnowledgeGraphService


class FormativeAssessmentService:
    def __init__(
        self,
        ai_service: AIService | None = None,
        kg_service: KnowledgeGraphService | None = None,
    ) -> None:
        self.ai = ai_service or AIService()
        self.kg = kg_service or KnowledgeGraphService(self.ai)

    # -----------------------------------------------------------------
    # 1. Concept inventory
    # -----------------------------------------------------------------

    def concept_inventory(
        self,
        db: Session,
        *,
        student_id: int,
        classroom_id: int,
        num_questions: int = 5,
    ) -> dict[str, Any]:
        """Generate an adaptive concept inventory for the classroom.

        Targets low-mastery concepts and adapts difficulty per concept.
        """
        concepts = self.kg.list_concepts(db, classroom_id)
        if not concepts:
            return {"assessment_id": None, "questions": [], "message": "No concepts in this classroom."}

        concept_ids = [c.id for c in concepts]
        mastery_rows = (
            db.query(StudentConceptMastery)
            .filter(
                StudentConceptMastery.student_id == student_id,
                StudentConceptMastery.concept_id.in_(concept_ids),
            )
            .all()
        )
        mastery_map = {m.concept_id: m.mastery_score for m in mastery_rows}

        concepts_with_mastery = [
            {
                "id": c.id,
                "name": c.name,
                "description": c.description or "",
                "mastery": mastery_map.get(c.id, 0.0),
            }
            for c in concepts
        ]

        # Sort by mastery ascending so AI prioritises weak concepts
        concepts_with_mastery.sort(key=lambda x: x["mastery"])

        questions = self.ai.generate_concept_inventory(
            concepts_with_mastery, num_questions=num_questions
        )

        assessed_ids = list({
            q.get("concept_id")
            for q in questions
            if q.get("concept_id")
        })

        assessment = FormativeAssessment(
            student_id=student_id,
            classroom_id=classroom_id,
            assessment_type="inventory",
            questions=questions,
            responses=[],
            max_questions=len(questions),
            correct_count=0,
            concept_ids_assessed=assessed_ids,
        )
        db.add(assessment)
        db.commit()
        db.refresh(assessment)

        return {
            "assessment_id": assessment.id,
            "assessment_type": "inventory",
            "classroom_id": classroom_id,
            "questions": questions,
            "concept_ids_assessed": assessed_ids,
        }

    # -----------------------------------------------------------------
    # Submit responses (shared across all assessment types)
    # -----------------------------------------------------------------

    def submit_responses(
        self,
        db: Session,
        *,
        assessment_id: int,
        student_id: int,
        responses: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Score submitted responses and update concept mastery.

        Each response: {"question_index": 0, "selected_answer": "Option A", "confidence": 4}
        """
        assessment = (
            db.query(FormativeAssessment)
            .filter(
                FormativeAssessment.id == assessment_id,
                FormativeAssessment.student_id == student_id,
            )
            .first()
        )
        if assessment is None:
            raise ValueError("Assessment not found")

        questions = assessment.questions or []
        correct_count = 0
        scored_responses = []

        for resp in responses:
            idx = resp.get("question_index", 0)
            if idx >= len(questions):
                continue

            q = questions[idx]
            selected = resp.get("selected_answer", "")
            is_correct = selected == q.get("correct_answer")
            if is_correct:
                correct_count += 1

            scored_responses.append({
                "question_index": idx,
                "selected_answer": selected,
                "correct_answer": q.get("correct_answer"),
                "is_correct": is_correct,
                "confidence": resp.get("confidence"),
                "explanation": q.get("explanation", ""),
            })

            # Update concept mastery if concept_id is available
            concept_id = q.get("concept_id")
            if concept_id:
                self.kg.update_mastery(
                    db,
                    student_id=student_id,
                    concept_id=concept_id,
                    is_correct=is_correct,
                    confidence=resp.get("confidence"),
                )

        # Update assessment record
        assessment.responses = scored_responses
        assessment.correct_count = correct_count
        assessment.score = correct_count / len(questions) if questions else 0.0

        # Generate summary and recommendations
        assessment.summary = self._generate_summary(assessment, scored_responses)
        assessment.recommended_actions = self._generate_recommendations(
            db, assessment, scored_responses
        )

        db.commit()
        db.refresh(assessment)

        return {
            "assessment_id": assessment.id,
            "score": assessment.score,
            "correct_count": correct_count,
            "max_questions": len(questions),
            "responses": scored_responses,
            "summary": assessment.summary,
            "recommended_actions": assessment.recommended_actions,
        }

    # -----------------------------------------------------------------
    # History
    # -----------------------------------------------------------------

    def list_assessments(
        self,
        db: Session,
        *,
        student_id: int,
        classroom_id: int,
        assessment_type: str | None = None,
    ) -> list[dict[str, Any]]:
        query = db.query(FormativeAssessment).filter(
            FormativeAssessment.student_id == student_id,
            FormativeAssessment.classroom_id == classroom_id,
        )
        if assessment_type:
            query = query.filter(FormativeAssessment.assessment_type == assessment_type)
        rows = query.order_by(FormativeAssessment.created_at.desc()).all()
        return [
            {
                "id": r.id,
                "assessment_type": r.assessment_type,
                "lesson_id": r.lesson_id,
                "score": r.score,
                "correct_count": r.correct_count,
                "max_questions": r.max_questions,
                "summary": r.summary,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]

    # -----------------------------------------------------------------
    # Internal helpers
    # -----------------------------------------------------------------

    @staticmethod
    def _generate_summary(
        assessment: FormativeAssessment, responses: list[dict]
    ) -> str:
        total = len(responses)
        correct = sum(1 for r in responses if r["is_correct"])
        pct = round(correct / total * 100) if total else 0
        type_label = {
            "inventory": "Concept Inventory",
        }.get(assessment.assessment_type, "Assessment")
        return f"{type_label}: {correct}/{total} correct ({pct}%)."

    @staticmethod
    def _generate_recommendations(
        db: Session, assessment: FormativeAssessment, responses: list[dict]
    ) -> list[dict[str, Any]]:
        actions = []
        questions = assessment.questions or []
        for resp in responses:
            if resp["is_correct"]:
                continue
            idx = resp["question_index"]
            if idx < len(questions):
                q = questions[idx]
                concept_name = q.get("concept_name", "Unknown concept")
                actions.append({
                    "action": "review",
                    "concept": concept_name,
                    "reason": f"Answered incorrectly: {q.get('explanation', '')}",
                })
        return actions
