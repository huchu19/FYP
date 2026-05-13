# Chapter 5: Implementation

The following chapter documents the implementation of EduNexus, an AI-powered adaptive learning platform. Development followed an iterative, sprint-based approach where each sprint delivered a self-contained, demonstrable increment. The system is a full-stack monorepo with a FastAPI backend, a Next.js frontend, and a PostgreSQL database managed through Alembic migrations.

---

## 5.1 Development Plan

A sprint-based plan was drawn up at the start of the project to structure development across several weeks. Each sprint had a focused objective and produced working, testable software:

- **Sprint 1 — Database Foundation:** Design the PostgreSQL schema, create the initial Alembic migration, and wire up SQLAlchemy models for users, classrooms, lessons, quizzes, and gamification.
- **Sprint 2 — Authentication & Core API:** Implement JWT-based authentication with role-based access control, build classroom and lesson CRUD routes, and configure CORS for the Next.js frontend.
- **Sprint 3 — AI Lesson & Quiz Generation:** Integrate Google Gemini (`gemini-2.5-flash`) and OpenAI fallback for AI-powered lesson and quiz generation, support multiple content formats (slides, PDF report, presentation, flashcards), and implement three quiz types including metacognitive questions.
- **Sprint 4 — Frontend Auth & Teacher Dashboard:** Build the Next.js App Router structure, implement login/register flows, teacher dashboard, classroom management, and the AI lesson builder UI.
- **Sprint 5 — Student Experience & Gamification:** Create the student dashboard, the quiz-taking interface with confidence ratings and progressive hints, adaptive difficulty, gamification (XP, badges, streaks, leaderboards), and the student progress page.
- **Sprint 6 — Analytics & Testing:** Wire up analytics endpoints, add Playwright E2E tests, implement dark/light theme, and polish the UI.
- **Sprint 7 — Knowledge Graph & Open Learner Model:** Design the concept and `ConceptPrerequisite` models, implement AI concept extraction, mastery tracking with exponential moving average, ZPD measurement, blind-spot detection, and the interactive knowledge graph visualisation.
- **Sprint 8 — Peer Teaching Simulator & Formative Assessment:** Build the AI confused-learner conversation loop, the 4-rubric teaching assessment, the `TeachingSession` model, and the adaptive concept inventory.
- **Sprint 9 — Curriculum Profile, Lesson Documents & Teacher Content Control:** Add classroom curriculum profile columns, lesson document upload with PDF/DOCX extraction, inline quiz editing, manual concept CRUD, and prerequisite management.
- **Sprint 10 — Concept-Driven Adaptive Loop & Final Polish:** Implement the weighted practice-target algorithm, practice quiz generation, the `PracticeTargetsPanel` component, and close the adaptive feedback loop from quiz results back to the knowledge map.

Progress was tracked against the milestones document, and each sprint was kept demonstrable independently so that evaluation sessions could be run at any point.

---

## 5.2 Setting Up the Environment

### 5.2.1 Backend Environment

The backend uses Python 3.11 with FastAPI as the web framework. A shared virtual environment is created at the repository root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary alembic python-jose bcrypt
pip install google-generativeai openai pypdf2 python-docx python-multipart
```

The FastAPI application is initialised in `main.py` with CORS middleware and all feature routers mounted:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    auth, classrooms, lessons, quizzes, quiz_attempts,
    gamification, analytics, knowledge_graph, formative_assessment, peer_teaching,
)

app = FastAPI(title="EduNexus API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(classrooms.router)
app.include_router(lessons.router)
app.include_router(quizzes.router)
app.include_router(quiz_attempts.router)
app.include_router(gamification.router)
app.include_router(analytics.router)
app.include_router(knowledge_graph.router)
app.include_router(formative_assessment.router)
app.include_router(peer_teaching.router)
```

Environment configuration is managed through Pydantic `BaseSettings`, which reads from `.env`. This centralises all sensitive values (database URL, AI API keys, JWT secret) in one place, keeping them out of version control.

### 5.2.2 Frontend Environment

The frontend uses Next.js 16 with the App Router, React 19, and Tailwind CSS 4. The project was scaffolded with:

```bash
npx create-next-app@latest frontend
cd frontend
npm install react-markdown remark-gfm
npm install -D @playwright/test
```

The frontend communicates with the backend through a centralised API utility (`lib/api.js`) that automatically attaches the JWT from `localStorage` to every request and handles 401 responses by logging the user out.

### 5.2.3 Database Setup

PostgreSQL was chosen for its robust support for JSONB columns — used extensively for quiz questions, flashcards, teaching session conversations, and mastery evidence — and ARRAY types for lesson outlines. The database connection is managed through SQLAlchemy:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

---

## 5.3 Database Schema & Migrations

### 5.3.1 Core Data Models

The data model was designed around the teacher–student–classroom relationship. The key models are:

**User** — Stores name, email, hashed password, and role (`teacher` or `student`). The role field drives access control throughout the application.

**Classroom** — Created by teachers with a unique join code. Students enrol by entering this code. The `ClassroomEnrollment` model implements the many-to-many relationship. Later extended with curriculum profile fields (`subject`, `year_group`, `learning_objectives`, `syllabus_notes`) so all lesson generation for that classroom is anchored to a shared context.

**Lesson** — The richest model in the system. Stores the title, body content, original teacher prompt, a structured outline (PostgreSQL ARRAY), content format, optional flashcards (JSONB), a `generated_by_ai` flag, and publication status:

```python
class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    title = Column(String, nullable=False)
    prompt = Column(Text, nullable=True)         # nullable — manual authoring
    outline = Column(ARRAY(String), default=list)
    body = Column(Text, nullable=True)
    content_format = Column(String, nullable=False, default="slides")
    flashcards = Column(JSONB, nullable=True)
    status = Column(String, nullable=False, default="draft")
    generated_by_ai = Column(Boolean, nullable=False, default=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
```

**Quiz** — Questions stored as a JSONB array, supporting flexible structures for standard MCQ, Kahoot-style, and metacognitive types. Later, each question carries `concept_ids`, `concept_tags`, and a three-level `hints` array.

**QuizAttempt & QuizResponse** — Capture the full detail of each submission. Attempts store overall score, time taken, reflection text, and self-rated understanding. Each response stores the selected answer, correctness, XP awarded, confidence level, reasoning text, and `hints_used` count. These fields enable calibration scoring, ZPD tracking, and the evidence trail in the Open Learner Model.

**Concept, ConceptPrerequisite, StudentConceptMastery** — The knowledge graph layer. Concepts belong to a classroom and optionally link to the lesson they were extracted from. `ConceptPrerequisite` is a directed edge table implementing the prerequisite DAG. `StudentConceptMastery` holds the per-student mastery score with a JSONB evidence array (the last 20 data points), `metacognitive_score`, `unaided_mastery`, and `aided_mastery` for ZPD calculation.

**TeachingSession** — Stores a multi-turn AI teach-back conversation as a JSONB array, along with a 4-rubric `assessment` JSONB, `overall_score`, and status (`active` / `completed`).

**FormativeAssessment** — A lightweight assessment record storing questions, responses, score, and `recommended_actions` JSONB for adaptive concept inventory sessions.

**Gamification** — Per-classroom XP, badges (JSONB array), and `streak_days` for each student.

**AnalyticsEvent** — A flexible event log with a typed string event type and arbitrary JSONB payload, used to record lesson views, quiz submissions, and XP awards.

### 5.3.2 Alembic Migrations

All schema changes were managed through Alembic, giving a fully reproducible database history. Twelve migrations were created across the project lifetime:

1. **`20260202_0001_initial`** — Initial tables: users, classrooms, lessons, quizzes, gamification.

2. **`20260220_0002_expand_domain_schema`** — Added analytics_events, classroom_enrollments, quiz_attempts, quiz_responses; extended tables with timestamps, role fields, and foreign keys.

3. **`20260315_0003_metacognition_content_formats`** — Added metacognitive fields to quiz_responses (`confidence_level`, `reasoning_text`, `reasoning_steps`), reflection fields to quiz_attempts, `content_format` and `flashcards` to lessons, and `quiz_type` to quizzes.

4. **`20260315_0004_cascade_deletes`** — Altered foreign key constraints on quiz → lesson, attempt → quiz, response → attempt to include `ON DELETE CASCADE`, ensuring clean deletion chains without orphaned rows.

