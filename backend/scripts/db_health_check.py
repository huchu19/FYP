"""
Comprehensive local database health check for EduNexus.

Usage:
    cd backend
    ../.venv/bin/python scripts/db_health_check.py
"""

import json
import os
import sys
from dataclasses import dataclass
from typing import Callable, Dict, List, Tuple

import sqlalchemy as sa
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy.engine import Engine

# Allow script execution with `python scripts/db_health_check.py`
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings  # noqa: E402


ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ALEMBIC_INI_PATH = os.path.join(ROOT_DIR, "alembic.ini")


@dataclass
class CheckResult:
    name: str
    passed: bool
    detail: str


def run_check(name: str, fn: Callable[[], str]) -> CheckResult:
    try:
        detail = fn()
        return CheckResult(name=name, passed=True, detail=detail)
    except Exception as exc:  # noqa: BLE001 - we want a full health summary
        return CheckResult(name=name, passed=False, detail=f"{type(exc).__name__}: {exc}")


def get_engine() -> Engine:
    return sa.create_engine(settings.database_url, future=True)


def check_connectivity(engine: Engine) -> str:
    with engine.connect() as conn:
        row = conn.execute(
            sa.text(
                "select current_database() as db, current_user as db_user, "
                "inet_server_addr() as server_addr, inet_server_port() as server_port"
            )
        ).mappings().one()
    return (
        f"db={row['db']}, user={row['db_user']}, "
        f"server={row['server_addr']}:{row['server_port']}"
    )


def check_alembic_alignment(engine: Engine) -> str:
    config = Config(ALEMBIC_INI_PATH)
    config.set_main_option("script_location", os.path.join(ROOT_DIR, "migrations"))
    script = ScriptDirectory.from_config(config)
    heads = sorted(script.get_heads())

    with engine.connect() as conn:
        db_rev = conn.execute(sa.text("select version_num from alembic_version")).scalar_one()

    if db_rev not in heads:
        raise RuntimeError(f"DB revision {db_rev} is not one of Alembic heads {heads}")

    return f"db_revision={db_rev}, heads={heads}"


def check_tables_exist(engine: Engine) -> str:
    expected = {
        "alembic_version",
        "users",
        "classrooms",
        "classroom_enrollments",
        "lessons",
        "quizzes",
        "quiz_attempts",
        "quiz_responses",
        "gamification",
        "analytics_events",
    }
    inspector = sa.inspect(engine)
    actual = set(inspector.get_table_names(schema="public"))
    missing = sorted(expected - actual)
    if missing:
        raise RuntimeError(f"Missing tables: {missing}")
    return f"all expected tables present ({len(expected)})"


def check_required_columns(engine: Engine) -> str:
    expected: Dict[str, List[str]] = {
        "users": ["id", "name", "email", "role", "password_hash", "is_active", "created_at", "updated_at"],
        "classrooms": ["id", "name", "code", "teacher_id", "description", "created_at", "updated_at"],
        "classroom_enrollments": ["id", "classroom_id", "student_id", "joined_at"],
        "lessons": [
            "id",
            "classroom_id",
            "title",
            "prompt",
            "outline",
            "body",
            "status",
            "generated_by_ai",
            "created_by_user_id",
            "published_at",
            "created_at",
            "updated_at",
        ],
        "quizzes": [
            "id",
            "classroom_id",
            "lesson_id",
            "title",
            "difficulty",
            "questions",
            "is_published",
            "created_by_user_id",
            "created_at",
            "updated_at",
        ],
        "quiz_attempts": [
            "id",
            "quiz_id",
            "student_id",
            "score",
            "max_score",
            "time_taken_seconds",
            "difficulty_snapshot",
            "feedback",
            "started_at",
            "completed_at",
        ],
        "quiz_responses": [
            "id",
            "attempt_id",
            "question_index",
            "question_payload",
            "selected_answer",
            "is_correct",
            "awarded_xp",
            "answered_at",
        ],
        "gamification": [
            "id",
            "user_id",
            "classroom_id",
            "xp",
            "badges",
            "streak_days",
            "last_activity_at",
            "updated_at",
        ],
        "analytics_events": ["id", "user_id", "classroom_id", "event_type", "payload", "created_at"],
    }

    inspector = sa.inspect(engine)
    for table, required_cols in expected.items():
        actual_cols = {col["name"] for col in inspector.get_columns(table, schema="public")}
        missing = sorted(set(required_cols) - actual_cols)
        if missing:
            raise RuntimeError(f"{table} missing columns: {missing}")
    return f"required columns verified for {len(expected)} tables"


