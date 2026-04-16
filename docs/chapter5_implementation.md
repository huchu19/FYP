# Chapter 5: Implementation

The following chapter documents the implementation of EduNexus, an AI-powered adaptive learning platform. Development followed an iterative approach over multiple sprints, each adding a distinct layer of functionality. The system is a full-stack monorepo with a FastAPI backend, a Next.js frontend, and a PostgreSQL database managed through Alembic migrations.

## 5.1 Development Plan

A sprint-based development plan was created to structure the work across several weeks. Each sprint had a clear focus and produced working, testable output:

- **Sprint 1 — Database Foundation:** Design the PostgreSQL schema, create the initial Alembic migration, and wire up SQLAlchemy models for users, classrooms, lessons, quizzes, and gamification.
- **Sprint 2 — Authentication & Core API:** Implement JWT-based auth with role-based access control, build the classroom and lesson CRUD routes, and configure CORS for the frontend.
- **Sprint 3 — AI Lesson & Quiz Generation:** Integrate Google Gemini (and OpenAI fallback) for AI-powered lesson and quiz generation, support multiple content formats (slides, PDF report, presentation, flashcards), and implement metacognitive quiz types.
- **Sprint 4 — Frontend Auth & Teacher Dashboard:** Build the Next.js App Router structure, implement login/register flows, teacher dashboard, classroom management, and the AI lesson builder UI.
- **Sprint 5 — Student Experience & Gamification:** Create the student dashboard, quiz-taking interface with metacognitive features, adaptive difficulty, gamification (XP, badges, leaderboards), and the student progress page.
- **Sprint 6 — Analytics, Testing & Polish:** Wire up analytics endpoints, add Playwright E2E tests, implement dark/light theme, and polish the UI.

Progress was tracked weekly and the project was kept on target by treating each sprint as a self-contained deliverable that could be demonstrated independently.

## 5.2 Setting Up the Environment

### 5.2.1 Backend Environment

The backend uses Python with FastAPI as the web framework. A virtual environment was created at the repository root to manage dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic python-jose bcrypt
pip install google-generativeai openai
```

The FastAPI application is initialised in `main.py` with CORS middleware and all feature routers:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, classrooms, lessons, quizzes, quiz_attempts, gamification, analytics

app = FastAPI(title="EduNexus API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount feature routers
app.include_router(auth.router)
app.include_router(classrooms.router)
app.include_router(lessons.router)
app.include_router(quizzes.router)
app.include_router(quiz_attempts.router)
app.include_router(quiz_attempts.attempt_router)
app.include_router(gamification.router)
app.include_router(analytics.router)
```

Environment configuration is managed through Pydantic `BaseSettings`, which reads from environment variables and a `.env` file. This centralises all sensitive values (database URL, API keys, JWT secret) in one place, keeping them out of version control.

### 5.2.2 Frontend Environment

The frontend uses Next.js 16 with the App Router, React 19, and Tailwind CSS 4 for styling. The project was scaffolded with:

```bash
npx create-next-app@latest frontend
cd frontend
npm install react-markdown remark-gfm
npm install -D @playwright/test
```

The frontend communicates with the backend through a centralised API utility (`lib/api.js`) that automatically attaches JWT tokens from `localStorage` to every request and handles 401 responses by logging the user out.

### 5.2.3 Database Setup

PostgreSQL was chosen for its robust support for JSONB columns (used extensively for quiz questions, flashcards, badges, and analytics payloads) and ARRAY types (used for lesson outlines). The database connection is managed through SQLAlchemy:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

## 5.3 Database Schema & Migrations

### 5.3.1 Core Data Models

The data model was designed around the teacher-student relationship with classrooms as the central organising entity. The key models are:

**User** — Stores name, email, hashed password, and role (`teacher` or `student`). The role field drives access control throughout the application.

**Classroom** — Created by teachers with a unique join code. Students enrol by entering this code. The `ClassroomEnrollment` model implements the many-to-many relationship.

**Lesson** — The richest model in the system. A lesson stores not only the title and body content but also the original teacher prompt, a structured outline (PostgreSQL ARRAY), content format, optional flashcards (JSONB), and metadata tracking whether AI generated the content:

