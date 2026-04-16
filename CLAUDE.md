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
npm run test:e2e          # Playwright E2E tests (headless)
npm run test:e2e:ui       # Playwright interactive UI
npm run test:e2e:headed   # Tests in visible browser
```

## Current Engineering Context

- Backend auth, classrooms, lessons, quizzes, and gamification routes exist.
- AI orchestration, adaptive logic, and analytics are scaffolded but not deeply implemented yet.
- The frontend already supports auth flows plus teacher and student dashboard routes.
- `ai-context.md` contains a short stack summary that can be used as quick reference.

## Frontend Design Skill

When building or modifying frontend UI, follow these guidelines to create distinctive, production-grade interfaces that avoid generic "AI slop" aesthetics.

### Design Thinking

Before coding any UI, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: EduNexus uses a refined dark-mode aesthetic with cyan/violet accents — maintain this identity but push it further with intentional, memorable details.
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

### Aesthetics Guidelines

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt for distinctive, characterful choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions. Focus on high-impact moments: one well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than solid colors. Gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, and grain overlays.

### What to AVOID

NEVER use generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Cliched color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and cookie-cutter component patterns
- Duplicated inline class strings — extract shared styles to utilities or CSS layers

### EduNexus-Specific Frontend Rules

- Extract duplicated patterns (card classes, button styles, loading states) into shared utilities or components.
- Use `frontend/lib/constants.js` for content format names, quiz types, and other magic strings.
- Prefer custom hooks (e.g., `useAsync`, `useFetch`) over repeating fetch/loading/error patterns in every page.
- Add `aria-label` attributes to all interactive elements. Use semantic HTML (`<figure>`, `<nav>`, `<main>`).
- Add keyboard navigation to interactive components (quiz answers, flashcards, concept graph).
- Use loading skeletons instead of plain "Loading..." text.

## Collaboration Default

If a task is broad, Claude Code should own implementation end to end. If you deliberately bring in Codex, use it as a focused debugger or reviewer unless the prompt explicitly asks for a larger build-out.