5. **`20260324_0005_knowledge_graph`** — Added the concept graph tables: `concepts`, `concept_prerequisites`, `student_concept_mastery`. The mastery table holds `mastery_score`, `attempts`, and `metacognitive_score`.

6. **`20260331_0006_student_model_evidence`** — Extended `student_concept_mastery` with an `evidence` JSONB column (last 20 data points per concept) so every mastery judgement is traceable back to individual responses.

7. **`20260401_0007_hint_scaffolding_zpd`** — Added `quiz_responses.hints_used` (integer), converted attempt `score` and `max_score` to floats for partial-credit support, and added `unaided_mastery` and `aided_mastery` float columns to `student_concept_mastery` for ZPD tracking.

8. **`20260402_0008_formative_assessments`** — Added the `formative_assessments` table with `assessment_type`, `questions` (JSONB), `responses` (JSONB), `score`, `correct_count`, `recommended_actions` (JSONB), and `concept_ids_assessed` (JSONB).

9. **`20260402_0009_teaching_sessions`** — Added the `teaching_sessions` table with `conversation` (JSONB), `assessment` (JSONB), `overall_score`, `turn_count`, and `completed_at`.

10. **`20260405_0010_lesson_documents`** — Added the `lesson_documents` table linking uploaded files to lessons, storing `filename`, `file_path`, `mime_type`, and `extracted_text`.

11. **`20260413_0011_lesson_prompt_nullable`** — Changed `lessons.prompt` from `NOT NULL` to nullable, enabling manual lesson authoring without a prompt.

12. **`20260420_0012_classroom_curriculum_profile`** — Added `subject`, `year_group`, `learning_objectives`, and `syllabus_notes` columns to the classrooms table:

```python
def upgrade() -> None:
    op.add_column("classrooms", sa.Column("subject", sa.String(), nullable=True))
    op.add_column("classrooms", sa.Column("year_group", sa.String(), nullable=True))
    op.add_column("classrooms", sa.Column("learning_objectives", sa.Text(), nullable=True))
    op.add_column("classrooms", sa.Column("syllabus_notes", sa.Text(), nullable=True))
```

Each migration was tested by running `alembic upgrade head` followed by `alembic check` to verify ORM-database alignment.

---

## 5.4 Authentication & Security

### 5.4.1 Password Hashing

The security module uses bcrypt as the primary hashing scheme with a PBKDF2-SHA256 fallback for environments where bcrypt is unavailable. It also handles legacy plaintext passwords with time-constant comparison and automatic rehashing on next login:

The two-field `NamedTuple` return type is the key design decision — it lets the login route silently rehash a legacy password on the user's next login, with no separate migration required:

```python
class PasswordVerificationResult(NamedTuple):
    verified: bool
    needs_rehash: bool
```

```python
def verify_password(password: str, stored_hash: str) -> PasswordVerificationResult:
    if bcrypt is not None and _is_bcrypt_hash(stored_hash):
        verified = bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
        return PasswordVerificationResult(verified=verified, needs_rehash=False)

    verified = _verify_legacy_password(password, stored_hash)
    return PasswordVerificationResult(verified=verified, needs_rehash=verified and bcrypt is not None)
```

This layered approach ensures backwards compatibility while upgrading users to the strongest available scheme.

### A4.2 JWT Authentication

JSON Web Tokens are used for stateless authentication. When a user logs in, the server creates a signed HS256 token containing their user ID and role:

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

The API uses a consistent dual-layer protection pattern. Teacher-only operations (creating lessons, publishing quizzes) verify `actor_user.role == "teacher"` and additionally check classroom ownership. Student-only operations (submitting quiz attempts) verify `actor_user.role == "student"`. This prevents both horizontal (accessing another user's resources) and vertical (accessing resources of a higher-privilege role) privilege escalation.

---

## 5.5 AI Service Integration

### 5.5.1 Architecture

The AI service supports two LLM providers: Google Gemini (`gemini-2.5-flash`) as the primary, and OpenAI (`gpt-4o-mini`) as a fallback. Provider selection is transparent to the rest of the application:

The five functions that implement this architecture are:

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


def _call_openai(system_prompt: str, user_prompt: str) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=4000,
    )
    return response.choices[0].message.content


def _call_model(system_prompt: str, user_prompt: str) -> str:
    if _use_gemini():
        logger.info("Using Gemini for AI generation")
        return _call_gemini(system_prompt, user_prompt)
    logger.info("Using OpenAI for AI generation")
    return _call_openai(system_prompt, user_prompt)


def _call_model_with_retry(
    system_prompt: str, user_prompt: str, *, max_retries: int = 2
) -> dict:
    """Call the AI model and parse JSON, retrying on parse failure."""
    last_exc = None
    for attempt in range(1, max_retries + 1):
        raw = _call_model(system_prompt, user_prompt)
        try:
            return _parse_json(raw)
        except (json.JSONDecodeError, ValueError) as exc:
            last_exc = exc
            logger.warning(
                "AI JSON parse failed (attempt %d/%d): %s", attempt, max_retries, exc
            )
    raise last_exc