```python
class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    title = Column(String, nullable=False)
    prompt = Column(Text, nullable=False)
    outline = Column(ARRAY(String), default=list)
    body = Column(Text, nullable=True)
    content_format = Column(String, nullable=False, default="slides")
    flashcards = Column(JSONB, nullable=True)
    status = Column(String, nullable=False, default="draft")
    generated_by_ai = Column(Boolean, nullable=False, default=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

**Quiz** — Linked to a lesson via a foreign key. Questions are stored as a JSONB array, allowing flexible question structures for different quiz types (standard MCQ, Kahoot-style, metacognitive). Supports `easy`, `medium`, and `hard` difficulty levels.

**QuizAttempt & QuizResponse** — Capture the full detail of a student's quiz submission. The attempt tracks overall score, time taken, and metacognitive data (reflection text, self-rated understanding). Each response stores the individual answer, correctness, XP awarded, confidence level, and reasoning text. This rich data model enables the calibration scoring and adaptive feedback features.

**Gamification** — Tracks per-classroom XP, badges (JSONB array), and streak data for each student.

**AnalyticsEvent** — A flexible event log with a typed payload for tracking user actions across the platform.

### 5.3.2 Alembic Migrations

Schema changes were managed through Alembic, ensuring reproducible database states. Seven migrations were created across the project:

1. **`20260202_0001_initial`** — Created the initial tables: users, classrooms, lessons, quizzes, and gamification.

2. **`20260220_0002_expand_domain_schema`** — A major expansion that added analytics_events, classroom_enrollments, quiz_attempts, and quiz_responses tables. It also extended existing tables with timestamps, role fields, and foreign keys.

3. **`20260315_0003_metacognition_content_formats`** — Added metacognitive fields to quiz_responses (confidence_level, reasoning_text, reasoning_steps), reflection fields to quiz_attempts, content_format and flashcards columns to lessons, and quiz_type to quizzes.

4. **`20260315_0004_cascade_deletes`** — Added ON DELETE CASCADE to critical foreign keys (lesson→quiz→attempt→response), ensuring clean deletion chains without orphaned rows.

5. **`20260324_0005_knowledge_graph`** — Added concept graph tables (`concepts`, `concept_prerequisites`, `student_concept_mastery`) for the knowledge component of the learner model.

6. **`20260331_0006_student_model_evidence`** — Extended `student_concept_mastery` with `evidence` JSONB and `metacognitive_score` so every mastery update is traceable.

7. **`20260401_0007_hint_scaffolding_zpd`** — Added `quiz_responses.hints_used`, converted attempt scores to floats for partial credit, and introduced `unaided_mastery` / `aided_mastery` on `student_concept_mastery` for ZPD tracking.

Each migration was tested by running `alembic upgrade head` followed by `alembic check` to verify ORM-database alignment.

## 5.4 Authentication & Security

### 5.4.1 Password Hashing

The security module supports a primary hashing scheme (bcrypt) with a fallback to PBKDF2-SHA256 for environments where bcrypt is unavailable. It also handles legacy plaintext passwords with time-constant comparison and automatic rehashing on next login:

```python
def verify_password(password: str, stored_hash: str) -> PasswordVerificationResult:
    """Verify password against stored hash. Returns (verified, needs_rehash)."""
    if _is_bcrypt_hash(stored_hash):
        verified = bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
        return PasswordVerificationResult(verified=verified, needs_rehash=False)
    # ... fallback to PBKDF2 or legacy check
```

This layered approach ensures backwards compatibility while upgrading users to the strongest available scheme.

### 5.4.2 JWT Authentication

JSON Web Tokens are used for stateless authentication. When a user logs in, the server creates a token containing their user ID and role, signed with HS256:

```python
def create_access_token(subject: str, role: str, expires_minutes: int = None) -> str:
    payload = {
        "sub": subject,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=expires_minutes or settings.token_expire_minutes),
        "typ": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)
```

A FastAPI dependency (`get_current_user`) extracts and validates the token on every protected request. Role-based access is enforced through a `require_roles` dependency that checks the user's role before allowing access to teacher-only or student-only endpoints.

### 5.4.3 Route Protection

The API uses a consistent pattern for route protection. Teacher-only operations (creating lessons, publishing quizzes) verify `actor_user.role == "teacher"` and additionally check classroom ownership. Student-only operations (submitting quiz attempts) verify `actor_user.role == "student"`. This dual-layer approach (role check + ownership check) prevents both horizontal and vertical privilege escalation.

## 5.5 AI Service Integration

### 5.5.1 Architecture

The AI service is the core differentiator of EduNexus. It supports two LLM providers — Google Gemini (free tier, using `gemini-2.5-flash`) as the primary model and OpenAI (`gpt-4o-mini`) as a fallback. The dispatch is transparent to the rest of the application:

```python
def _use_gemini() -> bool:
    return bool(settings.gemini_api_key)

