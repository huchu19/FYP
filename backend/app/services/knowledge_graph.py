"""
Knowledge Graph Service – EduNexus

Manages concepts, prerequisites, and student mastery for the Knowledge Graph Visualizer.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.concept import Concept, ConceptPrerequisite, StudentConceptMastery
from app.models.lesson import Lesson
from app.models.user import User
from app.services.ai import AIService

logger = logging.getLogger(__name__)


class KnowledgeGraphService:
    def __init__(self, ai_service: Optional[AIService] = None) -> None:
        self.ai = ai_service or AIService()

    # -----------------------------------------------------------------
    # Concept CRUD
    # -----------------------------------------------------------------

    def list_concepts(self, db: Session, classroom_id: int) -> list[Concept]:
        return (
            db.query(Concept)
            .filter(Concept.classroom_id == classroom_id)
            .order_by(Concept.id)
            .all()
        )

    def create_concept(
        self,
        db: Session,
        *,
        classroom_id: int,
        name: str,
        description: str | None = None,
        lesson_id: int | None = None,
    ) -> Concept:
        existing = (
            db.query(Concept)
            .filter(Concept.classroom_id == classroom_id, Concept.name == name)
            .first()
        )
        if existing:
            return existing

        concept = Concept(
            classroom_id=classroom_id,
            name=name,
            description=description,
            lesson_id=lesson_id,
        )
        db.add(concept)
        db.flush()
        return concept

    def add_prerequisite(
        self, db: Session, *, concept_id: int, prerequisite_id: int
    ) -> ConceptPrerequisite:
        existing = (
            db.query(ConceptPrerequisite)
            .filter(
                ConceptPrerequisite.concept_id == concept_id,
                ConceptPrerequisite.prerequisite_id == prerequisite_id,
            )
            .first()
        )
        if existing:
            return existing

        edge = ConceptPrerequisite(
            concept_id=concept_id, prerequisite_id=prerequisite_id
        )
        db.add(edge)
        db.flush()
        return edge

    def update_concept(
        self,
        db: Session,
        concept_id: int,
        *,
        name: str | None = None,
        description: str | None = None,
    ) -> Concept:
        concept = db.query(Concept).filter(Concept.id == concept_id).first()
        if concept is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")

        if name is not None and name != concept.name:
            conflict = (
                db.query(Concept)
                .filter(Concept.classroom_id == concept.classroom_id, Concept.name == name)
                .first()
            )
            if conflict:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"A concept named '{name}' already exists in this classroom",
                )
            concept.name = name

        if description is not None:
            concept.description = description

        db.flush()
        return concept

    def delete_concept(self, db: Session, concept_id: int) -> None:
        concept = db.query(Concept).filter(Concept.id == concept_id).first()
        if concept is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concept not found")
        db.delete(concept)
        db.flush()

    def remove_prerequisite(
        self, db: Session, *, concept_id: int, prerequisite_id: int
    ) -> None:
        edge = (
            db.query(ConceptPrerequisite)
            .filter(
                ConceptPrerequisite.concept_id == concept_id,
                ConceptPrerequisite.prerequisite_id == prerequisite_id,
            )
            .first()
        )
        if edge is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Prerequisite relationship not found"
            )
        db.delete(edge)
        db.flush()

    # -----------------------------------------------------------------
    # AI concept extraction
    # -----------------------------------------------------------------

    def generate_from_lesson(
        self,
        db: Session,
        *,
        lesson_id: int,
        actor_user: User,
    ) -> dict[str, Any]:
        """Use AI to extract concepts and prerequisites from a lesson, persisting them."""
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if lesson is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

        if not lesson.body:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lesson has no content to extract concepts from",
            )

        ai_result = self.ai.generate_concept_graph(lesson.title, lesson.body)

        created_concepts: dict[str, Concept] = {}
        for c in ai_result.get("concepts", []):
            concept = self.create_concept(
                db,
                classroom_id=lesson.classroom_id,
                name=c["name"],
                description=c.get("description"),
                lesson_id=lesson.id,
            )
            created_concepts[c["name"]] = concept

        edges_created = 0
        for p in ai_result.get("prerequisites", []):
            concept_obj = created_concepts.get(p["concept"])
            prereq_obj = created_concepts.get(p["prerequisite"])
            if concept_obj and prereq_obj and concept_obj.id != prereq_obj.id:
                self.add_prerequisite(
                    db, concept_id=concept_obj.id, prerequisite_id=prereq_obj.id
                )
                edges_created += 1

        db.commit()

        return {
            "concepts_created": len(created_concepts),
            "edges_created": edges_created,
        }

    # -----------------------------------------------------------------
    # Graph query
    # -----------------------------------------------------------------

    def get_graph(
        self,
        db: Session,
        classroom_id: int,
        *,
        student_id: int | None = None,
    ) -> dict[str, Any]:
        """Return the full concept graph for a classroom.

        If student_id is provided, includes mastery scores per node.
        """
        concepts = self.list_concepts(db, classroom_id)
        concept_ids = {c.id for c in concepts}

        edges = (
            db.query(ConceptPrerequisite)
            .filter(ConceptPrerequisite.concept_id.in_(concept_ids))
            .all()
        )

        mastery_map: dict[int, dict] = {}
        if student_id:
            mastery_rows = (
                db.query(StudentConceptMastery)
                .filter(
                    StudentConceptMastery.student_id == student_id,
                    StudentConceptMastery.concept_id.in_(concept_ids),
                )
                .all()
            )
            mastery_map = {
                m.concept_id: {
                    "mastery": m.mastery_score,
                    "metacognitive_score": m.metacognitive_score,
                    "unaided_mastery": m.unaided_mastery,
                    "aided_mastery": m.aided_mastery,
                    "attempts": m.attempts,
                    "evidence": m.evidence or [],
                }
                for m in mastery_rows
            }

        nodes = [
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "lesson_id": c.lesson_id,
                "mastery": mastery_map.get(c.id, {}).get("mastery", 0.0),
                "metacognitive_score": mastery_map.get(c.id, {}).get("metacognitive_score"),
                "unaided_mastery": mastery_map.get(c.id, {}).get("unaided_mastery"),
                "aided_mastery": mastery_map.get(c.id, {}).get("aided_mastery"),
                "zpd_delta": (
                    round(
                        mastery_map[c.id]["aided_mastery"] - mastery_map[c.id]["unaided_mastery"],
                        3,
                    )
                    if c.id in mastery_map
                    and mastery_map[c.id].get("aided_mastery") is not None
                    and mastery_map[c.id].get("unaided_mastery") is not None
                    else None
                ),
                "attempts": mastery_map.get(c.id, {}).get("attempts", 0),
                "evidence": mastery_map.get(c.id, {}).get("evidence", []),
            }
            for c in concepts
        ]

        links = [
            {
                "source": e.prerequisite_id,
                "target": e.concept_id,
            }
            for e in edges
        ]

        return {"nodes": nodes, "links": links}

    # -----------------------------------------------------------------
    # Blind-spot detection
    # -----------------------------------------------------------------

    def get_blind_spots(
        self, db: Session, classroom_id: int, student_id: int
    ) -> list[dict[str, Any]]:
        """Find low-mastery concepts that are prerequisites for other concepts.

        These represent knowledge gaps that may block further learning.
        """
        graph = self.get_graph(db, classroom_id, student_id=student_id)
        node_map = {n["id"]: n for n in graph["nodes"]}

        # Collect all prerequisite concept IDs
        prereq_ids = {link["source"] for link in graph["links"]}

        blind_spots = []
        for pid in prereq_ids:
            node = node_map.get(pid)
            if node and node["mastery"] < 0.5:
                # Find which concepts depend on this prerequisite
                blocks = [
                    node_map[link["target"]]["name"]
                    for link in graph["links"]
                    if link["source"] == pid and link["target"] in node_map
                ]
                blind_spots.append(
                    {
                        "concept_id": node["id"],
                        "concept_name": node["name"],
                        "mastery": node["mastery"],
                        "blocks": blocks,
                    }
                )

        return sorted(blind_spots, key=lambda x: x["mastery"])

    # -----------------------------------------------------------------
    # Concept-driven adaptive practice
    # -----------------------------------------------------------------

    def get_practice_targets(
        self,
        db: Session,
        classroom_id: int,
        student_id: int,
        *,
        max_concepts: int = 5,
    ) -> list[dict[str, Any]]:
        """Select the highest-priority concepts for targeted practice.

        Uses a weighted scoring algorithm considering:
          - Prerequisite criticality (40%): blind-spot concepts that block others
          - Mastery deficit (30%): lower mastery = higher priority
          - ZPD readiness (20%): large aided-vs-unaided gap = ready to learn
          - Recency penalty (10%): deprioritize concepts practised today
        """
        from datetime import date, datetime, timezone

        graph = self.get_graph(db, classroom_id, student_id=student_id)
        nodes = graph["nodes"]
        if not nodes:
            return []

        blind_spots = self.get_blind_spots(db, classroom_id, student_id)

        # Build lookup: concept_id → list of concept names it blocks
        blind_spot_map: dict[int, list[str]] = {
            bs["concept_id"]: bs.get("blocks", []) for bs in blind_spots
        }

        today_iso = date.today().isoformat()

        scored: list[dict[str, Any]] = []
        for node in nodes:
            mastery = node.get("mastery", 0.0)
            if mastery >= 0.9:
                continue  # already mastered

            concept_id = node["id"]

            # --- Prerequisite criticality (0-1) ---
            blocks = blind_spot_map.get(concept_id, [])
            criticality = min(len(blocks) / 3.0, 1.0) if blocks else 0.0

            # --- Mastery deficit (0-1) ---
            deficit = 1.0 - mastery

            # --- ZPD readiness (0-1) ---
            zpd_delta = node.get("zpd_delta") or 0.0
            zpd_score = min(max(zpd_delta, 0.0) / 0.3, 1.0)

            # --- Recency penalty (0-1, higher = practised recently = lower priority) ---
            evidence = node.get("evidence", [])
            recent_today = sum(
                1 for e in evidence
                if isinstance(e, dict) and str(e.get("timestamp", "")).startswith(today_iso)
            )
            recency_penalty = min(recent_today / 3.0, 1.0)

            # Weighted composite
            priority = (
                0.40 * criticality
                + 0.30 * deficit
                + 0.20 * zpd_score
                - 0.10 * recency_penalty
            )

            # Determine category and build reason string
            if blocks:
                category = "blind_spot"
                reason = (
                    f"Low mastery ({round(mastery * 100)}%) "
                    f"— prerequisite for: {', '.join(blocks[:3])}"
                )
            elif zpd_delta and zpd_delta > 0.05:
                category = "zpd"
                unaided = round((node.get("unaided_mastery") or 0) * 100)
                aided = round((node.get("aided_mastery") or 0) * 100)
                reason = (
                    f"Zone of Proximal Development — "
                    f"you score {aided}% with hints but {unaided}% without"
                )
            else:
                category = "low_mastery"
                reason = f"Low mastery ({round(mastery * 100)}%) — needs reinforcement"

            scored.append(
                {
                    "concept_id": concept_id,
                    "concept_name": node["name"],
                    "description": node.get("description"),
                    "mastery": round(mastery, 3),
                    "priority_score": round(max(priority, 0.0), 3),
                    "reason": reason,
                    "category": category,
                }
            )

        scored.sort(key=lambda x: x["priority_score"], reverse=True)
        return scored[:max_concepts]

    def generate_practice_quiz(
        self,
        db: Session,
        classroom_id: int,
        student_id: int,
        *,
        num_questions: int = 5,
        max_concepts: int = 5,
    ) -> dict[str, Any]:
        """Generate a targeted quiz based on the student's weakest concepts.

        Returns the created quiz and the practice targets with explanations.
        """
        from app.repositories.quiz_repository import QuizRepository

        targets = self.get_practice_targets(
            db, classroom_id, student_id, max_concepts=max_concepts
        )

        if not targets:
            return {
                "quiz": None,
                "targets": [],
                "message": "All concepts are well-mastered — no practice needed right now.",
            }

        # Build input for AI concept inventory generator
        concepts_with_mastery = [
            {
                "id": t["concept_id"],
                "name": t["concept_name"],
                "description": t.get("description") or "",
                "mastery": t["mastery"],
            }
            for t in targets
        ]

        questions = self.ai.generate_concept_inventory(
            concepts_with_mastery, num_questions=num_questions
        )

        # Resolve AI-generated concept_name tags → concept IDs
        all_concept_names = [t["concept_name"] for t in targets]
        name_to_id = {
            c.name: c.id
            for c in db.query(Concept)
            .filter(
                Concept.classroom_id == classroom_id,
                Concept.name.in_(all_concept_names),
            )
            .all()
        }
        for q in questions:
            tags = q.get("concept_tags", [])
            q["concept_ids"] = [name_to_id[t] for t in tags if t in name_to_id]

        concept_summary = ", ".join(t["concept_name"] for t in targets[:3])
        title = f"Concept Practice: {concept_summary}"
        if len(title) > 120:
            title = title[:117] + "..."

        quiz_repo = QuizRepository()
        quiz = quiz_repo.create(
            db,
            classroom_id=classroom_id,
            title=title,
            difficulty="adaptive",
            quiz_type="concept_practice",
            questions=questions,
            created_by_user_id=student_id,
        )

        logger.info(
            "Created concept practice quiz %s for student %s targeting %d concepts",
            quiz.id,
            student_id,
            len(targets),
        )

        return {
            "quiz_id": quiz.id,
            "targets": targets,
            "message": f"Generated {len(questions)} questions targeting {len(targets)} weak concepts",
        }

    # -----------------------------------------------------------------
    # Mastery updates
    # -----------------------------------------------------------------

    def update_mastery(
        self,
        db: Session,
        *,
        student_id: int,
        concept_id: int,
        is_correct: bool,
        confidence: int | None = None,
        attempt_id: int | None = None,
        hints_used: int = 0,
        credit_earned: float | None = None,
    ) -> StudentConceptMastery:
        """Update a student's mastery for a concept based on a quiz response.

        Also appends an evidence data point and updates the metacognitive score
        (calibration accuracy over time) so that every judgement is traceable.
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
                evidence=[],
            )
            db.add(row)

        row.attempts += 1

        # Exponential moving average: weight recent performance more
        alpha = 0.3
        new_value = (
            round(max(min(credit_earned, 1.0), 0.0), 3)
            if credit_earned is not None
            else (1.0 if is_correct else 0.0)
        )
        row.mastery_score = round(
            alpha * new_value + (1 - alpha) * row.mastery_score, 3
        )

        zpd_value = 1.0 if is_correct else 0.0
        if hints_used > 0:
            baseline = row.aided_mastery if row.aided_mastery is not None else 0.0
            row.aided_mastery = round(alpha * zpd_value + (1 - alpha) * baseline, 3)
        else:
            baseline = row.unaided_mastery if row.unaided_mastery is not None else 0.0
            row.unaided_mastery = round(alpha * zpd_value + (1 - alpha) * baseline, 3)

        # Append evidence data point (keep last 20)
        from datetime import datetime, timezone

        evidence_point = {
            "attempt_id": attempt_id,
            "is_correct": is_correct,
            "confidence": confidence,
            "hints_used": hints_used,
            "credit_earned": new_value,
            "mastery_after": row.mastery_score,
            "unaided_mastery_after": row.unaided_mastery,
            "aided_mastery_after": row.aided_mastery,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        evidence_list = list(row.evidence or [])
        evidence_list.append(evidence_point)
        if len(evidence_list) > 20:
            evidence_list = evidence_list[-20:]
        row.evidence = evidence_list

        # Update metacognitive score: calibration accuracy over evidence window
        if confidence is not None:
            confidence_to_expected = {1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0}
            rated = [
                (e["is_correct"], e["confidence"])
                for e in evidence_list
                if e.get("confidence") is not None
            ]
            if rated:
                total_error = 0.0
                for correct, conf in rated:
                    expected = confidence_to_expected.get(conf, 0.5)
                    actual = 1.0 if correct else 0.0
                    total_error += abs(expected - actual)
                row.metacognitive_score = round(1.0 - (total_error / len(rated)), 3)

        db.flush()
        return row
