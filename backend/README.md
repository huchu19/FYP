# EduNexus Backend – FastAPI Service

This is the **backend API** for EduNexus.  
It provides:

- Authentication and user management (teachers, students)
- Classroom, lesson, quiz, and gamification APIs
- Integration with GPT-based models for lesson and quiz generation
- Storage and retrieval of analytics data

Tech stack:

- **FastAPI** (Python)
- **PostgreSQL** (via SQLAlchemy)
- **Alembic** for migrations
- **OpenAI API** (or compatible) for AI features

---

## 1. Setup

### 1.1. Prerequisites

- Python 3.10+ (or your chosen version)
- PostgreSQL (local or via Docker)
- `poetry` or `pip` (choose one approach)
- An OpenAI API key (or other provider key)

### 1.2. Clone and navigate

From the repo root:

```bash
cd backend