def _call_gemini(system_prompt: str, user_prompt: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=system_prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.5,
        ),
    )
    response = model.generate_content(user_prompt)
    return response.text
```

### 5.5.2 Lesson Generation

When a teacher creates a lesson, they provide a prompt describing the topic, audience, and desired length. The AI service wraps this in a system prompt that instructs the model to return structured JSON with a title, outline array, and full Markdown body. The system prompt adapts based on the selected content format:

```python
LESSON_FORMAT_INSTRUCTIONS = {
    "slides": "Structure the body with Markdown headings (##) matching the outline sections.",
    "pdf_report": "Structure the body as a formal report with introduction, detailed sections...",
    "presentation": "Structure the body as presentation slides. Keep text concise...",
    "flashcards": "Structure the body as a series of flashcard pairs...",
}
```

Four content formats are supported:
- **Slides** — Each `##` heading becomes a slide, rendered in a paginated viewer.
- **PDF Report** — A formal document with introduction, subsections, and conclusion.
- **Presentation** — Concise bullet-point slides with speaker notes.
- **Flashcards** — Question-answer pairs grouped by topic, rendered with flip animations.

Teachers can also reformat an existing lesson to a different format after generation, calling the AI again with the existing content as context.

The next teacher-authoring extension identified during development is a true iterative refinement loop: rather than only generating a first draft and optionally reformatting it, teachers should be able to ask the system to add, remove, or rewrite specific sections while preserving the existing lesson as context. A second planned extension is classroom-level syllabus guidance, where a stored curriculum brief constrains future lesson generation so all content for that class remains aligned to the same scheme of work.

### 5.5.3 Quiz Generation

Quizzes are generated from lesson content with three distinct types:

**Standard MCQ** — Five questions with mixed difficulty (2 easy, 2 medium, 1 hard), each with four options and an explanation.

**Kahoot-style** — Fast-paced, short questions with time limits and point values. Designed for gamified classroom use:

```python
KAHOOT_QUIZ_PROMPT = """\
You are an expert educator creating a fun, fast-paced Kahoot-style quiz.
...
Guidelines:
- Keep questions SHORT and engaging — this is a game!
- Time limits: easy=30s, medium=20s, hard=15s.
- Points: easy=500, medium=1000, hard=1500.
"""
```

**Metacognitive** — The most sophisticated type. Generates questions that assess *how* students think, not just what they know:

```python
METACOGNITIVE_QUIZ_PROMPT = """\
You are an expert educator creating a metacognitive assessment that evaluates
how students THINK, not just what they know. Generate questions that require
students to explain reasoning, analyse errors, apply concepts to new contexts,
and demonstrate deep understanding.
...
Generate 5 questions: 2 explain_reasoning, 1 error_analysis, 1 transfer, 1 multi_step.
"""
```

This produces four question types: `explain_reasoning` (MCQ plus written justification), `error_analysis` (identify flaws in given solutions), `transfer` (apply concepts to new contexts), and `multi_step` (sequential problem-solving).

To support the Open Learner Model, quiz generation was later extended so each question can carry both `concept_tags` and a three-level progressive `hints` array. This means the same AI generation step now produces not only the assessment item, but also the scaffolding path used to judge what a learner can do independently versus with support.

### 5.5.4 Robust JSON Parsing

A significant implementation challenge was reliably parsing JSON from LLM outputs, which occasionally include markdown fences, unescaped characters, or trailing text. The parser uses a multi-stage fallback approach:

1. **Direct parse** — Try `json.loads()` on the raw response.
2. **Strip markdown fences** — Remove ` ```json ` and ` ``` ` wrappers.
3. **Fix unescaped newlines** — Replace literal newlines inside JSON strings with `\n`.
4. **Brace matching** — Find the outermost `{ }` or `[ ]` and parse only that substring.

This approach handles the majority of edge cases encountered across both Gemini and OpenAI responses without manual intervention.