```

`_use_gemini()` checks whether a Gemini API key is configured; if not, `_call_model()` falls through to OpenAI. All AI calls use structured JSON outputs. Each prompt instructs the model to respond with a specific JSON schema, enforced in Gemini via `response_mime_type="application/json"` and in OpenAI via `response_format={"type": "json_object"}`.

### 5.5.2 Lesson Generation

When a teacher creates a lesson, the AI service adapts its system prompt based on the selected content format:

```python
LESSON_FORMAT_INSTRUCTIONS = {
    "slides": "Structure the body with Markdown headings (##) matching the outline sections.",
    "pdf_report": "Structure the body as a formal report with introduction, detailed sections...",
    "presentation": "Structure the body as presentation slides. Keep text concise...",
    "flashcards": "Structure the body as a series of flashcard pairs...",
}
```

Four content formats are supported: **Slides** (paginated viewer), **PDF Report** (formal document), **Presentation** (concise slides with speaker notes), and **Flashcards** (question-answer pairs with flip animation). Teachers can reformat an existing lesson to a different format at any time.

When a classroom has a curriculum profile set, the profile is injected ahead of the prompt before the AI call:

```python
user_prompt = (
    "[CURRICULUM CONTEXT — follow these constraints for all content]\n"
    f"{curriculum_context}\n\n"
    "[LESSON REQUEST]\n"
    f"{prompt}"
)
```

This ensures all AI-generated content for a classroom stays aligned with the teacher's specified subject, year group, learning objectives, and syllabus notes, without the teacher needing to repeat this context on every generation request.

### 5.5.3 Quiz Generation

Three distinct quiz types are generated from lesson content:

**Standard MCQ** — Five questions with mixed difficulty (2 easy, 2 medium, 1 hard), each with four options, an explanation, `concept_tags`, and a 3-level `hints` array.

**Kahoot-style** — Fast-paced questions with short answer options, per-question time limits, and point values:

```python
KAHOOT_QUIZ_PROMPT = """\
You are an expert educator creating a fun, fast-paced Kahoot-style quiz.
Respond with ONLY valid JSON matching this schema:

{
  "questions": [
    {
      "question": "Short, punchy question text (max 120 chars)",
      "type": "kahoot",
      "options": ["Short answer text", "Another answer", "Third option", "Fourth option"],
      "correct_answer": "Short answer text",
      "explanation": "Brief explanation",
      "time_limit_seconds": 20,
      "points": 1000,
      "concept_tags": ["Concept Name 1"],
      "hints": ["Level 1 hint", "Level 2 hint", "Level 3 hint"]
    }
  ]
}

Guidelines:
- Generate exactly 5 questions unless told otherwise.
- Keep questions SHORT and engaging — this is a game!
- Mix difficulty: 2 easy, 2 medium, 1 hard.
- Time limits: easy=30s, medium=20s, hard=15s.
- Points: easy=500, medium=1000, hard=1500.
- Options should be short (1-4 words each). Use actual answer text, NOT letters like "A", "B", "C", "D".
- correct_answer MUST be the exact text of one of the options (copy it verbatim).
- concept_tags: list the 1-3 concept names that this question tests.
  If a list of known concepts is provided, use those exact names.
- hints: provide exactly 3 progressive hints per question.
  Start with a broad cue, then a stronger direction, then a near-solution nudge.
  Keep hints short and game-friendly, but never reveal the answer outright.
"""
```

**Metacognitive** — Questions that assess how students think, not just what they know:

```python
METACOGNITIVE_QUIZ_PROMPT = """\
You are an expert educator creating a metacognitive assessment that evaluates
how students THINK, not just what they know. Generate questions that require
students to explain reasoning, analyse errors, apply concepts to new contexts,
and demonstrate deep understanding.

Respond with ONLY valid JSON matching this schema:

{
  "questions": [
    {
      "question": "The question text",
      "type": "explain_reasoning|error_analysis|transfer|multi_step",
      "options": ["Full option text", "Another option", "Third choice", "Fourth choice"],
      "correct_answer": "Full option text",
      "explanation": "Detailed explanation of the correct reasoning process",
      "requires_reasoning": true,
      "reasoning_prompt": "Explain why you chose this answer and what concepts you applied.",
      "steps": ["Step 1 description", "Step 2 description"],
      "concept_tags": ["Concept Name 1"],
      "hints": ["Level 1 hint", "Level 2 hint", "Level 3 hint"]
    }
  ]
}

Question type guidelines:
- explain_reasoning: MCQ + student must write WHY they chose their answer.
  Set requires_reasoning=true and include a reasoning_prompt.
- error_analysis: Present a WRONG answer/solution and ask student to identify
  and explain the error. Include the flawed reasoning in the question.
- transfer: Apply a concept from the lesson to a completely NEW context
  the student hasn't seen. Tests deep understanding vs memorisation.
- multi_step: Break a problem into sequential steps. Include a "steps" array
  describing each step. Student works through each step to reach the answer.

Generate 5 questions: 2 explain_reasoning, 1 error_analysis, 1 transfer, 1 multi_step.
- concept_tags: list the 1-3 concept names that this question tests.
  If a list of known concepts is provided, use those exact names.
- hints: provide exactly 3 progressive hints per question.
  Hint 1 should prompt reflection, Hint 2 should narrow the reasoning path,
  Hint 3 should scaffold the final step without stating the answer directly.
"""
```

The four metacognitive question types are:
- `explain_reasoning` — MCQ plus a written justification prompt
- `error_analysis` — Present a flawed solution and ask the student to identify the error
- `transfer` — Apply a concept to a new context the student has not seen
- `multi_step` — Sequential problem-solving with a visible steps array

### 5.5.4 Concept Graph Extraction

When a teacher requests AI concept extraction from a lesson, the service sends the lesson title and up to 6,000 characters of the body to the concept graph prompt:

```python
CONCEPT_GRAPH_SYSTEM_PROMPT = """\
You are an expert educator and knowledge-graph architect. Given lesson content,
extract the key concepts and their prerequisite relationships.
Respond with ONLY valid JSON matching this schema:

{
  "concepts": [
    { "name": "Short concept name", "description": "One-sentence description" }
  ],
  "prerequisites": [
    { "concept": "Concept Name", "prerequisite": "Prerequisite Concept Name" }
  ]
}

Guidelines:
- Extract 5-15 concepts depending on lesson complexity.
- Prerequisites mean: 'you should understand X before learning Y'.
- Don't create circular dependencies.
"""
```

The `KnowledgeGraphService.generate_from_lesson()` method processes the AI response, creates or deduplicates concept records, and persists the directed prerequisite edges:

```python
for c in ai_result.get("concepts", []):
    concept = self.create_concept(
        db, classroom_id=lesson.classroom_id,
        name=c["name"], description=c.get("description"),
        lesson_id=lesson.id,
    )
    created_concepts[c["name"]] = concept

for p in ai_result.get("prerequisites", []):
    concept_obj = created_concepts.get(p["concept"])
    prereq_obj = created_concepts.get(p["prerequisite"])
    if concept_obj and prereq_obj and concept_obj.id != prereq_obj.id:
        self.add_prerequisite(db, concept_id=concept_obj.id, prerequisite_id=prereq_obj.id)
```

### 5.5.5 Confused Learner AI

The Peer Teaching Simulator uses a distinct persona prompt that instructs the model to behave as a struggling student, not a teacher:

```python
CONFUSED_LEARNER_PROMPT = """\
You are a virtual student named Alex who is trying to learn a topic but is struggling.
You have PARTIAL understanding — you know some basics but hold specific misconceptions.

Behavioural rules:
- Stay in character. Never break the fourth wall or reveal you are an AI.
- When the student explains something well, show gradual understanding ("Oh, so you mean…?").
- When the student's explanation is vague or incorrect, push back politely.
- Ask follow-up questions that probe depth: "Why does that happen?", "Can you give me an example?"
- Keep responses concise (2-4 sentences). You are a student, not a lecturer.

Respond with ONLY valid JSON: {"message": "Your response as Alex"}
"""
```

After the session ends, a separate `TEACHING_ASSESSMENT_PROMPT` evaluates the full conversation against four rubric dimensions: completeness (25%), accuracy (30%), clarity (25%), and depth (20%).

### 5.5.6 Concept Inventory Generation

The adaptive concept inventory uses mastery-scaled difficulty to generate questions appropriate to each student's current level:

```python
CONCEPT_INVENTORY_PROMPT = """\
...
Guidelines:
- Difficulty should match the student's current mastery for each concept:
  low mastery (<0.4) → easy, medium mastery (0.4-0.7) → medium, high mastery (>0.7) → hard.
- Cover as many provided concepts as possible, prioritising low-mastery ones.
"""
```

### 5.5.7 Robust JSON Parsing

A significant implementation challenge was reliably parsing JSON from LLM outputs, which occasionally include markdown fences, unescaped characters, or trailing text. A multi-stage fallback parser handles these cases in sequence.

The first helper, `_fix_json_strings()`, is a character-by-character state machine that escapes bare newlines, carriage returns, and tabs found inside JSON string values, while leaving the structural JSON syntax untouched:

```python
def _fix_json_strings(raw: str) -> str:
    """Fix unescaped control characters inside JSON string values."""
    result = []
    in_string = False
    escape_next = False

    for ch in raw:
        if escape_next:
            result.append(ch)
            escape_next = False
            continue
        if ch == "\\":
            result.append(ch)
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            result.append(ch)
            continue
        if in_string:
            if ch == "\n":
                result.append("\\n")
                continue
            if ch == "\r":
                result.append("\\r")
                continue
            if ch == "\t":
                result.append("\\t")
                continue
        result.append(ch)

    return "".join(result)
```

The main parser, `_parse_json()`, applies four stages in sequence, stopping as soon as one succeeds:

```python
def _parse_json(raw: str) -> dict:
    """Parse JSON from AI response, handling common issues."""
    # Stage 1: Try direct parse
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Stage 2: Strip markdown code fences
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Stage 3: Fix unescaped newlines/tabs inside string values
    text = cleaned if cleaned != raw.strip() else raw
    fixed = _fix_json_strings(text)
    try:
        return json.loads(fixed)
    except json.JSONDecodeError:
        pass

    # Stage 4: Brace-matching extraction of the outermost JSON object
    try:
        start = text.index("{")
        depth = 0
        in_str = False
        esc = False
        for i, ch in enumerate(text[start:], start):
            if esc:
                esc = False
                continue
            if ch == "\\":
                esc = True
                continue
            if ch == '"':
                in_str = not in_str
                continue
            if not in_str:
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        extracted = text[start : i + 1]
                        return json.loads(_fix_json_strings(extracted))
    except (ValueError, json.JSONDecodeError):
        pass

    raise json.JSONDecodeError("Could not parse AI response as JSON", raw, 0)
