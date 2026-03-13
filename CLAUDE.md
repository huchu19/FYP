# Claude Code Project Guide

As of March 3, 2026, Claude Code is the primary AI coding assistant for this repository.

Use Claude Code for:
- feature implementation
- refactors
- test creation and maintenance
- documentation updates
- cross-file architectural changes

Codex is still useful here, but as a secondary tool for:
- debugging difficult failures
- narrow code review
- second-opinion verification
- tracing regressions or database issues

## Project Overview

EduNexus is a monorepo for an AI-powered adaptive learning platform. The stack is:

- `backend/`: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- `frontend/`: Next.js App Router, React
- `docs/`: project documentation and report material

Start with [README.md](README.md) for the high-level project summary and [backend/README.md](backend/README.md) for the database runbook.

## Working Rules

- Keep the existing monorepo structure intact unless a change is explicitly justified.
- Treat `backend/README.md` as the source of truth for local database setup and migration workflow.
- Use Alembic for schema changes. Do not introduce Prisma or alternate schema tooling.
- SQLTools is for inspection and debugging only, not schema ownership.
- Preserve the role-based split between teacher and student flows across backend and frontend changes.
- Prefer small, reviewable diffs over broad speculative rewrites.

## Common Commands

Backend:

```bash
cd backend
../.venv/bin/python --version
../.venv/bin/alembic current
../.venv/bin/alembic upgrade head
../.venv/bin/python scripts/db_health_check.py
../.venv/bin/pytest tests/test_auth.py
```

Frontend:

```bash
cd frontend
npm run dev
npm run lint
npm run build
```

## Current Engineering Context

- Backend auth, classrooms, lessons, quizzes, and gamification routes exist.
- AI orchestration, adaptive logic, and analytics are scaffolded but not deeply implemented yet.
- The frontend already supports auth flows plus teacher and student dashboard routes.
- `ai-context.md` contains a short stack summary that can be used as quick reference.

## Collaboration Default

If a task is broad, Claude Code should own implementation end to end. If you deliberately bring in Codex, use it as a focused debugger or reviewer unless the prompt explicitly asks for a larger build-out.
