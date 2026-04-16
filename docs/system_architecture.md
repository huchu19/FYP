# System Architecture – EduNexus

## Overview

EduNexus is a web-based platform with a clear separation between:

- **Frontend (Next.js)** – user interface for teachers and students.
- **Backend (FastAPI)** – REST API, business logic, AI orchestration.
- **Database (PostgreSQL)** – persistent storage for users, classrooms, lessons, quizzes,
  attempts, and gamification data.
- **AI Services** – GPT-based models accessed via an external API (OpenAI).

## High-Level Components

1. **Authentication Service**
   - Manages user registration, login, and roles (TEACHER, STUDENT).
   - Issues and validates tokens/sessions for requests to the backend.

2. **Classroom Service**
   - CRUD operations for classrooms.
   - Handles classroom codes and enrollment of students.
   - Stores classroom-level metadata such as syllabus or curriculum guidance for downstream AI generation.

3. **Content & Lesson Service**
   - Accepts teacher prompts and, when available, classroom syllabus context.
   - Calls AI Service to generate structured lesson content and quiz questions.
   - Supports iterative revision loops over existing AI-generated lesson drafts (add/remove/rewrite/refine).
   - Stores lessons in the database.

4. **Adaptive Quiz Service**
   - Manages quiz attempts and question selection.
   - Implements adaptive logic based on historical performance.
   - Calculates scores and feedback.

5. **Gamification Service**
   - Tracks XP points and badges for each student.
   - Computes leaderboards per classroom.

6. **Analytics Service**
   - Aggregates performance and engagement data.
   - Exposes metrics to dashboards for teachers and students.

7. **Knowledge Graph Service**
   - Manages concepts and prerequisite relationships per classroom.
   - Uses AI Service to extract concept graphs from lesson content.
   - Computes per-student concept mastery from quiz response data.
   - Exposes graph data (nodes + edges + mastery scores) for visualization.
   - Identifies blind spots: low-mastery concepts that are prerequisites for upcoming content.

8. **Formative Assessment Service**
   - Generates lightweight diagnostic assessments (prerequisite checks, pulse checks, concept inventories).
   - Implements adaptive item selection: adjusts question difficulty within a session based on responses.
   - Feeds results back into concept mastery tracking without affecting grades or XP.

9. **Peer Teaching Service**
   - Manages teach-back sessions where a student explains a concept to an AI interlocutor.
   - AI plays a "confused learner" role, asking clarifying questions and probing gaps.
   - Assesses teaching quality (completeness, accuracy, clarity, depth) at session end.
   - Integrates with Gamification Service for teaching-related XP and badges.

## Frontend–Backend Interaction

- The Next.js frontend communicates with FastAPI via REST endpoints (JSON).
- Authentication tokens are stored securely (e.g. HTTP-only cookies or local storage).
- Frontend pages for teachers/students fetch data via API calls and render UI components.

## Data Flow Example: AI Lesson Creation

1. Teacher enters a prompt in the frontend (e.g. “Introduce basic differentiation for A-level students”).
2. The classroom may already contain a stored syllabus or curriculum brief that should constrain lesson generation.
3. Frontend sends POST `/api/lessons/generate` with prompt and classroom ID.
4. FastAPI:
   - Validates teacher and classroom.
   - Loads stored classroom syllabus context when present.
   - Calls AI Service to generate:
     - Lesson outline
     - Explanatory text
     - Example questions
   - Stores lesson in PostgreSQL.
5. Backend returns the lesson to the frontend.
6. Teacher reviews the draft and can iteratively request targeted changes such as adding a section,
   removing a section, simplifying explanations, or aligning more tightly to the classroom syllabus.
7. The final version is saved or published by the teacher.

## Data Flow Example: Adaptive Quiz

1. Student opens a quiz in a classroom.
2. Frontend requests next question from `/api/quizzes/{quiz_id}/next`.
3. Backend:
   - Looks at student’s past attempts and performance.
   - Chooses a question with suitable difficulty.
   - Returns question to frontend.
4. Student answers; frontend POSTs the answer to `/api/quizzes/{quiz_id}/answer`.
5. Backend:
   - Checks correctness, updates attempt history.
   - Adjusts internal difficulty estimate.
   - Awards XP and possibly badges.
   - Returns result and next question or completion summary.

## Data Flow Example: Peer Teaching Session

1. Student selects a concept to teach from a recent lesson.
2. Frontend sends POST `/api/teaching/sessions` with concept ID.
3. Backend:
   - Creates a TeachingSession record.
   - Calls AI Service with a "confused learner" system prompt and the concept context.
   - Returns the AI's opening question (e.g. "I don't really get [concept], can you explain it?").
4. Student types an explanation; frontend POSTs to `/api/teaching/sessions/{id}/message`.
5. Backend:
   - Appends the student message to the conversation history.
   - Calls AI Service to generate the next confused-learner response.
   - Returns the AI response (clarifying question, expression of confusion, or follow-up).
6. Steps 4–5 repeat until the student ends the session.
7. Frontend sends POST `/api/teaching/sessions/{id}/complete`.
8. Backend:
   - Calls AI Service to assess the full conversation for completeness, accuracy, clarity, and depth.
   - Awards XP and badges based on assessment scores.
   - Returns the assessment results and feedback to the frontend.
