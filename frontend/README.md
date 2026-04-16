# EduNexus Frontend – Next.js Application

Teacher and student UI for the EduNexus platform.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- PostCSS

## Setup

```bash
cd frontend
npm install
npm run dev
```

Dev server runs at [http://localhost:3000](http://localhost:3000).

The frontend expects the FastAPI backend at `http://localhost:8000`. See `backend/README.md` for backend setup.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run Playwright E2E tests (headless) |
| `npm run test:e2e:ui` | Run tests with Playwright interactive UI |
| `npm run test:e2e:headed` | Run tests in a visible browser |
| `npm run test:e2e:report` | Open the HTML test report |

## Project Structure

```
frontend/
├── app/                              # Next.js App Router
│   ├── layout.js                     # Root layout (AuthProvider + ThemeProvider + Navbar)
│   ├── page.js                       # Landing page
│   ├── globals.css                   # Tailwind + CSS custom properties (dark/light)
│   ├── (auth)/
│   │   ├── login/page.js
│   │   └── register/page.js
│   └── (dashboard)/
│       ├── teacher/
│       │   ├── page.js                       # Teacher dashboard
│       │   ├── classrooms/new/page.js        # Create classroom
│       │   └── classrooms/[id]/
│       │       ├── page.js                   # Classroom detail (lessons, students)
│       │       ├── lessons/new/page.js       # AI lesson generator
│       │       ├── lessons/[lessonId]/page.js # Lesson view/edit + quiz generation
│       │       ├── students/[studentId]/page.js # Per-student analytics
│       │       ├── knowledge-graph/page.js   # Concept graph generation + view
│       │       └── quizzes/[quizId]/page.js  # Quiz detail
│       └── student/
│           ├── page.js                       # Student dashboard (XP, streak, badges)
│           ├── progress/page.js              # Open Learner Model / analytics
│           └── classrooms/[id]/
│               ├── page.js                   # Classroom overview
│               ├── lessons/[lessonId]/page.js  # Lesson viewer (slides, TTS)
│               ├── quizzes/[quizId]/page.js    # Quiz taking (MCQ, metacognitive, Kahoot)
│               └── knowledge-graph/page.js     # Concept graph + blind spots
├── components/
│   ├── auth/              # AuthProvider (JWT context)
│   ├── layout/            # Navbar (role-based nav, locale selector, theme toggle)
│   ├── theme/             # ThemeProvider (dark/light, localStorage persistence)
│   ├── lesson/            # LessonBodyRenderer, SlideViewer, FlashcardViewer
│   ├── quiz/              # KahootQuiz (game-mode component)
│   ├── knowledge-graph/   # ConceptGraph (canvas force-directed visualization)
│   ├── ui/                # Button, BasicChart
│   └── charts/            # Analytics chart components
├── lib/
│   ├── api.js             # HTTP client (apiGet/Post/Put/Patch/Delete, JWT auth)
│   ├── i18n.js            # Translations (EN + FR keys)
│   ├── tts.js             # Browser SpeechSynthesis wrapper (speak, stop, isSpeaking)
│   └── constants.js       # APP_NAME, API base URL
├── e2e/                   # Playwright E2E tests
└── public/                # Static assets
```

## Auth

Authentication is managed via `components/auth/AuthProvider.js`, which wraps the app in a React Context providing the current user and JWT token. Protected routes redirect to `/login` when unauthenticated.

## Styling

Dark/light themed UI built with Tailwind CSS 4 and CSS custom properties. Dark mode uses a deep navy background with cyan/violet gradient accents and glassmorphic cards. Theme toggle and preference persistence via `ThemeProvider`. Responsive by default with `prefers-reduced-motion` support.

## E2E Testing (Playwright)

End-to-end tests live in `e2e/` and use [Playwright](https://playwright.dev/).

### Prerequisites

1. Backend running on `http://localhost:8000` with a working database
2. Frontend dev server on `http://localhost:3000` (auto-started by Playwright if not running)

### Running tests

```bash
npm run test:e2e           # headless (Chromium)
npm run test:e2e:headed    # visible browser
npm run test:e2e:ui        # Playwright interactive UI
npm run test:e2e:report    # open HTML report
```

### Test structure

```
e2e/
├── .auth/                  # Saved auth state (gitignored)
│   ├── teacher.json
│   └── student.json
├── auth.setup.js           # Registers + logs in teacher & student (runs first)
├── auth.spec.js            # Registration, login, logout flows
├── teacher-flow.spec.js    # Classroom creation, lesson page, dashboard
├── student-flow.spec.js    # Join classroom, XP/badges, classroom view
└── navigation.spec.js      # Navbar links, route guards, role-based access
```

The `auth.setup.js` fixture runs before all test suites. It registers a teacher and student via the API, logs each in through the UI, and saves browser state (including the JWT in localStorage) to `e2e/.auth/`. All other tests reuse these saved states so they start already authenticated.
