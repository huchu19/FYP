"""Integration tests for formative assessment flows (pulse check, prerequisite
diagnostic) and teacher history access. AI generation is monkeypatched — these
tests exercise the DB plumbing and routing, not the live model.
"""

import pytest

pytest.importorskip("bcrypt")
pytest.importorskip("jwt")
pytest.importorskip("httpx")

from app.models.concept import Concept, ConceptPrerequisite
from app.models.lesson import Lesson
from app.routers import formative_assessments as fa_router

# Reuse the shared helpers from the auth test module.
from tests.test_auth import (
    auth_headers,
    create_classroom,
    create_user,
    enroll_student,
    login,
)


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------


def _fake_inventory(concepts_with_mastery, *, num_questions=5, avoid_questions=None):
    """Deterministic stand-in for AIService.generate_concept_inventory.

    Emits one MCQ per concept (capped at num_questions), referencing the real
    concept ids so mastery updates and scoring have valid targets.
    """
    questions = []
    for c in concepts_with_mastery[:num_questions]:
        questions.append(
            {
                "question": f"What is {c['name']}?",
                "type": "mcq",
                "options": ["Right", "Wrong 1", "Wrong 2", "Wrong 3"],
                "correct_answer": "Right",
                "explanation": f"{c['name']} explained.",
                "concept_id": c["id"],
                "concept_name": c["name"],
                "difficulty": "easy",
            }
        )
    return questions


@pytest.fixture()
def patch_ai(monkeypatch):
    monkeypatch.setattr(
        fa_router.fa_service.ai, "generate_concept_inventory", _fake_inventory
    )


def _make_lesson(session_factory, *, classroom_id, title="Photosynthesis"):
    with session_factory() as session:
        lesson = Lesson(classroom_id=classroom_id, title=title, body="Body", status="published")
        session.add(lesson)
        session.commit()
        session.refresh(lesson)
        session.expunge(lesson)
        return lesson


def _make_concept(session_factory, *, classroom_id, name, lesson_id=None):
    with session_factory() as session:
        concept = Concept(
            classroom_id=classroom_id,
            name=name,
            description=f"{name} description",
            lesson_id=lesson_id,
        )
        session.add(concept)
        session.commit()
        session.refresh(concept)
        session.expunge(concept)
        return concept


def _add_prerequisite(session_factory, *, concept_id, prerequisite_id):
    with session_factory() as session:
        session.add(
            ConceptPrerequisite(concept_id=concept_id, prerequisite_id=prerequisite_id)
        )
        session.commit()


def _classroom_with_student(client, session_factory):
    teacher = create_user(session_factory, email="t@ex.com", password="pw", role="teacher")
    student = create_user(session_factory, email="s@ex.com", password="pw", role="student")
    classroom = create_classroom(
        session_factory, teacher_id=teacher.id, name="Bio", code="BIO123"
    )
    enroll_student(session_factory, classroom_id=classroom.id, student_id=student.id)
    return teacher, student, classroom


# ---------------------------------------------------------------------------
# Pulse check
# ---------------------------------------------------------------------------


