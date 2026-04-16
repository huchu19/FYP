# EduNexus – Context Brief for Group Coursework

Use this document as context when working on the Group 8 coursework poster and report. It summarises the product, its features, architecture, and current status.

---

## Group Coursework Context

**Group 8 – AI-Driven Adaptive Learning & Assessment Platform**

An AI-powered LMS that uses NLP to transform lecture content into interactive learning materials, diagnostic quizzes, and adaptive study pathways. Students engage with personalised tasks that evolve according to their knowledge and learning mastery levels. Inspired by AI-based continuous assessment systems, it evaluates step-level understanding and metacognitive development in real time, providing transparent progress insights for students and lecturers.

The coursework is part of a Product Development module. The team identifies a market gap in Teaching and Learning software, identifies customer needs, generates a product concept, and tests it.

---

## What is EduNexus?

EduNexus is a final-year project at Queen Mary University of London (School of EECS). It is an AI-powered web platform that unifies:

- **Intelligent content and lesson generation** — teachers type a natural language prompt and the system generates structured lesson drafts (sections, key points, examples) using AI (Google Gemini 2.5 Flash), with planned iterative refinement controls and classroom syllabus alignment.
- **Adaptive quizzes and assessments** — AI-generated MCQ quizzes from lesson content, with adaptive difficulty adjustment based on student performance history.
- **Classroom management** — Google Classroom-style structure with classroom codes, enrollment, and role-based access (teacher/student).
- **Gamification** — XP points, badges (first_quiz, perfect_score), and leaderboards to drive engagement.
- **Learning analytics** — dashboards for teachers (class performance) and students (personal progress, XP, badges).
- **Accessibility** — responsive UI, planned multilingual and text-to-speech support.

---

## Problem Statement

Digital education tools are fragmented. Teachers juggle multiple platforms (Google Classroom, Quizizz, ChatGPT) for lesson planning, student management, and assessment, with little integration or personalisation. Students experience one-size-fits-all content, limited interactive feedback, and low engagement.

EduNexus addresses this by providing a single platform that combines AI content generation, adaptive assessment, and classroom management.

---

## Research Questions

1. How can AI-driven adaptive systems enhance student engagement and learning outcomes?
2. What are the limitations of current digital classroom tools in delivering personalised education?
3. How can gamification improve motivation and retention in online learning?
4. What design principles support accessibility and inclusivity in AI-based education platforms?

---

## Core Features (Implemented)

| Feature | Description |
|---|---|
| **AI Lesson Generation** | Teacher enters a prompt (e.g. "Introduce basic differentiation for A-level students") → AI generates structured lesson with sections, explanations, examples |
| **AI Quiz Generation** | Auto-generates MCQ quizzes from lesson content |
| **Slide-style Lesson Viewer** | Students view lessons in a slide format with Markdown rendering |
| **Interactive Quiz UI** | Students take quizzes with immediate scoring and feedback |
| **Classroom Management** | Teachers create classrooms, students join with codes |
| **JWT Authentication** | Secure login/register with role-based access (teacher/student) |
| **Gamification** | XP awards (10 XP per correct answer, 20 XP perfect bonus), badges, leaderboards |
| **Dashboards** | Teacher and student dashboard pages with chart components |

### Planned Features (Not Yet Implemented)

- Iterative teacher refinement of AI-generated lessons (add/remove/rewrite sections through follow-up prompts)
- Classroom syllabus or curriculum profile input so future lesson generation stays aligned to that class
- Adaptive quiz difficulty adjustment (scaffolded, not active)
- Confidence ratings per question with calibration feedback
- Post-quiz reflection prompts (metacognition)
- Metacognitive question types (explain-reasoning, error analysis, transfer)
- Student problem-solving process tracking
- Full analytics with real data
- Multilingual support and text-to-speech
- Flashcard generation, Kahoot-style quiz mode

---

## System Architecture

- **Frontend:** Next.js (React) with Tailwind CSS — teacher and student UIs
- **Backend:** FastAPI (Python) — REST API, business logic, AI orchestration
- **Database:** PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **AI Service:** Google Gemini 2.5 Flash (via API) for content generation

### Key Data Flow — AI Lesson Creation

1. Teacher enters prompt in frontend
2. Frontend sends POST to `/api/lessons/generate` with prompt + classroom ID
3. Backend validates teacher, loads any classroom syllabus context, and calls AI service to generate lesson outline + text + examples
4. Stores lesson in PostgreSQL, returns to frontend
5. Teacher reviews, iteratively refines if needed, and publishes

### Key Data Flow — Adaptive Quiz

1. Student opens quiz → frontend requests questions
2. Backend checks past attempts, selects appropriate difficulty
3. Student answers → backend scores, updates history, awards XP/badges
4. Returns result and completion summary

### Database Tables

users, classrooms, classroom_enrollments, lessons, quizzes, quiz_questions, quiz_attempts, quiz_responses, gamification, analytics_events

---

## Functional Requirements Summary

- **User Management:** Teacher/student accounts, classroom creation, join via code, JWT auth
- **AI Generation:** Natural language prompt → structured lessons and MCQ quizzes, teacher review before publishing, planned iterative refinement, planned classroom syllabus context
- **Adaptive Quizzes:** Record attempts/responses, adjust difficulty, immediate feedback
- **Gamification:** XP for activities, badges for milestones, classroom leaderboards
- **Analytics:** Teacher dashboard (class performance), student dashboard (progress, XP, badges)
- **Accessibility:** Responsive design, planned multilingual + text-to-speech

---

## Current Status (as of 16 March 2026)

- **Complete:** Literature review, requirements, architecture, database schema, backend skeleton, auth, classroom CRUD, lesson/quiz CRUD, AI lesson + quiz generation, frontend auth flows, teacher/student dashboards, basic gamification
- **In Progress:** Content format selection, flashcard generation, interactive quiz modes
- **Not Started:** Full adaptive logic, analytics wiring, accessibility features, syllabus-aware generation, iterative teacher refinement loop, user testing, LMS integration

---

## Suggested Prompts for Claude Browser

### For the Poster

> I'm creating a poster for my group coursework. The product is EduNexus (see context above). The poster follows a QMUL template with 6 headings across 3 columns. Draft concise poster text (40pt font, so keep it brief) for these 6 sections:
>
> 1. Introduction & Problem Statement
> 2. Customer Needs & Market Gap
> 3. Concept Generation
> 4. System Design & Architecture
> 5. Key Features & Implementation
> 6. Evaluation & Future Work
>
> Also suggest 4 figure captions for: (1) system architecture diagram, (2) teacher AI lesson generation screenshot, (3) student quiz interface screenshot, (4) gamification/analytics dashboard screenshot.

### For Task 2 — Identification of Customer Needs (Ulrich & Eppinger)

> I need to complete Task 2 of my group coursework: "Identification of Customer Needs" using Ulrich & Eppinger's five-step process, applied to EduNexus (see context above). I need to simulate realistic data. Please:
>
> 1. Design a questionnaire (10-12 questions) targeting teachers and students about their pain points with current digital learning tools
> 2. Generate simulated responses from 15 respondents (8 students, 5 teachers, 2 lecturers) with realistic variation
> 3. Walk through all 5 Ulrich & Eppinger steps:
>    - Step 1: Gather raw data (present the simulated responses)
>    - Step 2: Interpret raw data in terms of customer needs (convert to need statements)
>    - Step 3: Organise needs into a hierarchy
>    - Step 4: Establish relative importance (rank needs)
>    - Step 5: Reflect on results and the process
> 4. Format appendix materials: question list, response summary table, needs hierarchy diagram