def check_orphan_rows(engine: Engine) -> str:
    orphan_queries: List[Tuple[str, str]] = [
        (
            "classrooms.teacher_id -> users.id",
            "select count(*) from classrooms c left join users u on u.id = c.teacher_id where u.id is null",
        ),
        (
            "classroom_enrollments.classroom_id -> classrooms.id",
            "select count(*) from classroom_enrollments e left join classrooms c on c.id = e.classroom_id where c.id is null",
        ),
        (
            "classroom_enrollments.student_id -> users.id",
            "select count(*) from classroom_enrollments e left join users u on u.id = e.student_id where u.id is null",
        ),
        (
            "lessons.classroom_id -> classrooms.id",
            "select count(*) from lessons l left join classrooms c on c.id = l.classroom_id where c.id is null",
        ),
        (
            "lessons.created_by_user_id -> users.id",
            "select count(*) from lessons l left join users u on u.id = l.created_by_user_id "
            "where l.created_by_user_id is not null and u.id is null",
        ),
        (
            "quizzes.classroom_id -> classrooms.id",
            "select count(*) from quizzes q left join classrooms c on c.id = q.classroom_id where c.id is null",
        ),
        (
            "quizzes.lesson_id -> lessons.id",
            "select count(*) from quizzes q left join lessons l on l.id = q.lesson_id "
            "where q.lesson_id is not null and l.id is null",
        ),
        (
            "quizzes.created_by_user_id -> users.id",
            "select count(*) from quizzes q left join users u on u.id = q.created_by_user_id "
            "where q.created_by_user_id is not null and u.id is null",
        ),
        (
            "quiz_attempts.quiz_id -> quizzes.id",
            "select count(*) from quiz_attempts a left join quizzes q on q.id = a.quiz_id where q.id is null",
        ),
        (
            "quiz_attempts.student_id -> users.id",
            "select count(*) from quiz_attempts a left join users u on u.id = a.student_id where u.id is null",
        ),
        (
            "quiz_responses.attempt_id -> quiz_attempts.id",
            "select count(*) from quiz_responses r left join quiz_attempts a on a.id = r.attempt_id where a.id is null",
        ),
        (
            "gamification.user_id -> users.id",
            "select count(*) from gamification g left join users u on u.id = g.user_id where u.id is null",
        ),
        (
            "gamification.classroom_id -> classrooms.id",
            "select count(*) from gamification g left join classrooms c on c.id = g.classroom_id where c.id is null",
        ),
        (
            "analytics_events.user_id -> users.id",
            "select count(*) from analytics_events e left join users u on u.id = e.user_id "
            "where e.user_id is not null and u.id is null",
        ),
        (
            "analytics_events.classroom_id -> classrooms.id",
            "select count(*) from analytics_events e left join classrooms c on c.id = e.classroom_id "
            "where e.classroom_id is not null and c.id is null",
        ),
    ]

    failed: List[str] = []
    with engine.connect() as conn:
        for label, query in orphan_queries:
            count = int(conn.execute(sa.text(query)).scalar_one())
            if count != 0:
                failed.append(f"{label}: {count}")

    if failed:
        raise RuntimeError("Orphan rows found -> " + ", ".join(failed))
    return f"no orphan rows across {len(orphan_queries)} FK-style checks"


def check_row_counts(engine: Engine) -> str:
    tables = [
        "users",
        "classrooms",
        "classroom_enrollments",
        "lessons",
        "quizzes",
        "quiz_attempts",
        "quiz_responses",
        "gamification",
        "analytics_events",
    ]
    parts: List[str] = []
    with engine.connect() as conn:
        for table in tables:
            count = int(conn.execute(sa.text(f"select count(*) from {table}")).scalar_one())
            parts.append(f"{table}={count}")
    return ", ".join(parts)


