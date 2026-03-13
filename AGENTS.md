# Project Agent Workflow

## Primary: Claude Code

As of March 3, 2026, **Claude Code** is the primary AI coding assistant for this repository.

Claude Code handles:
- Feature implementation (end-to-end)
- Refactors and architectural changes
- Test creation and maintenance
- Documentation updates
- Database migrations and schema changes
- Cross-file changes across backend and frontend

Full instructions, working rules, and common commands are in [CLAUDE.md](CLAUDE.md).

## Secondary: Codex

Codex is available as a **focused secondary tool**. Use it when you need:
- A second opinion on a tricky bug or regression
- Targeted code review of a specific change
- Debugging a narrow failure (e.g., a failing test, a DB issue)
- Tracing unexpected behavior through a specific code path

Codex should **not** be used for broad implementation unless explicitly requested. If Codex encounters a task that requires multi-file changes or architectural decisions, defer to Claude Code.

## When to use which

| Task | Use |
|------|-----|
| Implement a new feature | Claude Code |
| Fix a bug you can't reproduce | Codex (focused debugging) |
| Write or update tests | Claude Code |
| Review a specific diff | Codex |
| Database migration | Claude Code |
| Trace a regression | Codex |
| Refactor across files | Claude Code |
| Verify a fix works | Codex |

## Project context

- [CLAUDE.md](CLAUDE.md) — Primary instructions, working rules, common commands
- [README.md](README.md) — Project overview and monorepo structure
- [backend/README.md](backend/README.md) — Database runbook (source of truth for DB setup)
- [ai-context.md](ai-context.md) — Quick stack reference

## Project rules (apply to all agents)

- Alembic is the schema authority. Do not introduce Prisma or alternate schema tooling.
- SQLTools is for inspection and debugging only, not schema ownership.
- Preserve the `backend/` / `frontend/` / `docs/` monorepo split.
- Preserve the teacher/student role separation across backend and frontend.
- Prefer small, reviewable diffs over broad speculative rewrites.