## 5.6 Backend Architecture

### 5.6.1 Layered Design

The backend follows a three-layer architecture:

1. **Router Layer** — FastAPI route handlers that parse requests, call services, and return responses. Minimal logic; primarily concerned with HTTP semantics.
2. **Service Layer** — Business logic: authorisation checks, AI orchestration, scoring, gamification. Services are stateless and receive database sessions as parameters.
3. **Repository Layer** — Data access operations (CRUD). Each repository wraps SQLAlchemy queries for a specific model, keeping raw SQL/ORM out of the service layer.

This separation enables testability (services can be tested with mock repositories) and keeps each layer focused on a single concern.

### 5.6.2 API Route Summary

Eight routers are mounted on the application, providing 25+ endpoints:

| Router | Prefix | Key Endpoints |
|--------|--------|---------------|
| Auth | `/auth` | Login, register, get current user |
| Classrooms | `/classrooms` | CRUD, join by code, list lessons/quizzes |
| Lessons | `/lessons` | CRUD, publish/unpublish, AI generate, reformat |
| Quizzes | `/quizzes` | CRUD, publish/unpublish, AI generate |
| Quiz Attempts | `/quizzes/{id}/attempts` | Submit attempt, list attempts, update reflection |
| Gamification | `/gamification` | Leaderboard, user XP/badges |
| Analytics | `/analytics` | Student quiz history, calibration, topic mastery; teacher class summary |

## 5.7 Quiz Attempt & Scoring System

The quiz attempt submission is the most complex single operation in the system. When a student submits answers, the following sequence occurs:

```python
def submit_attempt(self, db, *, quiz_id, answers, actor_user, time_taken_seconds,
                   reflection, self_rated_understanding):
    # 1. Validate student role and quiz is published
    # 2. Create the attempt record
    # 3. Score each question and create response records
    for idx, question in enumerate(questions):
        raw_answer = answers.get(str(idx), "")
        selected, confidence, reasoning_text, reasoning_steps, hints_used = _extract_answer_detail(raw_answer)
        is_correct = selected == question.get("correct_answer", "")
        credit = _credit_for_hint_usage(hints_used) if is_correct else 0.0
        xp = _xp_for_credit(credit)
        # ... create response record with metacognition data

    # 4. Award perfect score bonus (+20 XP)
    # 5. Award XP to gamification record
    # 6. Update streak
    # 7. Award badges (perfect_score, first_quiz, good_calibration, growth_mindset)
    # 8. Calculate calibration score
    # 9. Log analytics event
```

The `_extract_answer_detail` helper handles three input formats — plain strings (simple answers), dictionaries (from API clients), and Pydantic models (from FastAPI request parsing) — making the system flexible for different client implementations.

Milestone 5b added scaffold-aware scoring on top of this flow. Each question can now be answered with 0-3 progressively revealed hints. Correct answers still count as success, but the awarded score becomes fractional (for example 1.0 with no hints, 0.75 with one hint, 0.5 with two, 0.25 with three). The same submission event updates three learner-model signals per concept: overall `mastery_score` (hint-adjusted), `unaided_mastery` (success without hints), and `aided_mastery` (success with hints). This makes the student's Zone of Proximal Development explicit in the data model rather than inferred later from raw logs.

### 5.7.1 Calibration Scoring

A novel feature is the confidence calibration score, which measures how well a student's self-assessed confidence aligns with their actual performance:

```python
def _calculate_calibration(responses_data: list[tuple[bool, int | None]]) -> float | None:
    confidence_to_expected = {1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0}
    total_error = 0.0
    for is_correct, confidence in rated:
        expected = confidence_to_expected.get(confidence, 0.5)
        actual = 1.0 if is_correct else 0.0
        total_error += abs(expected - actual)
    return round(1.0 - (total_error / len(rated)), 3)
```

This maps confidence levels 1-5 to expected accuracy 0-100%, computes the average absolute error, and returns a score from 0.0 (poor calibration) to 1.0 (perfect calibration). Students who rate themselves as "very confident" on questions they get wrong receive lower calibration scores, encouraging honest self-assessment.

### 5.7.2 Badge System

Five badges are awarded based on specific achievements:

