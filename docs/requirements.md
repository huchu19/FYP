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
- FR8: Teachers shall be able to review and iteratively edit AI-generated content before publishing,
  including adding, removing, and rewriting sections.
- FR8a: The system shall allow teachers to submit follow-up refinement prompts against an existing
  AI-generated lesson draft rather than regenerating from scratch each time.
- FR8b: The system shall allow teachers to store a classroom syllabus or curriculum brief that is
  reused as persistent context for future lesson generation within that classroom.

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

### 1.7 Metacognition and Deep Learning

#### Knowledge Graph Visualizer

- FR21: The system shall maintain a concept graph per classroom, with concepts and
  prerequisite relationships.
- FR22: The system shall use AI to extract concepts and prerequisites from lesson content.
- FR23: The system shall visualise each student's concept mastery as an interactive graph,
  highlighting blind spots (low-mastery prerequisites).

#### Formative Assessment

- FR24: The system shall generate prerequisite diagnostic checks before a lesson, testing
  knowledge of prerequisite concepts.
- FR25: The system shall support mid-lesson pulse checks (1–3 inline questions with
  immediate feedback, no grading).
- FR26: The system shall support adaptive concept inventories that adjust question
  difficulty based on in-session responses.

#### Peer Teaching Simulator

- FR27: The system shall allow students to start teach-back sessions where they explain
  a concept to an AI acting as a confused learner.
- FR28: The AI shall ask genuine clarifying questions and express confusion when
  explanations have gaps, without revealing answers.
- FR29: The system shall assess teaching quality across completeness, accuracy, clarity,
  and depth, and provide specific feedback to the student.

### 1.8 Teacher Content Agency

- FR30: Teachers shall be able to manually create, edit, and delete concepts on the
  classroom knowledge graph without relying on AI extraction.
- FR31: Teachers shall be able to manually add and remove prerequisite relationships
  between concepts.
- FR32: Teachers shall be able to create lessons by writing content directly (title,
  body, format) without using AI generation.
- FR33: Teachers shall be able to upload reference documents whose extracted text is
  fed into AI lesson generation as context.
- FR34: Teachers shall be able to edit AI-generated quiz questions after creation,
  including modifying question text, options, correct answer, explanation, and hints.
- FR35: Teachers shall be able to add, delete, and reorder questions within an existing quiz.
- FR36: Teachers shall be able to create quizzes from scratch without AI generation.

### 1.9 Concept-Driven Adaptive Learning

- FR37: The system shall select practice concepts using a weighted algorithm considering
  prerequisite criticality, mastery deficit, ZPD readiness, and recency.
- FR38: The system shall generate targeted practice quizzes from the student's weakest
  concepts, with transparent reasoning shown to the student (open learner model).
- FR39: The system shall close the adaptive loop: quiz results update concept mastery,
  and the student can return to the knowledge map to see updated progress.

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