def check_write_path_rollback(engine: Engine) -> str:
    marker = "hc_" + os.urandom(4).hex()
    conn = engine.connect()
    trans = conn.begin()
    try:
        teacher_id = int(
            conn.execute(
                sa.text(
                    "insert into users (name, email, role, password_hash, is_active) "
                    "values (:name, :email, 'teacher', :password_hash, true) returning id"
                ),
                {"name": "Health Teacher", "email": f"{marker}_teacher@example.com", "password_hash": "x"},
            ).scalar_one()
        )

        student_id = int(
            conn.execute(
                sa.text(
                    "insert into users (name, email, role, password_hash, is_active) "
                    "values (:name, :email, 'student', :password_hash, true) returning id"
                ),
                {"name": "Health Student", "email": f"{marker}_student@example.com", "password_hash": "x"},
            ).scalar_one()
        )

        classroom_id = int(
            conn.execute(
                sa.text(
                    "insert into classrooms (name, code, teacher_id, description) "
                    "values (:name, :code, :teacher_id, :description) returning id"
                ),
                {
                    "name": "Health Classroom",
                    "code": marker.upper(),
                    "teacher_id": teacher_id,
                    "description": "health check classroom",
                },
            ).scalar_one()
        )

        conn.execute(
            sa.text(
                "insert into classroom_enrollments (classroom_id, student_id) "
                "values (:classroom_id, :student_id)"
            ),
            {"classroom_id": classroom_id, "student_id": student_id},
        )

        lesson_id = int(
            conn.execute(
                sa.text(
                    "insert into lessons "
                    "(classroom_id, title, prompt, outline, body, status, generated_by_ai, created_by_user_id) "
                    "values (:classroom_id, :title, :prompt, :outline, :body, :status, :generated_by_ai, :created_by_user_id) "
                    "returning id"
                ),
                {
                    "classroom_id": classroom_id,
                    "title": "Health Lesson",
                    "prompt": "Health prompt",
                    "outline": ["point_a", "point_b"],
                    "body": "Health body",
                    "status": "draft",
                    "generated_by_ai": False,
                    "created_by_user_id": teacher_id,
                },
            ).scalar_one()
        )

        quiz_id = int(
            conn.execute(
                sa.text(
                    "insert into quizzes "
                    "(classroom_id, lesson_id, title, difficulty, questions, is_published, created_by_user_id) "
                    "values (:classroom_id, :lesson_id, :title, :difficulty, cast(:questions as jsonb), "
                    ":is_published, :created_by_user_id) returning id"
                ),
                {
                    "classroom_id": classroom_id,
                    "lesson_id": lesson_id,
                    "title": "Health Quiz",
                    "difficulty": "easy",
                    "questions": json.dumps([{"q": "2+2?", "answer": "4"}]),
                    "is_published": False,
                    "created_by_user_id": teacher_id,
                },
            ).scalar_one()
        )

        attempt_id = int(
            conn.execute(
                sa.text(
                    "insert into quiz_attempts "
                    "(quiz_id, student_id, score, max_score, time_taken_seconds, difficulty_snapshot, feedback) "
                    "values (:quiz_id, :student_id, :score, :max_score, :time_taken_seconds, :difficulty_snapshot, "
                    "cast(:feedback as jsonb)) returning id"
                ),
                {
                    "quiz_id": quiz_id,
                    "student_id": student_id,
                    "score": 1,
                    "max_score": 1,
                    "time_taken_seconds": 10,
                    "difficulty_snapshot": "easy",
                    "feedback": json.dumps({"message": "ok"}),
                },
            ).scalar_one()
        )

        conn.execute(
            sa.text(
                "insert into quiz_responses "
                "(attempt_id, question_index, question_payload, selected_answer, is_correct, awarded_xp) "
                "values (:attempt_id, :question_index, cast(:question_payload as jsonb), :selected_answer, "
                ":is_correct, :awarded_xp)"
            ),
            {
                "attempt_id": attempt_id,
                "question_index": 0,
                "question_payload": json.dumps({"q": "2+2?"}),
                "selected_answer": "4",
                "is_correct": True,
                "awarded_xp": 10,
            },
        )

        conn.execute(
            sa.text(
                "insert into gamification "
                "(user_id, classroom_id, xp, badges, streak_days) "
                "values (:user_id, :classroom_id, :xp, cast(:badges as jsonb), :streak_days)"
            ),
            {
                "user_id": student_id,
                "classroom_id": classroom_id,
                "xp": 10,
                "badges": json.dumps(["health"]),
                "streak_days": 1,
            },
        )

        conn.execute(
            sa.text(
                "insert into analytics_events "
                "(user_id, classroom_id, event_type, payload) "
                "values (:user_id, :classroom_id, :event_type, cast(:payload as jsonb))"
            ),
            {
                "user_id": student_id,
                "classroom_id": classroom_id,
                "event_type": "health_check_event",
                "payload": json.dumps({"ok": True}),
            },
        )

        return "inserted rows across all domain tables within transaction"
    finally:
        trans.rollback()
        conn.close()


def main() -> int:
    print("EduNexus DB health check")
    print(f"DATABASE_URL={settings.database_url}")
    print("-" * 72)

    engine = get_engine()
    checks = [
        ("connectivity", lambda: check_connectivity(engine)),
        ("alembic alignment", lambda: check_alembic_alignment(engine)),
        ("expected tables", lambda: check_tables_exist(engine)),
        ("required columns", lambda: check_required_columns(engine)),
        ("orphan row scan", lambda: check_orphan_rows(engine)),
        ("row counts", lambda: check_row_counts(engine)),
        ("write-path smoke (rollback)", lambda: check_write_path_rollback(engine)),
    ]

    results: List[CheckResult] = [run_check(name, fn) for name, fn in checks]

    passed = 0
    for result in results:
        status = "PASS" if result.passed else "FAIL"
        print(f"[{status}] {result.name}: {result.detail}")
        if result.passed:
            passed += 1

    print("-" * 72)
    print(f"Summary: {passed}/{len(results)} checks passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