```

Stage 4's brace-matching extractor maintains `in_str` and `esc` flags so it correctly skips `{` and `}` characters inside string values, finding only the outermost matching pair. This handles the case where the model appends a prose explanation after the JSON object. Together, the four stages handle approximately 95% of observed LLM output anomalies without requiring changes to the prompts.

---

## 5.6 Backend Architecture

### 5.6.1 Layered Design

The backend follows a strict three-layer architecture:

1. **Router Layer** — FastAPI route handlers that parse requests and return responses. Minimal logic; concerned with HTTP semantics only.
2. **Service Layer** — Business logic: authorisation checks, AI orchestration, scoring, mastery updates, gamification. Stateless — services receive database sessions as parameters.
3. **Repository Layer** — Data access operations (CRUD). Wraps SQLAlchemy queries for a specific model.

This separation enables testability (services can be tested with mock repositories) and keeps each layer focused on a single responsibility.

### 5.6.2 API Route Summary

Ten routers are mounted on the application, providing over 40 endpoints:

| Router | Prefix | Key Endpoints |
|--------|--------|---------------|
| Auth | `/auth` | Login, register, get current user |
| Classrooms | `/classrooms` | CRUD, join by code, list lessons/quizzes |
| Lessons | `/lessons` | CRUD, publish, AI generate, reformat, document upload |
| Quizzes | `/quizzes` | CRUD, publish, AI generate, PATCH questions |
| Quiz Attempts | `/quizzes/{id}/attempts` | Submit attempt, list attempts, update reflection |
| Gamification | `/gamification` | Leaderboard, user XP/badges |
| Analytics | `/analytics` | Student quiz history, calibration, topic mastery; teacher class summary |
| Knowledge Graph | `/classrooms/{id}/concepts` | Concept CRUD, generate from lesson, graph query, blind spots, practice targets, practice quiz |
| Formative Assessment | `/classrooms/{id}/formative` | Concept inventory start and submit |
| Peer Teaching | `/classrooms/{id}/teaching` | Start session, send message, complete session, list sessions |

---

## 5.7 Quiz Attempt & Scoring System

When a student submits a quiz, the `QuizAttemptService.submit_attempt()` method executes the following sequence:

The per-question scoring loop extracts answer metadata, computes hint-adjusted credit, persists each `QuizResponse`, and collects concept mastery updates for the post-loop phase:

```python
concept_mastery_updates: list[tuple[int, bool, int | None, int, float]] = []

for idx, question in enumerate(questions):
    raw_answer = answers.get(str(idx), "")
    selected, confidence, reasoning_text, reasoning_steps, raw_hints_used = \
        _extract_answer_detail(raw_answer)

    correct_answer = (question.get("correct_answer") or "").strip()
    is_correct = (selected or "").strip() == correct_answer
    hints_used = _normalize_hints_used(
        raw_hints_used,
        len(question.get("hints") or []),
    )
    credit_earned = _credit_for_hint_usage(hints_used) if is_correct else 0.0
    xp = _xp_for_credit(credit_earned) if is_correct else 0

    if is_correct:
        score += credit_earned
        total_xp += xp
    if hints_used > 0:
        total_hints_used += hints_used

    calibration_data.append((is_correct, confidence))

    self.attempt_repo.add_response(
        db,
        attempt_id=attempt.id,
        question_index=idx,
        question_payload=question,
        selected_answer=selected,
        is_correct=is_correct,
        awarded_xp=xp,
        hints_used=hints_used,
        confidence_level=confidence,
        reasoning_text=reasoning_text,
        reasoning_steps=reasoning_steps,
    )

    for cid in question.get("concept_ids", []):
        concept_mastery_updates.append(
            (cid, is_correct, confidence, hints_used, credit_earned)
        )
```

After the loop, mastery scores are snapshotted before updating (so the frontend can show a before/after diff), then `KnowledgeGraphService.update_mastery()` is called for every concept tag in the attempt:

```python
# Snapshot mastery before updates for the diff panel
unique_concept_ids = list({cid for cid, *_ in concept_mastery_updates})
if unique_concept_ids:
    pre_rows = db.query(StudentConceptMastery).filter(
        StudentConceptMastery.student_id == actor_user.id,
        StudentConceptMastery.concept_id.in_(unique_concept_ids),
    ).all()
    mastery_before_map = {r.concept_id: r.mastery_score for r in pre_rows}

# Update concept mastery from all responses in this attempt
for concept_id, is_correct, confidence, hints_used, credit_earned in concept_mastery_updates:
    self.kg.update_mastery(
        db,
        student_id=actor_user.id,
        concept_id=concept_id,
        is_correct=is_correct,
        confidence=confidence,
        attempt_id=attempt.id,
        hints_used=hints_used,
        credit_earned=credit_earned,
    )
```

Hint-adjusted scoring reduces the credit earned for questions answered correctly only after hints:

```python
HINT_PENALTY_STEP = 0.25
MIN_HINT_CREDIT = 0.25

def _credit_for_hint_usage(hints_used: int) -> float:
    return round(max(MIN_HINT_CREDIT, 1.0 - (HINT_PENALTY_STEP * hints_used)), 2)
```

A student who answers correctly with no hints earns 1.0 credit (10 XP). With one hint they earn 0.75 credit, two hints 0.50, three hints 0.25 minimum credit. This makes scaffolding transparent: students can still succeed with support, but the system distinguishes between unaided and aided performance.

### 5.7.1 Calibration Scoring

A novel feature is the confidence calibration score, which measures how accurately a student's self-assessed confidence predicts their actual performance:

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

Confidence levels 1–5 map to expected accuracy 0–100%. The score runs from 0.0 (poor calibration) to 1.0 (perfect calibration). A student who rates themselves "very confident" (5) on questions they get wrong receives a lower calibration score, directly incentivising honest self-assessment.

### 5.7.2 Badge System

Five badges are awarded automatically based on specific achievements:

- **`first_quiz`** — Complete the first ever quiz attempt.
- **`perfect_score`** — Score 100% on any quiz.
- **`good_calibration`** — Achieve a calibration score ≥ 0.75.
- **`growth_mindset`** — Improve the score on a quiz that was previously attempted.
- **`reflective_learner`** — Submit five or more post-quiz reflections.

Teaching-related badges (`first_teaching`, `clear_explainer`, `patient_teacher`) are awarded on peer teaching session completion. Badges are stored as a JSONB array on the gamification record and deduplicated to prevent double awards.

---

## 5.8 Adaptive Difficulty

The adaptive service recommends quiz difficulty based on a student's recent performance using a simple threshold algorithm:

```python
ACCURACY_INCREASE_THRESHOLD = 0.80  # > 80% → increase difficulty
ACCURACY_DECREASE_THRESHOLD = 0.40  # < 40% → decrease difficulty
RECENT_WINDOW = 5                   # look at last 5 attempts
```

The algorithm examines the five most recent quiz attempts in a classroom, calculates overall accuracy, and recommends stepping up (`easy → medium → hard`) if above 80%, or stepping down if below 40%. This creates a responsive feedback loop without requiring a complex machine learning model, keeping the student in their zone of proximal development.

The adaptive feedback generator also analyses individual responses to surface calibration issues:

```python
overconfident = [r for r in rated if r.confidence_level >= 4 and not r.is_correct]
underconfident = [r for r in rated if r.confidence_level <= 2 and r.is_correct]
```

This produces targeted natural-language feedback such as "You were confident but incorrect on 2 questions — consider reviewing these topics" or "You got 3 right despite low confidence — trust your knowledge more."

---

## 5.9 Knowledge Graph System

### 5.9.1 Data Model

The knowledge graph is built on three models. `Concept` records belong to a classroom and optionally link to the lesson they were extracted from (using `SET NULL` on deletion so the concept survives if the lesson is removed). `ConceptPrerequisite` is a pure directed-edge table implementing the prerequisite DAG. `StudentConceptMastery` holds per-student performance data:

```python
class StudentConceptMastery(Base):
    __tablename__ = "student_concept_mastery"

    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    mastery_score = Column(Float, default=0.0)        # overall EMA mastery
    unaided_mastery = Column(Float, nullable=True)     # success without hints
    aided_mastery = Column(Float, nullable=True)       # success with hints
    metacognitive_score = Column(Float, nullable=True) # calibration accuracy
    attempts = Column(Integer, default=0)
    evidence = Column(JSONB, default=list)             # last 20 data points
