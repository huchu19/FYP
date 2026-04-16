# Milestones and Deliverables – EduNexus

This list is aligned with the official project definition and plan.
Status updated as of April 3, 2026.

## Milestone 1 – Literature Review and Requirements ✓

- [x] Complete literature review on AI in education, adaptive learning, and gamification.
- [x] Produce `literature_review_notes.md`.
- [x] Conduct initial user research (interviews / questionnaires).
- [x] Produce `requirements.md` with functional and non-functional requirements.

## Milestone 2 – Architecture and Database Schema ✓

- [x] Finalise high-level system architecture.
- [x] Design database schema (entities and relationships).
- [x] Document architecture in `system_architecture.md`.
- [x] Implement schema via Alembic migrations (`20260202_0001_initial`, `20260220_0002_expand_domain_schema`).

Current schema covers: users, classrooms, classroom_enrollments, lessons, quizzes, quiz_attempts, quiz_responses, gamification, analytics_events.

## Milestone 3 – MVP: Core Classroom and AI Lesson Generation ✓

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
- [x] Demonstrate end-to-end flow: Teacher → prompt → AI lesson → published → student views.
- [x] Slide-style lesson viewer with Markdown rendering.
- [x] Interactive student quiz-taking UI with scoring.
- [x] Teacher-defined content format selection (slides/PDF/presentation/flashcards).
- [x] Flashcard generation from lesson content.
- [x] Kahoot-style interactive quiz mode.

## Milestone 4 – Adaptive Learning and Gamification ✓

- [x] Database schema for quiz_attempts, quiz_responses, and gamification (tables exist).
- [x] Basic gamification service (XP tracking, badge storage).
- [x] Implement adaptive quiz logic in the backend (threshold-based difficulty adjustment in `services/adaptive.py`).
- [x] Implement XP award triggers (on quiz completion: 10 XP per correct, 20 XP perfect bonus).
- [x] Implement badge assignment logic (first_quiz, perfect_score badges).
- [x] Implement leaderboard queries.
- [x] Quiz attempt submission with server-side scoring and XP display.
- [x] Update frontend to support adaptive quizzes and gamification UI.
- [x] Confidence rating per quiz question with calibration feedback.
- [x] Post-quiz reflection prompts.
- [x] Metacognitive quiz question types (explain-reasoning, multi-step, error analysis, transfer).
- [x] Student problem-solving process tracking (time, answer revisions, reasoning).
- [x] Teacher view of student problem-solving steps (backend endpoint; frontend UI pending).
- [x] Metacognition badges (good_calibration, reflective_learner, growth_mindset).

## Milestone 5 – Dashboards, Analytics, and Accessibility ✓

- [x] Frontend dashboard pages exist for teacher and student.
- [x] Chart components scaffolded in `frontend/components/charts/`.
- [x] Implement analytics query service (quiz history, calibration, topic mastery, class summary in `services/analytics.py`).
- [x] Wire dashboard data to real analytics endpoints.
- [x] Student Open Learner Model / progress dashboard (score trends, topic mastery, calibration insights, reflections).
- [x] Teacher per-student analytics with process data (backend endpoint implemented).
- [x] Analytics event logging infrastructure (model and `log_event()` exist; not yet actively called from services).
- [x] Teacher per-student analytics UI (dedicated page for viewing individual student process data).
- [x] Active analytics event logging from quiz/lesson services.
- [x] Persistent streak tracking (backend logic to update `streak_days` on consecutive activity).
- [x] Improve responsiveness and accessibility of the UI.
- [x] Add basic multilingual support or stubs (FR19).
- [x] Add text-to-speech integration or stubs (FR20).

### Stretch: Embeddings and Semantic Features

Future refinement using OpenAI `text-embedding-3-small` ($0.02/1M tokens) + PostgreSQL `pgvector` extension:

- [ ] Duplicate detection — flag when a teacher creates a lesson similar to an existing one.
- [ ] Smart content linking — auto-suggest related lessons to students based on what they've studied.
- [ ] Adaptive question retrieval — find quiz questions semantically similar to ones a student struggled with.

## Milestone 5a – Metacognition Features

### Knowledge Graph Visualizer

- [x] Design `Concept`, `ConceptPrerequisite`, and `StudentConceptMastery` models.
- [x] Implement Alembic migration for concept tables.
- [x] Add concept tagging to quiz question payloads (`concept_ids`).
- [x] Implement AI concept graph extraction from lesson content (`AIService.generate_concept_graph`).
- [x] Implement concept CRUD endpoints (list, create, generate).
- [x] Implement graph query endpoint returning nodes (concepts + mastery) and edges (prerequisites).
- [x] Implement blind-spot detection endpoint (low-mastery prerequisites).
- [x] Build interactive graph visualization (student view) with mastery colour-coding.
- [x] Build class-aggregate concept heatmap (teacher view).

### Formative Assessment

