# Auth V1 Smoke Test

## Setup

1. From the repo root, install backend dependencies:
   `cd backend && ../.venv/bin/pip install -r requirements.txt`
2. Verify the database is healthy:
   `cd backend && ../.venv/bin/python scripts/db_health_check.py`
3. Apply any pending migrations:
   `cd backend && ../.venv/bin/alembic upgrade head`
4. Start the backend and frontend in separate terminals.

## Manual API Checks

1. Log in as teacher:
   `POST /auth/login` with `{"email":"teacher@example.com","password":"dev_teacher_hash"}`
   Expect `200` and an `access_token`.
2. Fetch current user:
   `GET /auth/me` with `Authorization: Bearer <token>`
   Expect the teacher payload.
3. Create classroom without auth:
   `POST /classrooms` with `{"name":"Physics 101","code":"PHYS-101","description":"Intro physics"}`
   Expect `401`.
4. Create classroom as student:
   Log in as `student@example.com / dev_student_hash`, then call the same endpoint.
   Expect `403`.
5. Create classroom as teacher:
   Use the teacher token and the same payload.
   Expect `201` and a classroom payload containing `teacher_id`.
6. Fetch scoped classroom list:
   `GET /classrooms` with a teacher token should return only that teacher's classrooms.
   `GET /classrooms` with a student token should return only enrolled classrooms.

## Manual UI Checks

1. Open `/teacher` while logged out.
   Expect redirect to `/login`.
2. Log in at `/login` with `teacher@example.com / dev_teacher_hash`.
   Expect redirect to `/teacher`, authenticated navbar state, and classroom list load.
3. Submit an invalid password on `/login`.
   Expect inline error text and no redirect.
4. Create a classroom from `/teacher/classrooms/new`.
   Expect success redirect to `/teacher/classrooms/{id}` and API-backed classroom details.
5. Create a new student at `/register`.
   Expect auto-login and redirect to `/student`.
6. Log in as a student, then open `/teacher`.
   Expect redirect to `/student`.

## Automated Backend Tests

1. From `backend/`, run:
   `../.venv/bin/pytest tests/test_auth.py`
2. Expected coverage includes:
   register/login/current-user,
   missing or bad tokens,
   student rejection on teacher-only classroom creation,
   teacher classroom ownership scoping,
   legacy password rehash on login,
   authenticated teacher lesson-route access.
