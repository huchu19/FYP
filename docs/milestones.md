# Milestones and Deliverables – EduNexus

This list is aligned with the official project definition and plan.
Status updated as of March 3, 2026.

## Milestone 1 – Literature Review and Requirements ✓

- [x] Complete literature review on AI in education, adaptive learning, and gamification.
- [ ] Produce `literature_review_notes.md`.
- [x] Conduct initial user research (interviews / questionnaires).
- [x] Produce `requirements.md` with functional and non-functional requirements.

## Milestone 2 – Architecture and Database Schema ✓

- [x] Finalise high-level system architecture.
- [x] Design database schema (entities and relationships).
- [x] Document architecture in `system_architecture.md`.
- [x] Implement schema via Alembic migrations (`20260202_0001_initial`, `20260220_0002_expand_domain_schema`).

Current schema covers: users, classrooms, classroom_enrollments, lessons, quizzes, quiz_attempts, quiz_responses, gamification, analytics_events.

## Milestone 3 – MVP: Core Classroom and AI Lesson Generation (In Progress)

- [x] Implement FastAPI backend skeleton and core models.
- [x] Implement repository layer (user, classroom, lesson, quiz, gamification).
- [x] Implement service layer with role-based authorization.
- [x] Implement JWT authentication (register, login, token validation).
- [x] Implement classroom CRUD and enrollment.
- [x] Implement lesson and quiz CRUD.
- [x] Implement basic Next.js frontend with teacher and student dashboards.
- [x] Implement auth flows (login, register, protected routes).
- [x] Implement classroom creation and lesson creation UI.
- [x] Integrate AI lesson generation from teacher prompts (Gemini 2.5 Flash).
- [x] Integrate AI quiz generation from lesson content (auto-generates MCQs).
- [ ] Demonstrate end-to-end flow: Teacher → prompt → AI lesson → published → student views.

## Milestone 4 – Adaptive Learning and Gamification

- [x] Database schema for quiz_attempts, quiz_responses, and gamification (tables exist).
- [x] Basic gamification service (XP tracking, badge storage).
- [ ] Implement adaptive quiz logic in the backend (`services/adaptive.py` is scaffolded).
- [ ] Implement XP award triggers (on quiz completion, streaks, etc.).
- [ ] Implement badge assignment logic.
- [ ] Implement leaderboard queries.
- [ ] Update frontend to support adaptive quizzes and gamification UI.

## Milestone 5 – Dashboards, Analytics, and Accessibility

- [x] Frontend dashboard pages exist for teacher and student.
- [x] Chart components scaffolded in `frontend/components/charts/`.
- [ ] Implement analytics query service (`services/analytics.py` is scaffolded).
- [ ] Wire dashboard data to real analytics endpoints.
- [ ] Improve responsiveness and accessibility of the UI.
- [ ] Add basic multilingual support or stubs (FR19).
- [ ] Add text-to-speech integration or stubs (FR20).

### Stretch: Embeddings and Semantic Features

Future refinement using OpenAI `text-embedding-3-small` ($0.02/1M tokens) + PostgreSQL `pgvector` extension:

- [ ] Duplicate detection — flag when a teacher creates a lesson similar to an existing one.
- [ ] Smart content linking — auto-suggest related lessons to students based on what they've studied.
- [ ] Adaptive question retrieval — find quiz questions semantically similar to ones a student struggled with.

## Milestone 6 – Evaluation, LMS Integration, and Final Report

- [ ] Conduct user testing with teachers and students.
- [ ] Collect usage data and feedback.
- [ ] Analyse results against research questions.
- [ ] Implement a minimal LMS integration (e.g. SCORM-related data export or design).
- [ ] Complete final project report and prepare demo.