```

### 5.9.2 Mastery Update Algorithm

Every time a student answers a question tagged with a concept, `KnowledgeGraphService.update_mastery()` updates the student's mastery record using an exponential moving average (EMA) with `alpha=0.3`:

```python
alpha = 0.3
new_value = credit_earned if credit_earned is not None else (1.0 if is_correct else 0.0)
row.mastery_score = round(alpha * new_value + (1 - alpha) * row.mastery_score, 3)
```

The EMA weights recent performance more heavily than older attempts, allowing the system to track improvement or regression over time. After every update, an evidence data point is appended to the JSONB array:

```python
evidence_point = {
    "attempt_id": attempt_id,
    "is_correct": is_correct,
    "confidence": confidence,
    "hints_used": hints_used,
    "credit_earned": new_value,
    "mastery_after": row.mastery_score,
    "unaided_mastery_after": row.unaided_mastery,
    "aided_mastery_after": row.aided_mastery,
    "timestamp": datetime.now(timezone.utc).isoformat(),
}
```

This means every mastery score in the system is fully traceable back to the individual quiz responses that produced it — a key requirement of the Open Learner Model's transparency goal (Luckin, 2017).

### 5.9.3 ZPD Tracking

The mastery update also tracks Vygotsky's Zone of Proximal Development by separating unaided from aided performance:

```python
zpd_value = 1.0 if is_correct else 0.0
if hints_used > 0:
    row.aided_mastery = round(alpha * zpd_value + (1 - alpha) * baseline, 3)
else:
    row.unaided_mastery = round(alpha * zpd_value + (1 - alpha) * baseline, 3)
```

The ZPD delta — `aided_mastery − unaided_mastery` — is computed at query time and exposed to the frontend. A large positive delta indicates the student can succeed with support but not yet independently, making the concept an ideal next practice target.

### 5.9.4 Blind-Spot Detection

Low-mastery prerequisite concepts represent knowledge gaps that may block further learning. The `get_blind_spots()` method identifies these:

```python
def get_blind_spots(self, db, classroom_id, student_id):
    prereq_ids = {link["source"] for link in graph["links"]}

    for pid in prereq_ids:
        node = node_map.get(pid)
        if node and node["mastery"] < 0.5:
            blocks = [
                node_map[link["target"]]["name"]
                for link in graph["links"]
                if link["source"] == pid
            ]
            blind_spots.append({
                "concept_id": node["id"],
                "concept_name": node["name"],
                "mastery": node["mastery"],
                "blocks": blocks,
            })
    return sorted(blind_spots, key=lambda x: x["mastery"])
```

Any concept with mastery below 0.5 that is a prerequisite for other concepts is flagged as a blind spot, sorted by severity (lowest mastery first).

### 5.9.5 Concept-Driven Practice Targeting

The practice target algorithm selects the highest-priority concepts using a weighted composite score:

```python
priority = (
    0.40 * criticality       # blind-spot concepts that block others
    + 0.30 * deficit         # lower mastery = higher priority
    + 0.20 * zpd_score       # large ZPD gap = ready to learn with support
    - 0.10 * recency_penalty # deprioritise concepts practised today
)
```

Where:
- `criticality = min(len(blocks) / 3.0, 1.0)` — normalised count of downstream concepts blocked
- `deficit = 1.0 − mastery`
- `zpd_score = min(max(zpd_delta, 0) / 0.3, 1.0)` — normalised ZPD gap
- `recency_penalty = min(recent_today / 3.0, 1.0)` — today's practice count

Concepts already mastered (≥ 0.9) are excluded. The algorithm assigns each concept a human-readable `category` (`blind_spot`, `zpd`, or `low_mastery`) and a `reason` string that is shown to the student, making the selection process transparent rather than a black box.

### 5.9.6 Practice Quiz Generation

Once practice targets are selected, the AI generates a custom quiz targeting those specific concepts:

```python
questions = self.ai.generate_concept_inventory(
    concepts_with_mastery,
    num_questions=num_questions,
    avoid_questions=avoid_questions,  # deduplication against recent quizzes
)

# Resolve AI-generated concept name tags → concept IDs
name_to_id = {c.name: c.id for c in db.query(Concept).filter(...).all()}
for q in questions:
    q["concept_ids"] = [name_to_id[t] for t in q.get("concept_tags", []) if t in name_to_id]
```

The quiz is saved to the database with `quiz_type = "concept_practice"`, which allows the frontend to display the source concept and reason alongside each question.

---

## 5.10 Open Learner Model Visualisation

### 5.10.1 Knowledge Map Component

The `ConceptGraph.js` component renders the concept graph as an interactive, column-based layout. Concepts are grouped by the lesson they were extracted from, creating a natural left-to-right curriculum progression. Each node is colour-coded by mastery tier:

```javascript
function masteryColor(mastery) {
  if (mastery >= 0.7) return "border-emerald-500/60 bg-emerald-500/10"; // Mastered
  if (mastery >= 0.4) return "border-amber-500/60 bg-amber-500/10";    // Developing
  return "border-red-500/60 bg-red-500/10";                            // Needs Work
}
```

Prerequisite edges are drawn as SVG arrows overlaid on top of the DOM nodes. Because DOM positions are only available after the browser has painted the layout, an SVG overlay that recalculates its coordinates using a `ResizeObserver` and `useLayoutEffect` was implemented:

```javascript
useLayoutEffect(() => {
  const recalc = () => {
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPositions = {};
    nodeRefs.current.forEach((el, id) => {
      if (el) {
        const r = el.getBoundingClientRect();
        newPositions[id] = { ... };  // position relative to container
      }
    });
    setNodePositions(newPositions);
  };
  const observer = new ResizeObserver(recalc);
  observer.observe(containerRef.current);
  recalc();
  return () => observer.disconnect();
}, [nodes]);
```

Cross-column edges are rendered as cubic Bezier curves; same-column edges (rare but valid) are rendered as arcs offset to the right, preventing visual overlap (Figure 4).

![Figure 4: Student knowledge graph in DAG mode — concept nodes are colour-coded by mastery tier and connected by SVG prerequisite arrows](images/fig4_knowledge_graph_dag.png)

### 5.10.2 Evidence Trail

Clicking any concept node opens an inline evidence panel. This panel shows:

- A **Sparkline** — a mini SVG line chart of `mastery_after` values across the last 20 attempts, coloured green for improving, red for declining.
- **Mastery metrics** — current `mastery_score`, `unaided_mastery`, `aided_mastery`, and ZPD delta.
- **Metacognitive score** — the per-concept calibration accuracy.
- **Recent attempts** — a table of the last 5 evidence data points (date, correct/incorrect, confidence, hints used, mastery after).

The `Sparkline` component uses the evidence array directly:

```javascript
const pts = evidence
  .filter(e => e.mastery_after != null && e.source !== "self_claim")
  .sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""));

const trend = vals[vals.length - 1] - vals[0];
const lineColor = trend > 0.03 ? "#10b981" : trend < -0.03 ? "#ef4444" : "#f59e0b";
```

### 5.10.3 Calibration Scatter Plot

The calibration scatter plot shows each attempted concept as a dot, with the X axis representing average confidence (normalised to 0–1) and the Y axis representing mastery score. A diagonal reference line (y = x) divides the plot into four regions:

- **Well-calibrated** (near the diagonal) — green dots
- **Overconfident** (high confidence, low mastery) — orange dots
- **Underconfident** (low confidence, high mastery) — cyan dots

```javascript
function calibrationDotColor(confidence, mastery) {
  const gap = confidence - mastery;
  if (gap > 0.2) return "#f97316";  // overconfident
  if (gap < -0.2) return "#06b6d4"; // underconfident
  return "#10b981";                 // well-calibrated
}
```

This scatter plot implements the Open Learner Model concept described by Luckin (2017): "the gap between perceived and actual competence is a powerful metacognitive tool." Students who are consistently overconfident are shown an alert prompting a self-reflection quiz (Figure 5).

![Figure 5: Calibration scatter plot — each concept is plotted with average confidence on the X axis and mastery on the Y axis; the diagonal reference line separates overconfident (orange) from underconfident (cyan) and well-calibrated (green) dots](images/fig5_calibration_scatter.png)

### 5.10.4 Post-Quiz Mastery Diff

The `ConceptMasteryDiff.js` component renders after every quiz submission. It compares mastery scores before and after the attempt for each concept addressed in the quiz, showing a visual before/after bar and the numerical change. This closes the feedback loop immediately after each quiz, showing students directly how their answers affected their concept mastery (Figure 10).

![Figure 10: Post-quiz ConceptMasteryDiff panel — before and after mastery bars for each concept addressed in the quiz, with numerical change indicators](images/fig10_mastery_diff.png)

### 5.10.5 Practice Targets Panel

The `PracticeTargetsPanel.js` component displays the practice targets returned by the backend algorithm, each with a category badge (`Blind Spot`, `ZPD`, `Low Mastery`) and the transparent reason string:

```
Low mastery (32%) — prerequisite for: Newton's Second Law, Momentum
Zone of Proximal Development — you score 71% with hints but 34% without
```

A "Practice Now" button calls the `/practice-quiz` endpoint, creates a targeted quiz, and navigates the student directly to the quiz page. The full Open Learner Model dashboard, accessible via the student progress page, brings together all of these components (Figure 6).

![Figure 6: Student Open Learner Model progress page — showing overall mastery stats, per-subject mastery bars, calibration score card, recent reflections, and earned badges](images/fig6_student_progress_olm.png)

---

## 5.11 Peer Teaching Simulator

### 5.11.1 Session Model

The `TeachingSession` model stores the full multi-turn conversation as a JSONB array. Each turn is a `{role, content, timestamp}` object:

```python
class TeachingSession(Base):
    __tablename__ = "teaching_sessions"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"))
    topic = Column(String, nullable=False)
    conversation = Column(JSONB, nullable=False)    # list of {role, content, timestamp}
    status = Column(String, nullable=False)         # "active" | "completed"
    assessment = Column(JSONB, nullable=True)       # rubric scores + feedback
    overall_score = Column(Float, nullable=True)
    turn_count = Column(Integer, nullable=False, default=0)
    completed_at = Column(DateTime(timezone=True), nullable=True)
