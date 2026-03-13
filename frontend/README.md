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

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.js           # Root layout (wraps AuthProvider + Navbar)
│   ├── page.js             # Home / landing page
│   ├── globals.css         # Global styles (Tailwind + CSS variables)
│   ├── (auth)/             # Auth route group
│   │   ├── login/page.js
│   │   └── register/page.js
│   └── (dashboard)/        # Protected dashboard route group
│       ├── teacher/        # Teacher pages
│       │   ├── page.js     # Teacher dashboard
│       │   ├── classrooms/new/page.js
│       │   └── classrooms/[id]/lessons/new/page.js
│       └── student/        # Student pages
│           ├── page.js     # Student dashboard
│           └── classrooms/[id]/page.js
├── components/
│   ├── auth/               # AuthProvider (React Context)
│   ├── layout/             # Navbar
│   ├── ui/                 # Reusable UI components
│   └── charts/             # Analytics chart components
├── lib/                    # Utility functions
└── public/                 # Static assets
```

## Auth

Authentication is managed via `components/auth/AuthProvider.js`, which wraps the app in a React Context providing the current user and JWT token. Protected routes redirect to `/login` when unauthenticated.

## Styling

Tailwind CSS 4 with CSS custom properties (e.g. `--color-surface`, `--color-text`). Responsive by default.