- **`perfect_score`** — Score 100% on any quiz.
- **`first_quiz`** — Complete the first ever quiz attempt.
- **`good_calibration`** — Achieve a calibration score of 0.75 or higher.
- **`growth_mindset`** — Improve the score when retaking a previously attempted quiz.
- **`reflective_learner`** — Submit five or more post-quiz reflections.

Badges are stored as a JSONB array on the gamification record and are deduplicated to prevent duplicate awards.

## 5.8 Adaptive Difficulty

The adaptive learning service recommends quiz difficulty based on a student's recent performance using a threshold-based algorithm:

```python
ACCURACY_INCREASE_THRESHOLD = 0.80  # > 80% → increase difficulty
ACCURACY_DECREASE_THRESHOLD = 0.40  # < 40% → decrease difficulty
RECENT_WINDOW = 5  # number of recent attempts to consider
```

The algorithm examines the five most recent quiz attempts in a classroom, calculates overall accuracy, and recommends stepping up (easy→medium→hard) if above 80% or stepping down if below 40%. This creates a responsive feedback loop that keeps students in their zone of proximal development without overwhelming or boring them.

The adaptive feedback generator also analyses individual responses to identify weak areas and confidence calibration issues:

```python
# Confidence analysis
overconfident = [r for r in rated if r.confidence_level >= 4 and not r.is_correct]
underconfident = [r for r in rated if r.confidence_level <= 2 and r.is_correct]
```

This produces targeted feedback like "You were confident but incorrect on 2 questions — consider reviewing these topics more carefully" or "You got 3 questions right despite low confidence — trust your knowledge more!"

## 5.9 Frontend Implementation

### 5.9.1 Application Structure

The frontend uses Next.js App Router with route groups to separate public, auth, and dashboard routes:

```
frontend/app/
├── layout.js              # Root: AuthProvider + ThemeProvider + Navbar
├── page.js                # Landing page
├── globals.css            # Dark/light theme CSS variables
├── (auth)/
│   ├── login/page.js      # Login form
│   └── register/page.js   # Registration form
└── (dashboard)/
    ├── teacher/
    │   ├── layout.js       # Auth guard (teacher role)
    │   ├── page.js         # Teacher dashboard
    │   └── classrooms/...  # Classroom, lesson, quiz management
    └── student/
        ├── layout.js       # Auth guard (student role)
        ├── page.js         # Student dashboard
        ├── classrooms/...  # Lesson viewing, quiz taking
        └── progress/page.js # Open learner model
```

### 5.9.2 Authentication Flow

The `AuthProvider` component wraps the entire application and manages authentication state through React Context:

1. On app load, it checks `localStorage` for a saved JWT token.
2. If found, it validates the token by calling `GET /auth/me`.
3. If valid, the user object (id, name, email, role) is stored in context.
4. If invalid (401), the token is cleared and the user is logged out.
5. All protected pages show a loading state until this bootstrap completes.

Login and registration forms POST to the backend, store the returned JWT, and redirect based on the user's role — teachers go to `/teacher`, students go to `/student`.

### 5.9.3 Role-Based Layout Guards

Each dashboard branch has a layout component that enforces role-based access:

```javascript
// teacher/layout.js
export default function TeacherLayout({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingSpinner />;
    if (!user) { redirect("/login"); return null; }
    if (user.role !== "teacher") { redirect("/student"); return null; }

    return <>{children}</>;
}
```

This ensures students cannot access teacher routes and vice versa, even if they manually navigate to the URL.

### 5.9.4 Teacher Dashboard & AI Lesson Builder

The teacher dashboard displays active classrooms, quick actions, and navigation to create new content. The most significant teacher feature is the AI lesson builder, which provides:

- A **prompt textarea** where teachers describe the topic, audience, and desired depth.
- **Content format selector** buttons (Slides, PDF Report, Presentation, Flashcards).
- A **live preview panel** that displays the generated lesson immediately after AI processing.
- **Tips sidebar** with prompting best practices.

When the teacher clicks "Generate lesson", the frontend sends:

```javascript
const result = await apiPost(`/lessons?generate=true`, {
    classroom_id: classroomId,
    title: "Generated Lesson",
    prompt: promptText,
    content_format: selectedFormat,
});
```

The backend calls the AI service, which returns structured JSON that is saved as a lesson and returned to the frontend for immediate preview.

