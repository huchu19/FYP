# EduNexus – AI-Powered Adaptive Learning Platform

Hussain Naqvi's Final-Year Project, Queen Mary University of London (EECS).

EduNexus is a web platform that uses AI to generate educational content, adaptively assess students, and provide transparent insight into learner understanding. Inspired by Luckin's (2017) AIAssess model, the platform implements an Open Learner Model where assessment happens continuously in the background — not through "stop and test" exams.

## What It Does

| Area | Description |
|------|-------------|
| **AI Content Generation** | Teachers type a prompt; Gemini 2.5 Flash generates draft lessons (slides, PDF reports, presentations, flashcards) and quizzes (standard, Kahoot-style, metacognitive) |
| **Adaptive Assessment** | Difficulty adjusts based on recent performance; metacognitive question types (explain-reasoning, error analysis, transfer) capture how students think |
| **Knowledge Graph** | AI extracts concepts and prerequisites from lessons; interactive force-directed graph shows mastery per concept with blind-spot detection |
| **Gamification** | XP awards, streak tracking, 9 badge types (including metacognition badges), classroom leaderboards |
| **Open Learner Model** | Student progress dashboard with score trends, topic mastery, confidence calibration insights, and post-quiz reflections |
| **Analytics** | Teacher dashboards with per-student process data (confidence, reasoning steps, time-on-task) and class-aggregate summaries |
| **Accessibility** | Dark/light theme, i18n stubs (EN + FR), browser-native text-to-speech, semantic HTML, skip links, focus outlines |
| **Planned Teacher Authoring Controls** | Teachers will be able to iteratively refine AI-generated lessons (add/remove/rewrite sections) and attach a classroom syllabus so future lesson generation aligns with that curriculum context |

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌────────────┐
│  Next.js 16  │────▶│  FastAPI (Python) │────▶│ PostgreSQL │
│  React 19    │     │  SQLAlchemy       │     │  Alembic   │
│  Tailwind 4  │     │  Pydantic         │     └────────────┘
└─────────────┘     └────────┬──────────┘
                             │
                    ┌────────▼──────────┐
                    │  AI Providers      │
                    │  Gemini 2.5 Flash  │
                    │  OpenAI (fallback) │
                    └───────────────────┘
```

## Monorepo Structure

```
/backend    FastAPI app (routers, services, repositories, models, migrations)
/frontend   Next.js app (App Router, teacher & student dashboards, components)
/docs       Project documentation (requirements, architecture, milestones, report)
```

## Testing

- **Backend:** `cd backend && ../.venv/bin/pytest tests/` (auth/classroom integration tests)
- **Frontend E2E:** `cd frontend && npm run test:e2e` (Playwright: auth, teacher flow, student flow, navigation)

See [frontend/README.md](frontend/README.md) for Playwright setup and [backend/README.md](backend/README.md) for database runbook.

## Getting Started (Dev)

1. Clone the repo.
2. Set up local PostgreSQL (see [backend/README.md](backend/README.md) for connection details).
3. `cd backend && ../.venv/bin/alembic upgrade head` to apply migrations.
4. `cd frontend && npm install && npm run dev` to start the frontend.
5. See [docs/milestones.md](docs/milestones.md) for project status.