```

### 5.11.2 Session Flow

Starting a session creates the database record with an initial opening message from Alex the confused learner. On each message from the student, the service appends the student's message to the conversation array and calls the AI with the full conversation history as context:

```python
conversation.append({"role": "user", "content": student_message, "timestamp": now})
ai_context = f"Topic: {session.topic}\nLesson excerpt: {lesson_excerpt}\n\nConversation:\n"
for turn in conversation:
    ai_context += f"{turn['role'].title()}: {turn['content']}\n"

ai_response = self.ai.get_confused_learner_response(
    CONFUSED_LEARNER_PROMPT, ai_context
)
conversation.append({"role": "assistant", "content": ai_response, "timestamp": now})
session.conversation = conversation
session.turn_count = len(conversation)
```

Storing the full conversation in JSONB avoids re-fetching the lesson on every turn and ensures the AI maintains context coherence across long sessions (up to 20 turns maximum).

### 5.11.3 Teaching Assessment

When the student ends the session, a second AI call evaluates the complete conversation using the `TEACHING_ASSESSMENT_PROMPT`:

```python
TEACHING_ASSESSMENT_PROMPT = """\
Scoring rubric (each 0.0 to 1.0):
- completeness: Did the student cover all key aspects?
- accuracy: Were explanations factually correct?
- clarity: Were explanations clear and well-structured?
- depth: Did the student explain WHY, not just WHAT?
- overall_score: Weighted average (accuracy 30%, completeness 25%, clarity 25%, depth 20%).
"""
```

The assessment JSON (scores, feedback, strengths, improvements) is saved back to the `teaching_sessions.assessment` column. XP is awarded based on `overall_score`, and teaching badges are assigned. The frontend renders the assessment as a radar chart and an actionable feedback panel.

---

## 5.12 Formative Assessment

### 5.12.1 Concept Inventory

The formative assessment module generates an adaptive concept inventory: a set of questions scaled in difficulty to match the student's current mastery for each concept. The service selects all concepts in the classroom and queries their mastery scores before calling the AI:

```python
concepts_with_mastery = [
    {
        "id": concept.id,
        "name": concept.name,
        "description": concept.description or "",
        "mastery": mastery_map.get(concept.id, 0.0),
    }
    for concept in classroom_concepts
]
questions = self.ai.generate_concept_inventory(concepts_with_mastery, num_questions=10)
```

The difficulty scaling rule from the prompt (easy for mastery < 0.4, medium for 0.4–0.7, hard for > 0.7) means that students with low mastery get accessible questions that build confidence, while well-mastered concepts are probed with harder questions to confirm depth of understanding.

### 5.12.2 Submission and Mastery Update

On submission, the service scores the inventory against stored correct answers, updates mastery scores for each concept addressed, and generates `recommended_actions` — a list of concepts to focus on next, with reasons:

```python
assessment.score = correct_count / len(questions)
assessment.recommended_actions = [
    {"concept": q["concept_name"], "reason": "Answered incorrectly — needs review"}
    for q in questions
    if not responses_map.get(q["id"], {}).get("is_correct")
]
```

The `FormativeAssessment` record persists all of this for teacher inspection.

---

## 5.13 Classroom Curriculum Profile & Lesson Documents

### 5.13.1 Curriculum Profile

Migration 0012 added four nullable columns to the `classrooms` table: `subject`, `year_group`, `learning_objectives`, and `syllabus_notes`. Teachers set these once through the classroom edit page and the values are automatically incorporated into every subsequent AI generation request for that classroom.

In `LessonService.create_lesson()`, the profile is assembled into a context string before the AI call:

```python
curriculum_parts = []
if classroom.subject:
    curriculum_parts.append(f"Subject: {classroom.subject}")
if classroom.year_group:
    curriculum_parts.append(f"Year group / level: {classroom.year_group}")
if classroom.learning_objectives:
    curriculum_parts.append(f"Learning objectives:\n{classroom.learning_objectives}")
if classroom.syllabus_notes:
    curriculum_parts.append(f"Syllabus notes:\n{classroom.syllabus_notes[:2000]}")
curriculum_context = "\n".join(curriculum_parts) or None
```

The same pattern is applied to quiz generation and lesson reformatting, ensuring consistent content alignment throughout the classroom.

### 5.13.2 Lesson Documents

Teachers can upload reference documents (PDF or DOCX) that are extracted and used as additional context for AI lesson generation. Migration 0010 added the `lesson_documents` table. The document router accepts a multipart file upload:

```python
@router.post("/lessons/{lesson_id}/documents")
async def upload_document(lesson_id: int, file: UploadFile = File(...)):
    text = await document_service.extract_and_save(db, lesson_id=lesson_id, file=file)
    return {"extracted_characters": len(text)}
```

The `DocumentService.extract_text()` method dispatches based on MIME type:

```python
def extract_text(self, file_path: str, mime_type: str) -> str:
    if mime_type == "application/pdf":
        return self._extract_pdf(file_path)   # uses PyPDF2
    elif mime_type in ("application/vnd.openxmlformats...",):
        return self._extract_docx(file_path)  # uses python-docx
    return ""
```

The extracted text is stored in `lesson_documents.extracted_text`. When a teacher subsequently generates a lesson with `generate=true`, the lesson service prepends the extracted document text to the AI prompt as reference material:

```python
if getattr(payload, "reference_text", None):
    ai_prompt += f"\n\nReference material:\n{payload.reference_text[:8000]}"
```

---

## 5.14 Teacher Content Control

### 5.14.1 Manual Lesson Authoring

Making `lessons.prompt` nullable (migration 0011) enabled a manual authoring mode. The lesson creation endpoint checks `use_ai` and the presence of a prompt:

```python
if use_ai and payload.prompt:
    ai_result = self.ai_service.generate_lesson(ai_prompt, ...)
    generated_by_ai = True
else:
    # Use the payload title, outline, and body directly — no AI call
    title = payload.title
    body = payload.body
    generated_by_ai = False
```

The frontend provides a mode toggle between "AI Generation" and "Manual Authoring", with the manual mode showing a rich text area for the body.

### 5.14.2 Inline Quiz Editing

The quiz PATCH endpoint allows teachers to update any field of a quiz — title, difficulty, questions — after creation:

```python
@router.patch("/quizzes/{quiz_id}")
def update_quiz(quiz_id: int, payload: QuizUpdate, ...):
    if payload.questions is not None:
        quiz.questions = [q.model_dump() for q in payload.questions]
    if payload.title is not None:
        quiz.title = payload.title
    # ... other fields
