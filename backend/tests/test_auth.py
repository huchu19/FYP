from datetime import datetime
from types import SimpleNamespace
from typing import Optional

import pytest

pytest.importorskip("bcrypt")
pytest.importorskip("jwt")
pytest.importorskip("httpx")

from app.core.security import create_access_token, decode_access_token, hash_password
from app.models.analytics_event import AnalyticsEvent
from app.models.classroom import Classroom
from app.models.classroom_enrollment import ClassroomEnrollment
from app.models.concept import Concept, StudentConceptMastery
from app.models.gamification import Gamification
from app.models.lesson import Lesson
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz_response import QuizResponse
from app.models.user import User
from app.routers import lessons as lessons_router
from app.routers import quizzes as quizzes_router


def create_user(session_factory, *, email: str, password: str, role: str, password_hash: Optional[str] = None) -> User:
    with session_factory() as session:
        user = User(
            name=email.split("@", 1)[0].title(),
            email=email,
            role=role,
            password_hash=password_hash or hash_password(password),
            is_active=True,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        session.expunge(user)
        return user


def create_classroom(
    session_factory,
    *,
    teacher_id: int,
    name: str,
    code: str,
    description: Optional[str] = None,
) -> Classroom:
    with session_factory() as session:
        classroom = Classroom(
            name=name,
            code=code,
            teacher_id=teacher_id,
            description=description,
        )
        session.add(classroom)
        session.commit()
        session.refresh(classroom)
        session.expunge(classroom)
        return classroom


def enroll_student(session_factory, *, classroom_id: int, student_id: int) -> None:
    with session_factory() as session:
        session.add(
            ClassroomEnrollment(
                classroom_id=classroom_id,
                student_id=student_id,
            )
        )
        session.commit()


def login(client, *, email: str, password: str) -> str:
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.parametrize("role", ["teacher", "student"])
def test_register_stores_bcrypt_hash(client, session_factory, role: str):
    response = client.post(
        "/auth/register",
        json={
            "name": f"{role.title()} User",
            "email": f"{role}@example.com",
            "password": "Password123!",
            "role": role,
        },
    )

    assert response.status_code == 201
    with session_factory() as session:
        user = session.query(User).filter(User.email == f"{role}@example.com").one()
        assert user.password_hash != "Password123!"
        assert user.password_hash.startswith(("$2a$", "$2b$", "$2y$"))


def test_login_returns_standard_jwt_and_me_payload(client, session_factory):
    user = create_user(
        session_factory,
        email="teacher@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )

    token = login(client, email="teacher@example.com", password="dev_teacher_hash")
    payload = decode_access_token(token)
    me_response = client.get("/auth/me", headers=auth_headers(token))

    assert payload["sub"] == str(user.id)
    assert payload["role"] == "teacher"
    assert payload["typ"] == "access"
    assert me_response.status_code == 200
    assert me_response.json() == {
        "id": user.id,
        "name": "Teacher",
        "email": "teacher@example.com",
        "role": "teacher",
        "is_active": True,
    }


def test_invalid_password_is_rejected(client, session_factory):
    create_user(
        session_factory,
        email="teacher@example.com",
        password="correct-password",
        role="teacher",
    )

    response = client.post(
        "/auth/login",
        json={"email": "teacher@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_protected_classrooms_route_requires_token(client):
    response = client.get("/classrooms")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


def test_malformed_or_expired_token_is_rejected(client, session_factory):
    teacher = create_user(
        session_factory,
        email="teacher@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )
    create_classroom(
        session_factory,
        teacher_id=teacher.id,
        name="Physics",
        code="PHYS-1",
    )

    malformed = client.get("/classrooms", headers=auth_headers("not-a-token"))
    assert malformed.status_code == 401

    expired_token = create_access_token(subject=str(teacher.id), role="teacher", expires_minutes=-1)
    expired = client.get("/classrooms", headers=auth_headers(expired_token))
    assert expired.status_code == 401


def test_student_cannot_create_classroom(client, session_factory):
    create_user(
        session_factory,
        email="student@example.com",
        password="dev_student_hash",
        role="student",
    )

    token = login(client, email="student@example.com", password="dev_student_hash")
    response = client.post(
        "/classrooms",
        json={"name": "Unauthorized", "code": "NOPE-1", "description": None},
        headers=auth_headers(token),
    )

    assert response.status_code == 403


def test_teacher_can_create_classroom_without_teacher_id(client, session_factory):
    teacher = create_user(
        session_factory,
        email="teacher@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )

    token = login(client, email="teacher@example.com", password="dev_teacher_hash")
    response = client.post(
        "/classrooms",
        json={"name": "Physics 101", "code": "PHYS-101", "description": "Intro physics"},
        headers=auth_headers(token),
    )

    assert response.status_code == 201
    assert response.json() == {
        "id": 1,
        "name": "Physics 101",
        "code": "PHYS-101",
        "description": "Intro physics",
        "teacher_id": teacher.id,
    }


def test_classroom_create_rejects_teacher_id_field(client, session_factory):
    create_user(
        session_factory,
        email="teacher@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )

    token = login(client, email="teacher@example.com", password="dev_teacher_hash")
    response = client.post(
        "/classrooms",
        json={
            "name": "Physics 101",
            "code": "PHYS-101",
            "description": "Intro physics",
            "teacher_id": 999,
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 422


def test_teacher_only_sees_owned_classrooms(client, session_factory):
    teacher_one = create_user(
        session_factory,
        email="teacher1@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )
    teacher_two = create_user(
        session_factory,
        email="teacher2@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )
    own_classroom = create_classroom(session_factory, teacher_id=teacher_one.id, name="Owned", code="OWN-1")
    create_classroom(session_factory, teacher_id=teacher_two.id, name="Other", code="OTH-1")

    token = login(client, email="teacher1@example.com", password="dev_teacher_hash")
    response = client.get("/classrooms", headers=auth_headers(token))

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": own_classroom.id,
            "name": "Owned",
            "code": "OWN-1",
            "description": None,
            "teacher_id": teacher_one.id,
        }
    ]


def test_student_only_sees_enrolled_classrooms(client, session_factory):
    teacher = create_user(
        session_factory,
        email="teacher@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )
    student = create_user(
        session_factory,
        email="student@example.com",
        password="dev_student_hash",
        role="student",
    )
    enrolled = create_classroom(session_factory, teacher_id=teacher.id, name="Algebra", code="ALG-1")
    hidden = create_classroom(session_factory, teacher_id=teacher.id, name="Geometry", code="GEO-1")
    enroll_student(session_factory, classroom_id=enrolled.id, student_id=student.id)

    token = login(client, email="student@example.com", password="dev_student_hash")
    response = client.get("/classrooms", headers=auth_headers(token))

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": enrolled.id,
            "name": "Algebra",
            "code": "ALG-1",
            "description": None,
            "teacher_id": teacher.id,
        }
    ]
    assert hidden.id != enrolled.id


def test_teacher_cannot_access_another_teachers_classroom(client, session_factory):
    teacher_one = create_user(
        session_factory,
        email="teacher1@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )
    teacher_two = create_user(
        session_factory,
        email="teacher2@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )
    other_classroom = create_classroom(session_factory, teacher_id=teacher_two.id, name="Other", code="OTH-1")

    token = login(client, email="teacher1@example.com", password="dev_teacher_hash")
    response = client.get(f"/classrooms/{other_classroom.id}", headers=auth_headers(token))

    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to access classroom"


def test_teacher_can_delete_classroom_and_all_dependent_content(client, session_factory):
    teacher = create_user(
        session_factory,
        email="teacher@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )
    student = create_user(
        session_factory,
        email="student@example.com",
        password="dev_student_hash",
        role="student",
    )
    classroom = create_classroom(
        session_factory,
        teacher_id=teacher.id,
        name="Biology",
        code="BIO-1",
    )
    enroll_student(session_factory, classroom_id=classroom.id, student_id=student.id)

    with session_factory() as session:
        lesson = Lesson(
            classroom_id=classroom.id,
            title="Cells",
            prompt="Teach cells",
            outline=["Cell theory"],
            body="Lesson body",
            status="published",
            created_by_user_id=teacher.id,
        )
        session.add(lesson)
        session.flush()

        lesson_quiz = Quiz(
            classroom_id=classroom.id,
            lesson_id=lesson.id,
            title="Cells quiz",
            difficulty="medium",
            questions=[{"question": "Q1", "correct_answer": "A"}],
            created_by_user_id=teacher.id,
        )
        standalone_quiz = Quiz(
            classroom_id=classroom.id,
            lesson_id=None,
            title="Standalone quiz",
            difficulty="easy",
            questions=[{"question": "Q2", "correct_answer": "B"}],
            created_by_user_id=teacher.id,
        )
        session.add_all([lesson_quiz, standalone_quiz])
        session.flush()

        attempt = QuizAttempt(
            quiz_id=lesson_quiz.id,
            student_id=student.id,
            score=1,
            max_score=1,
        )
        session.add(attempt)
        session.flush()

        response = QuizResponse(
            attempt_id=attempt.id,
            question_index=0,
            question_payload={"question": "Q1", "correct_answer": "A"},
            selected_answer="A",
            is_correct=True,
            awarded_xp=10,
        )
        concept = Concept(
            classroom_id=classroom.id,
            lesson_id=lesson.id,
            name="Cell Structure",
            description="Parts of the cell",
        )
        session.add_all([response, concept])
        session.flush()

        session.add(
            StudentConceptMastery(
                student_id=student.id,
                concept_id=concept.id,
                mastery_score=0.8,
                attempts=1,
            )
        )
        session.add(
            Gamification(
                user_id=student.id,
                classroom_id=classroom.id,
                xp=120,
                badges=["first_quiz"],
            )
        )
        session.add(
            AnalyticsEvent(
                user_id=teacher.id,
                classroom_id=classroom.id,
                event_type="lesson_created",
                payload={"lesson_id": lesson.id},
            )
        )
        session.commit()

    teacher_token = login(client, email="teacher@example.com", password="dev_teacher_hash")
    delete_response = client.delete(
        f"/classrooms/{classroom.id}",
        headers=auth_headers(teacher_token),
    )

    assert delete_response.status_code == 204

    with session_factory() as session:
        assert session.query(Classroom).count() == 0
        assert session.query(ClassroomEnrollment).count() == 0
        assert session.query(Lesson).count() == 0
        assert session.query(Quiz).count() == 0
        assert session.query(QuizAttempt).count() == 0
        assert session.query(QuizResponse).count() == 0
        assert session.query(Gamification).count() == 0
        assert session.query(AnalyticsEvent).count() == 0
        assert session.query(Concept).count() == 0
        assert session.query(StudentConceptMastery).count() == 0

    student_token = login(client, email="student@example.com", password="dev_student_hash")
    list_response = client.get("/classrooms", headers=auth_headers(student_token))
    assert list_response.status_code == 200
    assert list_response.json() == []


def test_legacy_password_login_rehashes_to_bcrypt(client, session_factory):
    create_user(
        session_factory,
        email="legacy@example.com",
        password="ignored",
        role="teacher",
        password_hash="legacy-password",
    )

    token = login(client, email="legacy@example.com", password="legacy-password")

    with session_factory() as session:
        user = session.query(User).filter(User.email == "legacy@example.com").one()
        assert token
        assert user.password_hash != "legacy-password"
        assert user.password_hash.startswith(("$2a$", "$2b$", "$2y$"))


def test_teacher_lesson_create_route_accepts_authenticated_teacher(client, session_factory, monkeypatch):
    teacher = create_user(
        session_factory,
        email="teacher@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )
    token = login(client, email="teacher@example.com", password="dev_teacher_hash")

    recorded = {}

    def fake_create_lesson(db, payload, *, actor_user, use_ai=True):
        recorded["actor_user_id"] = actor_user.id
        recorded["classroom_id"] = payload.classroom_id
        now = datetime.utcnow()
        return SimpleNamespace(
            id=99,
            classroom_id=payload.classroom_id,
            title=payload.title,
            prompt=payload.prompt,
            outline=payload.outline,
            body=payload.body,
            status="draft",
            generated_by_ai=False,
            created_by_user_id=actor_user.id,
            published_at=None,
            created_at=now,
            updated_at=now,
        )

    monkeypatch.setattr(lessons_router.service, "create_lesson", fake_create_lesson)
    response = client.post(
        "/lessons",
        json={
            "classroom_id": 7,
            "title": "Newton",
            "prompt": "Teach Newton's laws",
            "outline": ["First law"],
            "body": None,
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 201
    assert recorded == {"actor_user_id": teacher.id, "classroom_id": 7}
    assert response.json()["title"] == "Newton"


def test_teacher_ai_quiz_generation_preserves_quiz_type_hints_and_concept_ids(
    client, session_factory, monkeypatch
):
    teacher = create_user(
        session_factory,
        email="teacher@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )
    classroom = create_classroom(
        session_factory,
        teacher_id=teacher.id,
        name="Mathematics",
        code="MATH-1",
    )

    with session_factory() as session:
        lesson = Lesson(
            classroom_id=classroom.id,
            title="Fractions",
            prompt="Teach fractions",
            outline=["Equivalent fractions"],
            body="Fractions lesson body",
            status="published",
            created_by_user_id=teacher.id,
        )
        session.add(lesson)
        session.flush()
        concept = Concept(
            classroom_id=classroom.id,
            lesson_id=lesson.id,
            name="Equivalent Fractions",
            description="Different representations of the same amount",
        )
        session.add(concept)
        session.commit()
        lesson_id = lesson.id
        concept_id = concept.id

    recorded = {}

    def fake_generate_quiz(*, lesson_title, lesson_body, difficulty, num_questions, quiz_type, concept_names):
        recorded.update(
            {
                "lesson_title": lesson_title,
                "difficulty": difficulty,
                "num_questions": num_questions,
                "quiz_type": quiz_type,
                "concept_names": concept_names,
            }
        )
        return [
            {
                "question": "Which pair shows equivalent fractions?",
                "type": "explain_reasoning",
                "options": ["1/2 and 2/5", "1/2 and 2/4", "1/3 and 2/5", "2/3 and 3/5"],
                "correct_answer": "1/2 and 2/4",
                "explanation": "Multiplying numerator and denominator by the same value preserves equivalence.",
                "requires_reasoning": True,
                "reasoning_prompt": "Explain how you know the fractions are equivalent.",
                "concept_tags": ["Equivalent Fractions"],
                "hints": [
                    "Look for fractions that represent the same amount.",
                    "Try simplifying each option pair before comparing them.",
                    "Multiply or divide numerator and denominator by the same number.",
                ],
            }
        ]

    monkeypatch.setattr(quizzes_router.service.ai_service, "generate_quiz", fake_generate_quiz)

    token = login(client, email="teacher@example.com", password="dev_teacher_hash")
    response = client.post(
        "/quizzes?generate=true",
        json={
            "classroom_id": classroom.id,
            "lesson_id": lesson_id,
            "title": "Ignored by AI",
            "difficulty": "medium",
            "quiz_type": "metacognitive",
            "questions": [],
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["quiz_type"] == "metacognitive"
    assert recorded == {
        "lesson_title": "Fractions",
        "difficulty": "medium",
        "num_questions": 5,
        "quiz_type": "metacognitive",
        "concept_names": ["Equivalent Fractions"],
    }
    assert payload["questions"][0]["hints"] == [
        "Look for fractions that represent the same amount.",
        "Try simplifying each option pair before comparing them.",
        "Multiply or divide numerator and denominator by the same number.",
    ]
    assert payload["questions"][0]["concept_ids"] == [concept_id]


def test_student_hinted_attempt_uses_partial_credit_and_updates_zpd(
    client, session_factory
):
    teacher = create_user(
        session_factory,
        email="teacher@example.com",
        password="dev_teacher_hash",
        role="teacher",
    )
    student = create_user(
        session_factory,
        email="student@example.com",
        password="dev_student_hash",
        role="student",
    )
    classroom = create_classroom(
        session_factory,
        teacher_id=teacher.id,
        name="Science",
        code="SCI-1",
    )
    enroll_student(session_factory, classroom_id=classroom.id, student_id=student.id)

    with session_factory() as session:
        concept = Concept(
            classroom_id=classroom.id,
            name="Photosynthesis",
            description="How plants convert light into energy",
        )
        session.add(concept)
        session.flush()

        quiz = Quiz(
            classroom_id=classroom.id,
            title="Photosynthesis Check",
            difficulty="medium",
            quiz_type="standard",
            is_published=True,
            created_by_user_id=teacher.id,
            questions=[
                {
                    "question": "What gas do plants take in during photosynthesis?",
                    "options": ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
                    "correct_answer": "Carbon dioxide",
                    "explanation": "Plants use carbon dioxide and water to make glucose.",
                    "concept_ids": [concept.id],
                    "hints": [
                        "Think about the gas plants need from the air.",
                        "It is the gas animals breathe out.",
                        "It combines with water to form glucose in photosynthesis.",
                    ],
                },
                {
                    "question": "What is the main product plants make?",
                    "options": ["Salt", "Glucose", "Iron", "Plastic"],
                    "correct_answer": "Glucose",
                    "explanation": "Photosynthesis produces glucose as stored chemical energy.",
                    "concept_ids": [concept.id],
                    "hints": [
                        "Think about the food plants make.",
                        "It is a sugar used for energy storage.",
                        "It starts with 'glu'.",
                    ],
                },
            ],
        )
        session.add(quiz)
        session.commit()
        quiz_id = quiz.id
        concept_id = concept.id

    token = login(client, email="student@example.com", password="dev_student_hash")
    response = client.post(
        f"/quizzes/{quiz_id}/attempts",
        json={
            "answers": {
                "0": {
                    "selected_answer": "Oxygen",
                    "confidence_level": 2,
                    "hints_used": 0,
                },
                "1": {
                    "selected_answer": "Glucose",
                    "confidence_level": 3,
                    "hints_used": 2,
                },
            },
            "time_taken_seconds": 42,
        },
        headers=auth_headers(token),
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["score"] == pytest.approx(0.5)
    assert payload["max_score"] == 2
    assert payload["xp_earned"] == 5
    assert payload["calibration_score"] == pytest.approx(0.625)
    assert payload["responses"][1]["hints_used"] == 2
    assert payload["responses"][1]["awarded_xp"] == 5

    with session_factory() as session:
        responses = (
            session.query(QuizResponse)
            .order_by(QuizResponse.question_index)
            .all()
        )
        assert [r.hints_used for r in responses] == [0, 2]

        mastery = (
            session.query(StudentConceptMastery)
            .filter(
                StudentConceptMastery.student_id == student.id,
                StudentConceptMastery.concept_id == concept_id,
            )
            .one()
        )
        assert mastery.attempts == 2
        assert mastery.mastery_score == pytest.approx(0.15)
        assert mastery.unaided_mastery == pytest.approx(0.0)
        assert mastery.aided_mastery == pytest.approx(0.3)
        assert mastery.evidence[-1]["hints_used"] == 2
        assert mastery.evidence[-1]["credit_earned"] == pytest.approx(0.5)

        gamification = (
            session.query(Gamification)
            .filter(
                Gamification.user_id == student.id,
                Gamification.classroom_id == classroom.id,
            )
            .one()
        )
        assert gamification.xp == 5
