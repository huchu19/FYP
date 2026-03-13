from datetime import datetime
from types import SimpleNamespace
from typing import Optional

import pytest

pytest.importorskip("bcrypt")
pytest.importorskip("jwt")
pytest.importorskip("httpx")

from app.core.security import create_access_token, decode_access_token, hash_password
from app.models.classroom import Classroom
from app.models.classroom_enrollment import ClassroomEnrollment
from app.models.user import User
from app.routers import lessons as lessons_router


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
