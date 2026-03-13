## Project Stack

- **Backend:** FastAPI (Python 3.9.x) with SQLAlchemy ORM, Alembic migrations
- **Frontend:** Next.js 16 (App Router) with React 19, Tailwind CSS 4
- **Database:** PostgreSQL (localhost:5432, database: `edunexus`)
- **Auth:** JWT (HS256) with bcrypt password hashing
- **AI:** OpenAI API (planned — `OPENAI_API_KEY` in `.env`)

## Request Lifecycle

```
HTTP Request
  → Router (backend/app/routers/) — route handler + FastAPI Depends()
    → Service (backend/app/services/) — business logic, authorization
      → Repository (backend/app/repositories/) — data access via SQLAlchemy
        → Model (backend/app/models/) — ORM ↔ PostgreSQL
  → Pydantic Schema (backend/app/schemas/) — response serialization
HTTP Response
```

Auth is injected via dependencies in `backend/app/core/security.py` and `dependencies.py`.

## Key Directories

| Path | Purpose |
|------|---------|
| `backend/app/routers/` | API endpoints (auth, classrooms, lessons, quizzes, gamification) |
| `backend/app/services/` | Business logic + 3 scaffolded services (ai, adaptive, analytics) |
| `backend/app/repositories/` | Data access layer (one per domain) |
| `backend/app/models/` | SQLAlchemy models (10 tables) |
| `backend/app/schemas/` | Pydantic request/response validation |
| `backend/app/core/` | Security (JWT, password hashing) and dependency injection |
| `backend/migrations/` | Alembic migrations (current HEAD: `20260220_0002`) |
| `frontend/app/` | Next.js App Router pages (auth, teacher dashboard, student dashboard) |
| `frontend/components/` | React components (auth, layout, ui, charts) |

## Agent Workflow

- **Claude Code** is the primary implementation assistant (as of March 3, 2026).
- **Codex** is a secondary tool for debugging, review, and verification.
- Root instructions: [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md)
- Database runbook: [backend/README.md](backend/README.md)

## Rules

- Alembic controls schema. No Prisma.
- SQLTools is for debugging only.
- Preserve monorepo split: `backend/` / `frontend/` / `docs/`
- Preserve teacher/student role separation.
- Prefer small, reviewable diffs.
