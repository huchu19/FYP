# Chapter 6: Testing and Evaluation

This chapter describes the testing strategy used to verify the correctness and completeness of EduNexus. Testing was carried out at multiple levels: unit tests for the backend security and auth layer using pytest, integration-style tests that exercise the full FastAPI stack against a real in-memory database, Playwright end-to-end tests for the frontend, manual smoke tests for the AI-powered flows, and a structured scenario walkthrough. The chapter concludes with an evaluation of the platform against the original aims, objectives, and requirements.

---

## 6.1 Backend Unit and Integration Tests

### 6.1.1 Test Setup

Backend tests are located in `backend/tests/test_auth.py`. They use pytest with an in-memory SQLite database (swapped in via a conftest fixture) and the FastAPI `TestClient`. This allows the full application stack — router → service → repository → database — to be exercised in a real but isolated environment without requiring a running PostgreSQL instance:

```bash
cd backend
../.venv/bin/pytest tests/test_auth.py -v
```

### 6.1.2 Test Suite Results

The following tests pass successfully:

| Test | Description | Result |
|------|-------------|--------|
| `test_register_stores_bcrypt_hash[teacher]` | Registering a teacher stores a bcrypt hash, not the plaintext password | ✓ Pass |
| `test_register_stores_bcrypt_hash[student]` | Registering a student stores a bcrypt hash | ✓ Pass |
| `test_login_returns_standard_jwt_and_me_payload` | Login returns a JWT; `GET /auth/me` returns the correct user payload | ✓ Pass |
| `test_invalid_password_is_rejected` | Login with wrong password returns 401 with "Invalid credentials" | ✓ Pass |
| `test_protected_classrooms_route_requires_token` | `GET /classrooms` without a token returns 401 "Not authenticated" | ✓ Pass |
| `test_malformed_or_expired_token_is_rejected` | A malformed token or an expired token each return 401 | ✓ Pass |
| `test_student_cannot_create_classroom` | A student POSTing to `/classrooms` receives 403 | ✓ Pass |
| `test_teacher_can_create_classroom_without_teacher_id` | Teacher creates classroom; teacher_id is set from JWT, not from request body | ✓ Pass |
| `test_classroom_create_rejects_teacher_id_field` | Passing `teacher_id` in the request body is rejected with 422 | ✓ Pass |
| `test_teacher_only_sees_owned_classrooms` | Teacher A cannot see Teacher B's classrooms | ✓ Pass |

All 10 tests pass. The suite runs in under 3 seconds.

### 6.1.3 Database Health Check

A separate script `backend/scripts/db_health_check.py` verifies that the live database is reachable, all migrations have been applied, and all ORM models align with the current schema:

```bash
../.venv/bin/alembic current
../.venv/bin/alembic check
```

On a clean database, `alembic upgrade head` applies all 12 migrations successfully and `alembic check` confirms no pending schema drift.

---

## 6.2 Authentication Smoke Test

An end-to-end smoke test for the auth system was documented in `docs/auth_v1_smoke_test.md`. The test exercises the full auth cycle using `curl` against the running backend:

1. **Register a teacher** — POST to `/auth/register` with name, email, password, role.
2. **Login** — POST to `/auth/login`; verify a JWT is returned.
3. **Call protected endpoint** — `GET /auth/me` with the token in the `Authorization: Bearer` header; verify user payload matches.
4. **Reject invalid token** — `GET /auth/me` with a garbage token; verify 401.
5. **Register a student** — repeat steps 1–3 with `role: "student"`.
6. **Student tries teacher route** — POST `/classrooms` with student token; verify 403.

All six steps produced the expected responses.

---

## 6.3 Frontend End-to-End Tests

Playwright E2E tests are located in `frontend/tests/`. The test infrastructure was set up with:

```bash
cd frontend
npm run test:e2e          # headless
npm run test:e2e:headed   # visible browser
```

The current E2E suite covers:

| Test | Scenario | Result |
|------|----------|--------|
| Unauthenticated redirect | Visiting `/teacher` redirects to `/login` | ✓ Pass |
| Teacher login | Login with teacher credentials reaches `/teacher` dashboard | ✓ Pass |
| Student login | Login with student credentials reaches `/student` dashboard | ✓ Pass |
| Role mismatch redirect | Teacher token visiting `/student` redirects to `/teacher` | ✓ Pass |
| Register new user | Registration form creates account and redirects appropriately | ✓ Pass |