- [x] Extend `quiz_type` enum with `diagnostic` and `formative` types.
- [ ] Implement prerequisite check endpoint (auto-generates short diagnostic from lesson prerequisites) — deferred until post-refinement.
- [ ] Implement pulse check endpoint (mid-lesson 1–3 question checks) — deferred until post-refinement.
- [x] Implement concept inventory endpoint with adaptive question selection.
- [x] Add `FormativeAssessment` model (lighter than QuizAttempt, with assessment type and recommended actions).
- [ ] Add `generate_diagnostic_questions` and `select_next_question` to AIService — deferred until post-refinement.
- [ ] Build prerequisite check modal UI (pre-lesson flow) — deferred until post-refinement.
- [ ] Build inline pulse check component (embedded in lesson viewer) — deferred until post-refinement.
- [x] Build concept inventory page with adaptive question flow and mastery report.

### Peer Teaching Simulator

- [x] Design `TeachingSession` model (conversation JSONB, AI assessment JSONB).
- [x] Implement Alembic migration for teaching sessions.
- [x] Implement AI "confused learner" conversation logic with system prompts.
- [x] Implement teaching quality assessment (completeness, accuracy, clarity, depth).
- [x] Implement teaching session endpoints (start, message, complete, list, detail).
- [x] Add teaching-related badges (`first_teaching`, `clear_explainer`, `patient_teacher`).
- [x] Build teach-back chat UI with message-style interface.
- [x] Build assessment results view (radar/bar chart of quality scores).

## Milestone 5b – AIAssess-Inspired Open Learner Model

Inspired by Luckin (2017) "Towards AI-based assessment systems". The AIAssess model has three components — a Knowledge Component (domain model with solution steps), an Analytics Component (fine-grained interaction logging), and a Student Model Component (constantly updating judgements about knowledge, development potential, and metacognitive awareness). The output is an Open Learner Model (OLM) — a transparent, interrogable visualisation.

### Phase 1 — Wire the Student Model

- [x] Add `concept_ids` to AI-generated quiz question payloads so each question maps to knowledge graph concepts.
- [x] Call `update_mastery()` during quiz submission to update `StudentConceptMastery` from quiz responses.
- [x] Add `evidence` JSONB to `StudentConceptMastery` storing the last N data points (attempt_id, correctness, confidence, timestamp) so every mastery judgement is traceable.
- [x] Add persistent `metacognitive_score` per student-concept, computed from calibration accuracy and self-assessment accuracy over time.

### Phase 2 — Scaffolded Hints and ZPD Assessment

- [x] Extend AI quiz generation to include progressive `hints` (level 1/2/3) per question.
- [x] Add `hints_used` field to `QuizResponse` model; partial credit scoring based on hint usage.
- [x] Compute ZPD per concept: `unaided_mastery` (no hints) vs `aided_mastery` (with hints); store both on `StudentConceptMastery`.
- [x] Build hint UI in student quiz view ("Need a hint?" progressive reveal matching Luckin's Figure 1).

### Phase 3 — Open Learner Model Dashboard

- [x] Build unified student OLM page: knowledge graph (mastery colours) + metacognitive awareness gauge + ZPD indicators per concept.
- [x] Click any concept node → evidence trail showing which quiz responses influenced the mastery score.
- [x] Build teacher OLM view: per-student OLM with evidence tracing + class-aggregate heatmap.
- [x] Flag students whose self-assessment diverges from actual performance (overconfident/underconfident alerts).

## Milestone 5c – Concept-Driven Adaptive Loop

- [x] Implement weighted concept priority algorithm (prerequisite criticality, mastery deficit, ZPD readiness, recency).
- [x] Implement practice quiz generation targeting weak concepts via AI concept inventory.
- [x] Add practice-targets and practice-quiz API endpoints.
- [x] Build PracticeTargetsPanel component with category badges and reason text.
- [x] Wire Practice Weak Concepts flow into student Knowledge Map page.
- [x] Add "Return to Knowledge Map" link on quiz results page to close the loop.

## Milestone 6a – Teacher Agency and Content Control

### Concept Management

- [x] Add manual concept create/edit/delete endpoints to knowledge graph router.
- [x] Add prerequisite management endpoints (add/remove edges).
- [x] Build concept management UI on teacher knowledge graph page.

### Lesson Authoring Control

- [x] Make lesson prompt field optional to support manual authoring.
- [x] Add standalone text extraction endpoint for reference documents.
- [x] Feed uploaded document text into AI lesson generation as reference context.
- [x] Add manual authoring mode to lesson creation page (title, body, format — no AI).
- [x] Add reference document upload in AI generation mode.

### Quiz Editing and Manual Creation

- [x] Add PATCH endpoint for quiz content updates (title, questions, difficulty, type).
- [x] Build editable question cards with inline editing of text, options, answer, hints.
- [x] Add question add/delete/reorder controls.
- [x] Build manual quiz creation page with question builder.
- [x] Extract shared QuestionEditor component.

## Milestone 6 – Evaluation, LMS Integration, and Final Report

- [ ] Add classroom syllabus / curriculum profile support so lesson generation is constrained by class-level context.
- [ ] Conduct user testing with teachers and students.
- [ ] Collect usage data and feedback.
- [ ] Analyse results against research questions.
- [ ] Implement a minimal LMS integration (e.g. SCORM-related data export or design).
- [ ] Complete final project report and prepare demo.
