# EduNexus Backend - FastAPI Service

This is the backend API for EduNexus.

Core stack:
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic

This README is the source of truth for local database setup and day-to-day DB operations.

## 1. Quick Start

From repo root:

```bash
cd backend
```

Use the project virtualenv (from `backend/`):

```bash
../.venv/bin/python --version
../.venv/bin/alembic --version
```

Current expected versions in this project:
- Python 3.9.x
- Alembic 1.16.x

Create local env file (first time only):

```bash
cp .env.example .env
```

## 2. Database Canonical Configuration

### 2.1 Active local DB target

The backend is configured to use:
- Host: `localhost`
- Port: `5432`
- Database: `edunexus`
- User: `postgres`
- Password: `postgres`

Connection URL:

```text
postgresql+psycopg2://postgres:postgres@localhost:5432/edunexus
```

SQLTools quick values:
- Connection name: `edunexus-local`
- Server/Host: `localhost`
- Port: `5432`
- Database: `edunexus`
- Username: `postgres`
- Password: `postgres`
- SSL: disabled (local)

### 2.2 Where this is defined

- Runtime env value: `backend/.env`
  - `DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/edunexus`
- Fallback app default: `backend/app/config.py`
  - `settings.database_url`
- Alembic runtime source: `backend/migrations/env.py`
  - `config.set_main_option("sqlalchemy.url", settings.database_url)`
- `backend/alembic.ini` has a placeholder URL only; Alembic actually uses `settings.database_url`.

## 3. Verify Postgres Is Up

If `psql` is in PATH:

```bash
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d edunexus -c "select 1;"
```

If using Postgres.app binaries directly:

```bash
PGPASSWORD=postgres /Applications/Postgres.app/Contents/Versions/17/bin/psql \
  -h localhost -p 5432 -U postgres -d edunexus -c "select 1;"
```

## 4. Alembic Runbook

Run from `backend/`:

```bash
../.venv/bin/alembic current
../.venv/bin/alembic heads
../.venv/bin/alembic history
../.venv/bin/alembic upgrade head
../.venv/bin/alembic downgrade -1
../.venv/bin/alembic check
```

Current expected head:
- `20260220_0002`

Current migration files:
- `backend/migrations/versions/20260202_0001_initial.py`
- `backend/migrations/versions/20260220_0002_expand_domain_schema.py`

### 4.1 Create a new migration

```bash
../.venv/bin/alembic revision --autogenerate -m "describe change"
../.venv/bin/alembic upgrade head
../.venv/bin/alembic check
```

Note:
- `backend/migrations/script.py.mako` exists and is required for `revision --autogenerate`.

## 5. Seed and Reset Data

### 5.1 Seed sample data

```bash
../.venv/bin/python scripts/seed.py
```

Seed script path:
- `backend/scripts/seed.py`

Seeded baseline includes:
- 1 teacher user + 1 student user
- 1 classroom + 1 enrollment
- 1 lesson + 1 quiz
- 1 quiz attempt + 2 quiz responses
- 2 gamification rows
- 1 analytics event

Seeded login credentials (dev only):
- `teacher@example.com` / `dev_teacher_hash`
- `student@example.com` / `dev_student_hash`

### 5.2 Reset schema + seed (clean local state)

```bash
../.venv/bin/alembic downgrade base
../.venv/bin/alembic upgrade head
../.venv/bin/python scripts/seed.py
```

## 6. Current Schema Overview

Main tables:
- `users`
- `classrooms`
- `classroom_enrollments`
- `lessons`
- `quizzes`
- `quiz_attempts`
- `quiz_responses`
- `gamification`
- `analytics_events`
- `alembic_version`

Domain notes:
- `users` includes role/auth/activity/timestamps.
- `classroom_enrollments` links students to classrooms.
- `quiz_attempts` and `quiz_responses` support adaptive quiz tracking.
- `gamification` is per `(classroom_id, user_id)`.
- `analytics_events` stores typed event payloads (`jsonb`).

## 7. Operational Troubleshooting

### 7.1 `Connection refused` on `5432`

Meaning:
- Postgres is not running on `localhost:5432`.

Action:
- Start local Postgres and retry the connectivity check in section 3.

### 7.2 `DuplicateTable: relation "users" already exists` during `upgrade head`

Meaning:
- Schema exists, but Alembic revision metadata is missing/desynced.

Action:
- Verify this is an existing DB you want to keep, then stamp:

```bash
../.venv/bin/alembic stamp 20260202_0001
../.venv/bin/alembic upgrade head
```

### 7.3 `alembic revision --autogenerate` fails with missing `script.py.mako`

Meaning:
- Migration template file is missing.

Action:
- Ensure `backend/migrations/script.py.mako` exists.

### 7.4 `alembic check` result interpretation

- `No new upgrade operations detected.` means ORM models and DB schema are aligned.

## 8. Daily DB Workflow (Recommended)

From `backend/`:

```bash
../.venv/bin/python scripts/db_health_check.py
../.venv/bin/alembic current
../.venv/bin/alembic upgrade head
../.venv/bin/alembic check
../.venv/bin/python scripts/seed.py   # optional, only if you need demo baseline data
```

`scripts/db_health_check.py` is the full validation pass. It checks:
- DB connectivity and target server/port
- Alembic head alignment
- expected tables and required columns
- orphan-row scan for FK integrity
- row counts snapshot
- write-path smoke test in a rollback transaction (no persistent data changes)

## 9. DB-backed API Architecture

The API is now DB-backed via:
- Routers: `backend/app/routers`
- Services: `backend/app/services`
- Repositories: `backend/app/repositories`
- Models: `backend/app/models`

No in-memory classroom/lesson/quiz stores are used anymore.