def test_pulse_check_generates_questions_for_lesson_concepts(client, session_factory, patch_ai):
    _teacher, _student, classroom = _classroom_with_student(client, session_factory)
    lesson = _make_lesson(session_factory, classroom_id=classroom.id)
    _make_concept(session_factory, classroom_id=classroom.id, name="Chlorophyll", lesson_id=lesson.id)
    _make_concept(session_factory, classroom_id=classroom.id, name="Light reactions", lesson_id=lesson.id)
    # A concept from a different lesson must NOT be included.
    _make_concept(session_factory, classroom_id=classroom.id, name="Unrelated", lesson_id=None)

    token = login(client, email="s@ex.com", password="pw")
    res = client.post(
        "/formative-assessments/pulse-check",
        json={"lesson_id": lesson.id},
        headers=auth_headers(token),
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["assessment_id"] is not None
    assert data["assessment_type"] == "pulse"
    assert data["lesson_id"] == lesson.id
    assert len(data["questions"]) == 2  # only the two lesson-linked concepts
    names = {q["concept_name"] for q in data["questions"]}
    assert names == {"Chlorophyll", "Light reactions"}


def test_pulse_check_without_lesson_concepts_returns_message(client, session_factory, patch_ai):
    _teacher, _student, classroom = _classroom_with_student(client, session_factory)
    lesson = _make_lesson(session_factory, classroom_id=classroom.id)

    token = login(client, email="s@ex.com", password="pw")
    res = client.post(
        "/formative-assessments/pulse-check",
        json={"lesson_id": lesson.id},
        headers=auth_headers(token),
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["assessment_id"] is None
    assert data["questions"] == []
    assert "message" in data


# ---------------------------------------------------------------------------
# Prerequisite diagnostic
# ---------------------------------------------------------------------------


def test_prerequisite_diagnostic_targets_prerequisite_concepts(client, session_factory, patch_ai):
    _teacher, _student, classroom = _classroom_with_student(client, session_factory)
    target = _make_concept(session_factory, classroom_id=classroom.id, name="Calvin cycle")
    prereq_a = _make_concept(session_factory, classroom_id=classroom.id, name="ATP")
    prereq_b = _make_concept(session_factory, classroom_id=classroom.id, name="NADPH")
    _add_prerequisite(session_factory, concept_id=target.id, prerequisite_id=prereq_a.id)
    _add_prerequisite(session_factory, concept_id=target.id, prerequisite_id=prereq_b.id)

    token = login(client, email="s@ex.com", password="pw")
    res = client.post(
        "/formative-assessments/prerequisite-diagnostic",
        json={"concept_id": target.id},
        headers=auth_headers(token),
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["assessment_type"] == "diagnostic"
    assert data["target_concept"]["id"] == target.id
    names = {q["concept_name"] for q in data["questions"]}
    assert names == {"ATP", "NADPH"}


def test_prerequisite_diagnostic_without_prerequisites_returns_message(client, session_factory, patch_ai):
    _teacher, _student, classroom = _classroom_with_student(client, session_factory)
    target = _make_concept(session_factory, classroom_id=classroom.id, name="Standalone")

    token = login(client, email="s@ex.com", password="pw")
    res = client.post(
        "/formative-assessments/prerequisite-diagnostic",
        json={"concept_id": target.id},
        headers=auth_headers(token),
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["assessment_id"] is None
    assert data["questions"] == []


def test_prerequisite_diagnostic_missing_concept_returns_400(client, session_factory, patch_ai):
    _teacher, _student, _classroom = _classroom_with_student(client, session_factory)
    token = login(client, email="s@ex.com", password="pw")
    res = client.post(
        "/formative-assessments/prerequisite-diagnostic",
        json={"concept_id": 999999},
        headers=auth_headers(token),
    )
    assert res.status_code == 400, res.text


# ---------------------------------------------------------------------------
# Submit + teacher history
# ---------------------------------------------------------------------------


def test_teacher_history_requires_student_id_and_returns_records(client, session_factory, patch_ai):
    _teacher, student, classroom = _classroom_with_student(client, session_factory)
    lesson = _make_lesson(session_factory, classroom_id=classroom.id)
    _make_concept(session_factory, classroom_id=classroom.id, name="Chlorophyll", lesson_id=lesson.id)

    student_token = login(client, email="s@ex.com", password="pw")
    created = client.post(
        "/formative-assessments/pulse-check",
        json={"lesson_id": lesson.id},
        headers=auth_headers(student_token),
    ).json()

    # Student submits their answers.
    submit = client.post(
        "/formative-assessments/submit",
        json={
            "assessment_id": created["assessment_id"],
            "responses": [
                {"question_index": 0, "selected_answer": "Right", "confidence": 4}
            ],
        },
        headers=auth_headers(student_token),
    )
    assert submit.status_code == 200, submit.text
    assert submit.json()["score"] == 1.0

    teacher_token = login(client, email="t@ex.com", password="pw")
    # Teacher without student_id -> 400
    missing = client.get(
        f"/formative-assessments/history?classroom_id={classroom.id}",
        headers=auth_headers(teacher_token),
    )
    assert missing.status_code == 400, missing.text

    # Teacher with student_id -> sees the record
    history = client.get(
        f"/formative-assessments/history?classroom_id={classroom.id}&student_id={student.id}",
        headers=auth_headers(teacher_token),
    )
    assert history.status_code == 200, history.text
    rows = history.json()
    assert len(rows) == 1
    assert rows[0]["assessment_type"] == "pulse"