```

The frontend renders editable question cards with inline inputs for question text, each option, the correct answer dropdown, explanation, and all three hint levels. Teachers can add new questions, delete existing ones, and drag-and-drop to reorder.

### 5.14.3 Concept Management

Teachers can manually create, edit, and delete concepts on the knowledge graph without using AI extraction:

```python
def create_concept(self, db, *, classroom_id, name, description=None):
    existing = db.query(Concept).filter(
        Concept.classroom_id == classroom_id, Concept.name == name
    ).first()
    if existing:
        return existing  # idempotent
    concept = Concept(classroom_id=classroom_id, name=name, description=description)
    db.add(concept)
    db.flush()
    return concept

def add_prerequisite(self, db, *, concept_id, prerequisite_id):
    # Deduplication check before creating the edge
    existing = db.query(ConceptPrerequisite).filter(...).first()
    if existing:
        return existing
    edge = ConceptPrerequisite(concept_id=concept_id, prerequisite_id=prerequisite_id)
    db.add(edge)
    db.flush()
    return edge
```

The teacher knowledge graph page provides a sidebar with forms for concept creation and editing, and click-based prerequisite management on the graph itself.

---

## 5.15 Frontend Implementation

### 5.15.1 Application Structure

The frontend uses Next.js App Router with route groups to separate public, auth, and dashboard routes:

```
frontend/app/
├── layout.js              # Root: AuthProvider + ThemeProvider + Navbar
├── page.js                # Landing page
├── globals.css            # Dark/light CSS variables
├── (auth)/login, register
└── (dashboard)/
    ├── teacher/
    │   ├── classrooms/[id]/page.js         # classroom overview
    │   ├── classrooms/[id]/lessons/new     # AI lesson builder + manual mode
    │   ├── classrooms/[id]/quizzes/[id]    # quiz editor with inline question editing
    │   ├── classrooms/[id]/edit/           # curriculum profile editor
    │   └── classrooms/[id]/knowledge-graph # concept management + heatmap
    └── student/
        ├── classrooms/[id]/page.js         # lessons + quizzes list
        ├── classrooms/[id]/quizzes/[id]    # quiz taking (all 3 types)
        ├── classrooms/[id]/knowledge-graph # OLM knowledge map + practice targets
        └── progress/page.js                # full OLM dashboard
```

### 5.15.2 Authentication Flow

The `AuthProvider` component wraps the entire application and manages auth state:

1. On load, checks `localStorage` for a saved JWT.
2. Validates the token by calling `GET /auth/me`.
3. Stores the user object (id, name, role) in React Context.
4. On 401, clears the token and redirects to `/login`.

Role-based layout guards enforce access:

```javascript
// teacher/layout.js
if (!user) { redirect("/login"); return null; }
if (user.role !== "teacher") { redirect("/student"); return null; }
```

After login, students are taken to their personal dashboard showing XP progress, active courses, and enrolled classrooms (Figure 1).

![Figure 1: Student dashboard — XP and streak stat cards, enrolled classroom tiles, and the join-by-code form](images/fig1_student_dashboard.png)

### 5.15.3 Teacher AI Lesson Builder

Teachers land on their own dashboard showing classroom stat cards, quick-access action buttons, and a grid of recent classrooms (Figure 2).

![Figure 2: Teacher dashboard — stat cards for active classrooms, quick-action buttons for AI lesson generation and classroom creation, and classroom overview cards](images/fig2_teacher_dashboard.png)

The lesson creation page offers two modes:

- **AI Mode** — Prompt textarea, content format selector (Slides / PDF Report / Presentation / Flashcards), optional reference document upload, and live preview after generation.
- **Manual Mode** — Title and body textarea for writing content without AI.

Figure 3 shows the AI lesson builder with the prompt input and format selector visible.

![Figure 3: AI lesson builder — teacher prompt textarea, content format selector (Slides, PDF Report, Presentation, Flashcards), and optional reference document upload](images/fig3_lesson_builder.png)

### 5.15.4 Student Quiz Interface

Three quiz modes are implemented:

**Standard MCQ** — Radio buttons with per-question confidence ratings and optional hints revealed progressively. Post-quiz screen shows calibration score and per-question feedback (Figure 7).

![Figure 7: Standard MCQ quiz interface — answer radio buttons with a 1–5 confidence rating selector and a progressive hint panel below each question](images/fig7_mcq_quiz.png)

**Kahoot-style** (`KahootQuiz` component) — Countdown timer bar changing colour (green → amber → red), four coloured answer buttons, per-question instant feedback, streak counter, and a game-over screen with emoji reactions (Figure 8).

![Figure 8: Kahoot-style quiz — countdown timer bar, four large coloured answer buttons, and the per-question instant feedback overlay](images/fig8_kahoot_quiz.png)

**Metacognitive** — MCQ plus reasoning text input, progressive hint panels that each reduce the maximum score, and a post-quiz reflection form.

### 5.15.5 Knowledge Map (Student View)

The student knowledge graph page shows:

- The interactive `ConceptGraph.js` visualisation with mastery colour-coding and SVG prerequisite arrows.
- An evidence trail panel that opens when any concept node is clicked.
- The `ConceptMasteryDiff.js` component after quizzes showing before/after mastery per concept.
- The `PracticeTargetsPanel.js` component showing top-priority weak concepts with transparent reasoning and a "Practice Now" button.
- A calibration scatter plot showing confidence vs. mastery per concept.

### 5.15.6 Peer Teaching Chat UI

The teach-back page renders as a chat interface:

- A topic header and lesson reference.
- Scrollable message history with distinct styling for student (right-aligned) and Alex/AI (left-aligned) messages.
- A "Send" button and character counter.
- A turn counter and progress indicator (up to 20 turns).
- An "End Session" button that triggers the AI assessment.
- An assessment results panel with a radar chart and feedback list (Figure 9).

![Figure 9: Peer teaching chat interface — student messages aligned right, Alex's confused-learner responses aligned left, turn counter, and the end-session assessment results panel](images/fig9_peer_teaching_chat.png)

### 5.15.7 Theming

A dark/light theme system uses CSS custom properties:

```css
:root {
    --bg-surface: #0a0f1e;       /* Deep navy (dark mode default) */
    --accent-primary: #06b6d4;   /* Cyan */
    --accent-secondary: #8b5cf6; /* Violet */
}

