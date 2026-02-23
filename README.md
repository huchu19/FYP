# FYP
Hussain Naqvi's FYP. Current name is EduNexus (WIP). 

# EduNexus – AI-Powered Adaptive Learning and Classroom Platform

EduNexus is my final-year project at Queen Mary University of London (School of EECS).  
It is an AI-powered web platform that integrates:

- Intelligent content and lesson generation
- Adaptive quizzes and assessments
- Classroom management similar to Google Classroom
- Gamification (XP, badges, leaderboards)
- Learning analytics and accessibility features

The goal is to reduce teacher workload and increase student engagement by providing a
unified, AI-enhanced digital classroom.

## High-Level Architecture

- Backend: FastAPI (Python)
- Frontend: Next.js (React)
- Database: PostgreSQL
- AI: GPT-based language models (via OpenAI API, possibly LangChain)
- Hosting: Vercel (frontend), Render or similar (backend)

## Monorepo Structure

- `/backend` – FastAPI application (APIs, business logic, AI integration)
- `/frontend` – Next.js application (teacher & student UI)
- `/docs` – Project documentation (requirements, architecture, research plan, etc.)

## Core Features (MVP)

- Teacher accounts, student accounts, classroom codes
- AI-generated lessons and quizzes from natural language prompts
- Basic adaptive quizzes that adjust difficulty based on performance
- Simple dashboards for teachers and students
- Initial gamification (XP and badges)

Additional features (later milestones):

- More sophisticated adaptive learning
- Leaderboards, richer analytics
- Accessibility improvements and LMS integration (SCORM compatibility)

## Getting Started (Dev)

1. Clone the repo and open it in VS Code.
2. Set up local Postgres.
3. Follow `/backend/README.md` for backend setup.
4. Follow `/frontend/README.md` for frontend setup.
5. Use the docs in `/docs` to understand the architecture and requirements.
