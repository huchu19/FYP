# Requirements – EduNexus

## 1. Functional Requirements

### 1.1 User Management

- FR1: The system shall support teacher and student accounts.
- FR2: The system shall allow teachers to create and manage classrooms.
- FR3: The system shall allow students to join classrooms using a classroom code.
- FR4: The system shall support basic authentication (login/logout).

### 1.2 AI Lesson and Quiz Generation

- FR5: The system shall allow teachers to input a natural language prompt describing
  a topic or lesson.
- FR6: The system shall generate structured lesson content (sections, key points, examples)
  from the teacher's prompt using a GPT-based model.
- FR7: The system shall generate quiz questions (MCQ / short answer) based on the generated
  lesson or topic description.
- FR8: Teachers shall be able to review and edit the AI-generated content before publishing.

### 1.3 Adaptive Quizzes

- FR9: The system shall record each student's quiz attempts and responses.
- FR10: The system shall adjust question difficulty based on recent performance
  (simple adaptive algorithm, e.g. easier questions after multiple incorrect answers).
- FR11: The system shall provide students with immediate feedback after a quiz.

### 1.4 Gamification

- FR12: The system shall award XP points for completed activities (e.g. quizzes, lessons).
- FR13: The system shall track badges for milestones (e.g. streaks, high scores).
- FR14: The system shall show a leaderboard within each classroom based on XP.

### 1.5 Analytics and Dashboards

- FR15: Teachers shall see a dashboard summarising class performance and activity.
- FR16: Students shall see a dashboard showing their own progress, XP, and badges.
- FR17: The system shall store basic interaction data for later analysis (e.g. quiz scores,
  time taken).

### 1.6 Accessibility and Internationalisation

- FR18: The UI shall be responsive and usable on desktop and mobile.
- FR19: The system shall support at least two languages (e.g. English + another language).
- FR20: The system shall provide text-to-speech or a placeholder integration for
  reading lesson content aloud.

## 2. Non-Functional Requirements

- NFR1: The system should provide a response to user actions within 2–3 seconds for
  typical operations.
- NFR2: The system should be secure by design, protecting user data and API keys.
- NFR3: The system should be modular and maintainable, with a clear separation between
  frontend, backend, and AI integration layers.
- NFR4: The system should be deployable using commonly available PaaS providers
  (e.g. Vercel for frontend, Render for backend).
- NFR5: The system should log errors and important events for debugging and evaluation.

## 3. Assumptions and Constraints

- A1: Class sizes and user counts are small (pilot / prototype scale).
- A2: The system relies on external AI APIs (e.g. OpenAI); network availability is required.
- C1: Due to time constraints, full LMS/SCORM integration may be partially implemented
  or limited to a proof-of-concept.