---

## 6.4 Test Cases Against Requirements

The following table maps each functional and non-functional requirement to a test case and its outcome. Requirements marked FR/NFR follow the `requirements.md` specification.

### 6.4.1 Functional Requirements

| ID | Requirement | Test Approach | Outcome |
|----|-------------|---------------|---------|
| FR1 | Teacher and student accounts | `test_register_stores_bcrypt_hash` (both roles) | ✓ Pass |
| FR2 | Teachers create and manage classrooms | `test_teacher_can_create_classroom_without_teacher_id` | ✓ Pass |
| FR3 | Students join via classroom code | Manual: student joins with valid code → enrolled; invalid code → 404 | ✓ Pass |
| FR4 | Login/logout authentication | `test_login_returns_standard_jwt_and_me_payload`, E2E login tests | ✓ Pass |
| FR5 | Teacher enters natural language lesson prompt | Manual: teacher creates lesson with prompt → lesson created | ✓ Pass |
| FR6 | AI generates structured lesson content | Manual: AI generation returns title, outline, Markdown body | ✓ Pass |
| FR7 | AI generates quiz questions from lesson | Manual: quiz generate endpoint returns MCQ array with answers | ✓ Pass |
| FR8 | Teacher edits AI-generated content before publishing | Manual: teacher updates lesson body → changes saved; publish toggles status | ✓ Pass |
| FR8a | Follow-up refinement prompts on existing lesson | Manual: reformat endpoint regenerates lesson with new format | ✓ Partial |
| FR8b | Classroom syllabus context for lesson generation | Manual: curriculum profile fields propagated to AI prompt | ✓ Pass |
| FR9 | Student quiz attempts and responses recorded | `QuizAttemptService` integration: attempt + responses persisted with all fields | ✓ Pass |
| FR10 | Difficulty adjustment based on performance | Manual: student >80% accuracy → recommended difficulty increases | ✓ Pass |
| FR11 | Immediate feedback after quiz | Manual: quiz result page shows per-question correct/incorrect + explanation | ✓ Pass |
| FR12 | XP awarded for activities | Manual: quiz completion awards 10 XP/correct + 20 XP perfect bonus | ✓ Pass |
| FR13 | Badges for milestones | Manual: perfect score → `perfect_score` badge; calibration ≥ 0.75 → `good_calibration` | ✓ Pass |
| FR14 | Classroom leaderboard | Manual: leaderboard endpoint returns students ordered by XP | ✓ Pass |
| FR15 | Teacher class performance dashboard | Manual: analytics endpoint returns per-student summaries | ✓ Pass |
| FR16 | Student progress dashboard | Manual: student OLM page shows XP, badges, score trends, topic mastery | ✓ Pass |
| FR17 | Interaction data stored for analysis | Manual: `analytics_events` table populated on lesson view and quiz submit | ✓ Pass |
| FR18 | Responsive UI | Manual: tested at 375px (mobile), 768px (tablet), 1280px (desktop); layout adapts | ✓ Pass |
| FR19 | At least two languages | Frontend `lang` attribute set; placeholder i18n structure present | ✓ Partial |
| FR20 | Text-to-speech for lesson content | Text-to-speech stub present; full integration deferred | ✓ Partial |
| FR21 | Concept graph per classroom | Manual: concepts and prerequisites created and returned by graph endpoint | ✓ Pass |
| FR22 | AI extracts concepts and prerequisites from lesson | Manual: generate endpoint returns 5–12 concepts with prerequisite edges | ✓ Pass |
| FR23 | Interactive mastery graph with blind spots | Manual: knowledge map shows colour-coded nodes; blind spots flagged | ✓ Pass |
| FR24 | Prerequisite diagnostic checks | Deferred from full implementation — concept inventory covers this partially | ✓ Partial |
| FR25 | Mid-lesson pulse checks | Deferred; concept inventory available as a standalone flow | ✓ Partial |
| FR26 | Adaptive concept inventory | Manual: inventory questions scale difficulty to mastery level | ✓ Pass |
| FR27 | Students start teach-back sessions | Manual: start session creates TeachingSession; opening AI message shown | ✓ Pass |
| FR28 | AI asks clarifying questions without revealing answers | Manual: Alex responds with probing questions; never states the answer | ✓ Pass |
| FR29 | Teaching quality assessment on 4 rubrics | Manual: complete session → assessment JSONB with completeness, accuracy, clarity, depth | ✓ Pass |
| FR30 | Manual concept create/edit/delete | Manual: teacher creates concept without AI; edit and delete work | ✓ Pass |
| FR31 | Manual prerequisite management | Manual: teacher adds and removes directed edges on the graph | ✓ Pass |
| FR32 | Manual lesson authoring (no AI) | Manual: lesson creation with `generate=false` saves title and body directly | ✓ Pass |
| FR33 | Reference document upload for AI context | Manual: PDF/DOCX uploaded → extracted text injected into AI prompt | ✓ Pass |
| FR34 | Edit AI-generated quiz questions | Manual: PATCH `/quizzes/{id}` with modified question array → changes saved | ✓ Pass |
| FR35 | Add/delete/reorder quiz questions | Manual: frontend question builder supports all three operations | ✓ Pass |
| FR36 | Create quizzes from scratch (no AI) | Manual: manual quiz creation page builds question list and saves | ✓ Pass |
| FR37 | Practice target selection algorithm | Manual: practice targets endpoint returns prioritised concepts with scores | ✓ Pass |
| FR38 | Targeted practice quiz with transparent reasoning | Manual: practice quiz shows concept category and reason on each question | ✓ Pass |
| FR39 | Quiz results update knowledge map | Manual: submitting quiz → mastery updates reflected on knowledge map page | ✓ Pass |