At present this flow is strongest for first-draft generation. A planned refinement is to turn the lesson builder into an iterative authoring workspace where teachers can issue follow-up edit instructions against the generated draft itself (for example, "add a worked example", "remove the advanced section", or "rewrite this for a younger cohort"). Another planned refinement is a classroom syllabus profile that is entered once and automatically injected into future lesson-generation requests for that classroom.

### 5.9.5 Lesson Content Renderers

Generated lessons are displayed through format-specific renderers:

- **SlideViewer** — Parses Markdown on `##` headings into discrete slides. Provides paginated navigation with Previous/Next buttons and clickable dot indicators. Each slide renders its content through `react-markdown` with GitHub-flavoured Markdown support.

- **ReportView** — Renders the full lesson as a single scrollable document with a report header, suitable for printing or PDF export.

- **PresentationView** — Paginates slides like SlideViewer but also extracts speaker notes (parsed from `> Speaker notes:` blocks in the Markdown) and displays them below each slide.

- **FlashcardViewer** — Renders flashcards with a 3D flip animation (CSS `transform: rotateY(180deg)`). Shows the question on the front, answer on the back, with a progress bar tracking how many cards have been studied.

### 5.9.6 Student Quiz Interface

The quiz-taking interface supports all three quiz types:

**Standard MCQ** — Displays questions with radio button options. After submission, shows score, correct/incorrect indicators, and explanations.

**Kahoot-style** (KahootQuiz component) — A gamified experience with:
- A countdown timer bar that changes colour (green → amber → red).
- Four coloured answer buttons (red, blue, amber, emerald gradients).
- Point scoring that decreases with time taken.
- Streak counter for consecutive correct answers.
- Instant per-question feedback with animations.
- A game-over screen with emoji-based reactions.

**Metacognitive** — Standard MCQ plus additional inputs:
- **Confidence rating** (1-5 buttons) per question.
- **Reasoning text** input for questions that require explanation.
- **Progressive hints** revealed one level at a time through a "Need a hint?" panel. Each revealed hint reduces the maximum score for that question, making the scaffolding transparent.
- Post-quiz **reflection form** with self-rated understanding (1-5) and free-text reflection on challenges.

After submission, the student sees:
- Overall score (X out of Y).
- Calibration score percentage (self-assessment accuracy).
- Per-question feedback correlating confidence with correctness ("Confident and correct!", "Knew you were unsure").
- Hint usage indicators showing which questions required scaffolded support.
- XP earned breakdown.

### 5.9.7 Student Progress Page (Open Learner Model)

The progress page implements an "Open Learner Model" — a transparent dashboard where students can see their own learning data. It includes:

- **Summary cards** — Total XP, average score, quizzes taken, self-assessment accuracy.
- **XP Breakdown** — Visual breakdown of XP sources (quizzes, lessons, streaks, reflections, bonuses).
- **Classroom Leaderboard** — Top students ranked by XP with colour-coded positions.
- **Badges Earned** — Visual display of earned badges with descriptions.
- **Score Trend** — Bar chart of recent quiz attempt scores over time.
- **Topic Mastery** — Progress bars showing per-topic accuracy.
- **Metacognitive Insight** — Interpretation of calibration score with actionable advice.
- **Your Reflections** — Recent post-quiz reflections with corresponding scores.

### 5.9.8 Theming

A dark/light theme system was implemented using CSS custom properties and a React context:

```css
:root {
    --bg-surface: #0a0f1e;     /* Deep navy (dark mode default) */
    --bg-card: rgba(15, 23, 42, 0.8);
    --accent-primary: #06b6d4;  /* Cyan */
    --accent-secondary: #8b5cf6; /* Violet */
}

[data-theme="light"] {
    --bg-surface: #f8fafc;
    --bg-card: rgba(255, 255, 255, 0.9);
}
```

The `ThemeProvider` persists the user's preference to `localStorage` and sets the `data-theme` attribute on the `<html>` element. All components use CSS variables for colours, ensuring consistent theme switching with a smooth 0.3s transition.

## 5.10 Problems Encountered and Solutions

### 5.10.1 LLM JSON Parsing Failures

**Problem:** LLM responses frequently included markdown code fences (` ```json ... ``` `), trailing commentary, or unescaped newlines inside JSON strings, causing `json.loads()` to fail.

