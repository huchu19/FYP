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

3. **Content & Lesson Service**
   - Accepts teacher prompts.
   - Calls AI Service to generate structured lesson content and quiz questions.
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

## Frontend–Backend Interaction

- The Next.js frontend communicates with FastAPI via REST endpoints (JSON).
- Authentication tokens are stored securely (e.g. HTTP-only cookies or local storage).
- Frontend pages for teachers/students fetch data via API calls and render UI components.

## Data Flow Example: AI Lesson Creation

1. Teacher enters a prompt in the frontend (e.g. “Introduce basic differentiation for A-level students”).
2. Frontend sends POST `/api/lessons/generate` with prompt and classroom ID.
3. FastAPI:
   - Validates teacher and classroom.
   - Calls AI Service to generate:
     - Lesson outline
     - Explanatory text
     - Example questions
   - Stores lesson in PostgreSQL.
4. Backend returns the lesson to the frontend.
5. Teacher reviews, edits, and saves/publishes the lesson.

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