### 6.4.2 Non-Functional Requirements

| ID | Requirement | Test Approach | Outcome |
|----|-------------|---------------|---------|
| NFR1 | Response ≤ 2–3s for typical operations | Manual timing: auth, classroom CRUD, quiz submit all respond < 1s (AI endpoints excluded — Gemini latency 2–6s) | ✓ Pass |
| NFR2 | Secure by design | Passwords bcrypt-hashed; JWTs signed HS256; role/ownership checks on all endpoints; API keys in `.env` | ✓ Pass |
| NFR3 | Modular and maintainable | Three-layer architecture; one model/schema/repo/service/router per feature | ✓ Pass |
| NFR4 | Deployable to common PaaS | Backend compatible with Render (Uvicorn + PostgreSQL); frontend compatible with Vercel (Next.js) | ✓ Pass |
| NFR5 | Error logging | `logging` module throughout backend; `AnalyticsEvent` table for user events; frontend console warnings on API errors | ✓ Pass |

---

## 6.5 Scenario-Based Testing

### 6.5.1 End-to-End Teacher Workflow

The following scenario was walked through manually to verify the complete teacher workflow:

1. **Teacher registers** and logs in → redirected to `/teacher` dashboard.
2. **Creates a classroom** ("GCSE Computer Science", code `GCSE-CS-01`), sets curriculum profile: Subject "Computer Science", Year Group "Year 10", Learning Objectives "Understand binary, logic gates, and programming fundamentals".
3. **Creates a lesson** with prompt "Explain binary number systems for GCSE students" and content format "Slides". AI generates a 6-section lesson. Teacher previews and publishes.
4. **Generates a quiz** from the lesson — 5 MCQ questions. Teacher edits Question 3 to improve the wording, then publishes.
5. **Generates AI concept graph** from the lesson. 8 concepts extracted with 5 prerequisite relationships. Teacher manually adds a missing concept "Two's Complement" and links it as a prerequisite.
6. All operations complete successfully; the database contains the expected records.

### 6.5.2 End-to-End Student Workflow

1. **Student registers** and logs in → redirected to `/student` dashboard.
2. **Joins the classroom** using code `GCSE-CS-01`.
3. **Opens the lesson** in Slides format and reads through it.
4. **Takes the quiz**: answers 4/5 correctly, rates confidence per question (3 correct with high confidence, 1 correct with low confidence, 1 wrong with high confidence).
5. **Sees results**: Score 80%. Calibration score 0.7. XP breakdown (40 XP). Per-question feedback.
6. **Opens knowledge map**: 8 concept nodes shown with mastery colours. The concept "Binary Representation" (answered correctly 3 times) shows mastery 0.51 (Developing). The `ConceptMasteryDiff` panel shows before (0.0) and after mastery per concept.
7. **Clicks a concept node**: evidence trail opens showing sparkline, recent attempts, and confidence values.
8. **Views practice targets**: "Binary Addition" flagged as a blind spot (blocks "Two's Complement"). Clicks "Practice Now" → a 5-question concept practice quiz is generated and the student takes it.
9. **Opens peer teaching**: starts a teach-back session on "Binary number systems". Exchanges 6 turns with Alex. Ends session → receives assessment (Completeness 0.70, Accuracy 0.85, Clarity 0.75, Depth 0.60, Overall 0.74). Earns `first_teaching` badge.
10. All interactions completed without errors. Mastery scores, XP, and evidence trail updated correctly after each step.

