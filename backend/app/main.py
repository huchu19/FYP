from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, classrooms, lessons, quizzes, quiz_attempts, gamification, analytics, knowledge_graph, formative_assessments, teaching_sessions


app = FastAPI(title="EduNexus API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "ok"}


# Mount feature routers
app.include_router(auth.router)
app.include_router(classrooms.router)
app.include_router(lessons.router)
app.include_router(quizzes.router)
app.include_router(quiz_attempts.router)
app.include_router(quiz_attempts.attempt_router)
app.include_router(gamification.router)
app.include_router(analytics.router)
app.include_router(knowledge_graph.router)
app.include_router(formative_assessments.router)
app.include_router(teaching_sessions.router)