**Solution:** Implemented a multi-stage fallback parser that strips fences, fixes escape sequences, and falls back to brace-matching extraction. This resolved approximately 95% of parsing failures without requiring prompt engineering changes.

### 5.10.2 Cascade Delete Integrity

**Problem:** Deleting a lesson left orphaned quiz records in the database, which caused foreign key violations when those quizzes' attempts were later queried.

**Solution:** Added a dedicated migration (`20260315_0004_cascade_deletes`) that altered the foreign key constraints on `quizzes.lesson_id`, `quiz_attempts.quiz_id`, and `quiz_responses.attempt_id` to include `ON DELETE CASCADE`. This ensures the entire chain (lesson → quiz → attempt → response) is cleaned up atomically.

### 5.10.3 Answer Format Flexibility

**Problem:** The quiz submission endpoint needed to accept answers in multiple formats — plain strings for simple MCQ, and structured objects containing confidence levels and reasoning for metacognitive quizzes. FastAPI's strict type validation rejected mixed-type dictionaries.

**Solution:** The `_extract_answer_detail` helper function was written to handle three input types — plain strings, raw dictionaries, and Pydantic model instances — normalising them all to a consistent tuple of (selected_answer, confidence_level, reasoning_text, reasoning_steps). This allowed the same endpoint to serve both simple and metacognitive quiz types.

### 5.10.4 Bcrypt Import Failures

**Problem:** On certain deployment environments, the `bcrypt` library was not available, causing the authentication system to fail entirely at import time.

**Solution:** Wrapped the import in a try/except block with a PBKDF2-SHA256 fallback. The `hash_password` function checks which library is available at runtime and uses the strongest available scheme. The `verify_password` function detects the hash format and uses the appropriate verification method, supporting transparent rehashing when the stronger bcrypt becomes available.

### 5.10.5 Next.js 16 Async Params

**Problem:** Next.js 16 changed dynamic route parameters to be asynchronous, breaking the existing pattern of accessing `params.id` directly in server components.

**Solution:** Updated all dynamic route pages to use React's `use()` hook for unwrapping the async params promise, for example: `const { id } = use(params)`.

## 5.11 Code Quality & Maintainability

### 5.11.1 Project Structure

The backend follows a consistent layered pattern: each feature has a corresponding model, schema, repository, service, and router file. This makes it straightforward to locate any piece of logic — for instance, quiz scoring is always in `quiz_attempt_service.py`, never in a router or repository.

### 5.11.2 Naming Conventions

Python files use `snake_case` throughout. SQLAlchemy models use `PascalCase` class names with `snake_case` table names (e.g., `class QuizAttempt` maps to `quiz_attempts`). Frontend components use `PascalCase` file names. API endpoints follow REST conventions with plural nouns (e.g., `/classrooms/{id}/lessons`).

### 5.11.3 Type Safety

The backend uses Pydantic schemas for all request/response validation, catching type errors at the API boundary. Python type hints are used throughout service and repository layers for IDE support and documentation. The frontend uses JavaScript with consistent patterns (described in Section 5.9) to maintain predictability despite the lack of static types.

### 5.11.4 Error Handling

All service methods raise `HTTPException` with appropriate status codes (403 for authorisation failures, 404 for missing resources, 400 for bad requests). The frontend catches these and displays user-friendly error messages in red alert boxes, with loading spinners during API calls and cleanup functions in `useEffect` to prevent state updates on unmounted components.

## 5.12 Conclusion of Implementation

The implementation successfully delivers the core EduNexus platform with:

- A full authentication system with role-based access control.
- AI-powered lesson generation across four content formats.
- Three quiz types (standard, Kahoot, metacognitive) with rich scoring and feedback.
- An adaptive difficulty system that responds to student performance.
- A gamification layer with XP, badges, streaks, and leaderboards.
- A metacognitive assessment system with confidence calibration.
- Teacher and student dashboards with distinct, role-appropriate functionality.
- A dark/light theme system and responsive design.
- E2E test coverage with Playwright.

The core original requirements were met. The platform is functional end-to-end: a teacher can create a classroom, generate an AI lesson, publish a quiz, and a student can join, take the quiz with metacognitive features, earn XP and badges, and view their learning progress. Two important teacher-authoring refinements identified during later iteration remain for future work: iterative AI revision of generated lesson drafts and classroom syllabus-guided lesson generation. The next chapter will evaluate the system through testing with real user interactions.