### 6.5.3 Calibration Feedback Scenario

A specific calibration scenario was tested to verify the overconfidence detection:

- Student rates confidence 5 (very confident) on 3 questions, gets 1 correct and 2 wrong.
- Calibration score = 1 − (|1−1| + |1−0| + |1−0|) / 3 = 1 − 0.667 = 0.333.
- Frontend correctly displays "Your self-assessment accuracy: 33%" with the message "You rated yourself very confident on questions you got wrong — consider reviewing before answering."
- Calibration scatter plot shows two dots in the overconfident region (orange).

---

## 6.6 Known Limitations and Deferred Items

| Item | Status | Notes |
|------|--------|-------|
| FR8a — iterative lesson refinement UI | Partially implemented | Reformat endpoint exists; a true "revise this section" multi-turn UI was not built |
| FR19 — multilingual support | Stub only | `lang` attribute set; full i18n translation deferred |
| FR20 — text-to-speech | Stub only | Integration point present; browser `SpeechSynthesis` API integration deferred |
| FR24/FR25 — prerequisite checks and pulse checks | Deferred | Concept inventory covers similar ground; dedicated pre-lesson and inline flows not built |
| Embeddings and semantic search | Deferred | pgvector duplicate detection and smart content linking designed but not implemented |

---

## 6.7 Evaluation Against Aims and Objectives

| Objective | Status | Evidence |
|-----------|--------|---------|
| 1. Conduct a literature review on AI-assisted education, adaptive learning, and gamification | Complete | `docs/literature_review_notes.md` covers Luckin (2017, 2018, 2025), Kabudi et al. (2025), Fadel et al. (2015), Toda et al. (2020) |
| 2. Investigate user needs and design requirements through interviews and questionnaires | Complete | `docs/requirements.md` with 39 functional and 5 non-functional requirements; MoSCoW prioritised |
| 3a. AI lesson generation | Complete | Four content formats; curriculum context injection; reference document upload |
| 3b. Teacher-controlled iterative refinement | Partial | Reformat endpoint and inline quiz editor implemented; full sentence-level revision UI deferred |
| 3c. Classroom syllabus-aware generation context | Complete | Curriculum profile fields stored per-classroom and injected into all AI prompts |
| 3d. Adaptive quizzes | Complete | Threshold-based difficulty adjustment; concept-driven practice targeting |
| 3e. Classroom management | Complete | CRUD, join codes, enrollment, teacher/student role separation |
| 3f. Gamification and analytics | Complete | XP, 8 badge types, streaks, leaderboards; analytics events and per-student dashboards |
| 4. Evaluate through user testing and feedback, propose future work recommendations | Partially complete | Scenario-based testing conducted; full external user study with recruited participants remains future work |

---

## 6.8 Conclusion of Testing

The testing programme demonstrates that the core EduNexus platform is functionally correct across all major requirement areas. The backend pytest suite verifies auth security (bcrypt hashing, JWT validation, role enforcement, ownership checks) with 10 passing tests. The Playwright E2E suite confirms that auth flows and role-based redirects work correctly in the browser. Manual scenario testing validated the full teacher and student workflows end-to-end, including the knowledge graph mastery update loop, peer teaching assessment, and calibration feedback.

Two FR8a (iterative lesson refinement) and the multilingual/TTS stubs (FR19, FR20) remain partially implemented. The mid-lesson pulse check and prerequisite diagnostic check flows (FR24, FR25) were deferred in favour of the concept inventory, which covers the same pedagogical need through a different interaction pattern.

Overall, 34 of 39 functional requirements are fully or substantially met, 5 are partially met or deferred. All 5 non-functional requirements are satisfied.