[data-theme="light"] {
    --bg-surface: #f8fafc;
    --bg-card: rgba(255, 255, 255, 0.9);
}
```

The `ThemeProvider` persists the preference to `localStorage` and sets `data-theme` on `<html>`. All components use CSS variables, ensuring consistent theme switching with a 0.3s transition.

---

## 5.16 Problems Encountered and Solutions

### 5.16.1 LLM JSON Parsing Failures

**Problem:** LLM responses frequently included markdown code fences, trailing commentary, or unescaped newlines inside JSON strings, causing `json.loads()` to fail.

**Solution:** A multi-stage fallback parser was built: strip fences, fix escape sequences, then fall back to brace-matching extraction. This resolved approximately 95% of failures without requiring prompt changes.

### 5.16.2 Cascade Delete Integrity

**Problem:** Deleting a lesson left orphaned quiz records, causing foreign key violations when those quizzes' attempts were later queried.

**Solution:** Migration 0004 added `ON DELETE CASCADE` to the lesson → quiz → attempt → response chain, ensuring atomic deletion of the full object tree.

### 5.16.3 Answer Format Flexibility

**Problem:** The quiz submission endpoint needed to accept answers as plain strings (simple MCQ) and as structured objects (metacognitive quizzes with confidence and reasoning), but FastAPI's type validation rejected mixed-type dictionaries.

**Solution:** The `_extract_answer_detail()` helper normalises all three input types (plain string, raw dict, Pydantic model) to a consistent tuple before scoring.

### 5.16.4 Bcrypt Import Failures

**Problem:** On some environments, the `bcrypt` library was unavailable at import time, causing auth to fail entirely.

**Solution:** Wrapped the import in a `try/except` block with a PBKDF2-SHA256 fallback, supporting transparent rehashing when bcrypt becomes available.

### 5.16.5 Next.js 16 Async Params

**Problem:** Next.js 16 changed dynamic route parameters to be asynchronous, breaking direct access to `params.id` in page components.

**Solution:** Updated all dynamic route pages to use React's `use()` hook: `const { id } = use(params)`.

### 5.16.6 SVG Arrow Layout in Knowledge Graph

**Problem:** The knowledge graph renders concept nodes in DOM, but their screen coordinates are only available after the browser paint. Attempting to draw prerequisite arrows during the initial render produced overlapping or misaligned lines.

**Solution:** Implemented a `ResizeObserver` combined with `useLayoutEffect` to read node bounding rectangles after paint and store them in state. The SVG overlay re-renders whenever the container size changes (e.g. when the sidebar opens or the window is resized), keeping the arrows always accurately positioned.

### 5.16.7 AI Concept Tag Resolution

**Problem:** AI concept graph extraction returns concept names as strings, but the database stores them by integer ID. Minor differences in casing ("Newton's Law" vs "newton's law") or abbreviations caused tag resolution mismatches, leaving questions unlinked to any concept.

**Solution:** Name lookup is performed case-insensitively using a lowercase dictionary. Concept names present in the AI response but absent from the database are automatically created, ensuring no question ever loses its concept link due to a name variation.

### 5.16.8 Mastery Cold-Start Problem

**Problem:** The EMA formula `new_mastery = 0.3 * result + 0.7 * previous_mastery` with `previous_mastery = 0.0` means a student who scores 1.0 on their first attempt only reaches 0.3 mastery — underrepresenting strong early performance.

**Solution:** On the first attempt (`row.attempts == 1`), the mastery is seeded directly from the result rather than computing the EMA. From the second attempt onward, the EMA is applied normally. This avoids penalising students for having no prior history.

### 5.16.9 Peer Teaching Session State

**Problem:** Multi-turn AI conversations require full conversation history for coherent responses. An early implementation re-fetched the lesson body from the database on every turn and rebuilt the context string, causing latency and repeated database queries.

**Solution:** The full conversation JSONB is stored in `TeachingSession` and each new turn is appended before the AI call. The lesson body is fetched once at session creation and stored as a truncated excerpt in the session record, removing the per-turn database hit.

### 5.16.10 Long Lesson Body Hitting Context Window

**Problem:** Sending the full lesson body as AI context for concept extraction occasionally exceeded Gemini's context limit, causing generation failures.

**Solution:** The lesson body is truncated to 6,000 characters before the AI call. The truncation preserves the beginning of the body (which typically contains the outline and introduction) where the most concepts are densely mentioned.

### 5.16.11 ZPD Measurement Design

**Problem:** Vygotsky's Zone of Proximal Development is a qualitative theoretical concept; a quantitative implementation required a concrete design decision.

**Solution:** Unaided mastery (success rate without hints) and aided mastery (success rate with hints) were separated into distinct database columns. The ZPD delta — `aided_mastery − unaided_mastery` — operationalises the zone: a large positive delta means the student can succeed with support but not yet independently, making the concept a natural next target for deliberate practice.

### 5.16.12 Cascade Delete on Concepts

**Problem:** When a lesson is deleted, concepts that reference it via `lesson_id` would either be deleted (losing the student's mastery history) or violate the foreign key constraint.

**Solution:** The `concepts.lesson_id` foreign key uses `ON DELETE SET NULL` rather than CASCADE. Concepts persist after their source lesson is deleted; only the `lesson_id` field is cleared. This preserves the full mastery history while keeping the database consistent.

---

## 5.17 Code Quality & Maintainability

### 5.17.1 Project Structure

The backend follows a consistent layered pattern: each feature has a model, schema, repository, service, and router file. This makes any piece of logic locatable by role — quiz scoring is always in `quiz_attempt_service.py`, never in a router or repository.

### 5.17.2 Naming Conventions

Python files use `snake_case` throughout. SQLAlchemy models use `PascalCase` class names with `snake_case` table names (e.g., `class QuizAttempt` → `quiz_attempts`). Frontend components use `PascalCase`. API endpoints follow REST conventions with plural nouns.

### 5.17.3 Type Safety

Pydantic schemas validate all request and response bodies at the API boundary. Python type hints are used throughout the service and repository layers. The frontend uses consistent patterns for fetch/loading/error states through a shared `useFetch` hook.

### 5.17.4 Error Handling

All service methods raise `HTTPException` with appropriate status codes (403 for authorisation failures, 404 for missing resources). The frontend catches these and displays user-friendly error messages with loading skeletons during API calls.

---

## 5.18 Conclusion of Implementation

EduNexus has been built as a complete, working platform from the ground up. Every major feature described in the requirements has been implemented across both the backend and frontend. This section summarises what was delivered.

### 5.18.1 User Accounts and Access Control

Students and teachers register and log in through a secure authentication system. Passwords are stored as hashed values using bcrypt and users receive a JWT token on login. All protected pages check this token on every request, and each role — teacher and student — is restricted to its own set of routes and actions.

### 5.18.2 Lesson Creation and AI Generation

Teachers can create lessons either by writing content manually or by asking the AI to generate it. The AI accepts a prompt, a choice of four content formats (slides, PDF report, presentation, or flashcards), and an optional reference document upload. Each classroom also has a curriculum profile that is automatically included in the AI prompt as context, so generated lessons stay relevant to what is being taught.

### 5.18.3 Quizzes and Hint Scaffolding

Three quiz types are available. Standard MCQ questions include progressive three-level hints and a confidence rating per answer. Kahoot-style quizzes add a countdown timer and coloured answer buttons with instant feedback. Metacognitive quizzes ask students to explain their reasoning in writing alongside each answer. All quiz types compute a calibration score that compares a student's stated confidence to their actual accuracy.

### 5.18.4 Knowledge Graph and Student Mastery

When a lesson is created, the AI extracts the concepts it covers and builds a knowledge graph showing which concepts depend on others. As students attempt quizzes, their mastery of each concept is updated using an exponential moving average. The system separately tracks unaided mastery (answering correctly without hints) and aided mastery (answering correctly with hints), which are used together to identify each student's zone of proximal development.

### 5.18.5 Open Learner Model

Students can view their own learning state through a personal dashboard that shows the interactive concept map with mastery colour-coding, an evidence trail for each concept listing every quiz attempt that affected it, a calibration scatter plot comparing confidence to actual mastery across concepts, and a before-and-after mastery comparison that appears after each quiz is completed.

### 5.18.6 Practice Targeting

The system recommends which concepts a student should practise next by scoring every concept in the classroom using a weighted formula: how much that concept blocks other concepts (40%), how far below full mastery the student is (30%), how ready the student is to improve based on their ZPD gap (20%), and a small penalty if they have already practised it recently (10%). The reasoning behind each recommendation is shown to the student.

### 5.18.7 Formative Assessment

Students can take short, concept-targeted check-in questions outside of full quizzes. These are generated by the AI for the specific concepts a student is weakest on, giving a lightweight way to test understanding without the overhead of a full assessed quiz.

### 5.18.8 Peer Teaching Simulator

Students can practise explaining a topic to an AI character called Alex, who plays the role of a confused learner and asks follow-up questions. Sessions run for up to 20 turns and are stored in full. When the student ends the session, the AI grades their explanation across four rubrics and awards XP and badges for good performance.

### 5.18.9 Teacher Management Tools

Teachers can edit quiz questions directly within the platform, write lessons without using AI, and manually manage the concepts and prerequisite links in a classroom's knowledge graph. Each classroom has its own leaderboard showing students ranked by XP.

### 5.18.10 Gamification

Students earn XP for completing quizzes and teaching sessions. Badges are awarded for milestones such as high scores, streaks, and strong teaching assessments. A daily streak counter tracks consecutive days of activity and per-classroom leaderboards let students compare their progress with classmates.

### 5.18.11 Theming and Responsive Layout

The platform supports both a dark and a light theme, which is saved to the user's browser and applied across all pages using CSS custom properties. The layout is responsive and works on both desktop and mobile screens.

### 5.18.12 Database Migrations

The full schema history is captured in twelve Alembic migrations, tracing every change from the initial tables through to the curriculum profile extension added in the final sprint.

### 5.18.13 Test Coverage

The backend is covered by a pytest test suite that tests user registration, login, JWT validation, and classroom access control — including checks that students cannot create classrooms and that teachers only see their own classrooms. The frontend is covered by a Playwright end-to-end suite with four test files: authentication flows, protected route redirects, the student journey (dashboard, joining classrooms, quizzes), and the teacher journey (creating classrooms, lessons, and quizzes).

---

The next chapter evaluates the system through a structured testing programme covering unit tests, integration tests, and scenario-based walkthroughs against the original requirements.
