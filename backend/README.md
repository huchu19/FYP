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
- `20260331_0006`

Current migration files:
- `backend/migrations/versions/20260202_0001_initial.py`
- `backend/migrations/versions/20260220_0002_expand_domain_schema.py`
- `backend/migrations/versions/20260315_0003_metacognition_content_formats.py`
- `backend/migrations/versions/20260315_0004_cascade_deletes.py`
- `backend/migrations/versions/20260324_0005_knowledge_graph.py`
- `backend/migrations/versions/20260331_0006_student_model_evidence.py`

### 4.1 Create a new migration

```bash
../.venv/bin/alembic revision --autogenerate -m "describe change"
../.venv/bin/alembic upgrade head
../.venv/bin/alembic check
```

Note:
- `backend/migrations/script.py.mako` exists and is required for `revision --autogenerate`.

## 5. Reset Data

### 5.1 Reset schema to clean state

```bash
../.venv/bin/alembic downgrade base
../.venv/bin/alembic upgrade head
```

After reset, register accounts via the `/register` endpoint or the frontend auth flow.

## 6. Current Schema Overview

Main tables:
- `users` — role (teacher/student), auth, timestamps
- `classrooms` — teacher-owned, join codes
- `classroom_enrollments` — student ↔ classroom link
- `lessons` — AI-generated content (slides/PDF/presentation/flashcards), prompt, outline, body
- `quizzes` — standard/kahoot/metacognitive types, JSONB question payloads
- `quiz_attempts` — score, time, difficulty snapshot, reflection, self-rated understanding
- `quiz_responses` — per-question answer, correctness, confidence (1-5), reasoning text, reasoning steps (JSONB)
- `gamification` — per (user, classroom): XP, badges (JSONB), streak days, last activity
- `analytics_events` — typed event log with JSONB payloads
- `concepts` — knowledge graph nodes, per classroom, linked to lessons
- `concept_prerequisites` — directed prerequisite edges between concepts
- `student_concept_mastery` — per (student, concept): mastery score (0-1), attempt count
- `alembic_version`

### Service layer

```
routers/         → HTTP endpoints (auth, classrooms, lessons, quizzes, quiz_attempts, analytics, knowledge_graph)
services/        → Business logic (lesson, quiz, quiz_attempt, adaptive, analytics, ai, knowledge_graph)
repositories/    → Database queries (user, classroom, lesson, quiz, quiz_attempt, gamification)
models/          → SQLAlchemy ORM models
schemas/         → Pydantic request/response schemas
```

### AI providers

- Primary: Google Gemini 2.5 Flash (free tier)
- Fallback: OpenAI GPT-4o-mini
- Used for: lesson generation, quiz generation, flashcard generation, concept graph extraction

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

## 10. API Documentation

FastAPI auto-generates interactive API docs. When the backend is running:

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

These reflect the current state of all registered routes, request/response schemas, and auth requirements.
