from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.db import SessionLocal
from app.routers import auth, classrooms, lessons, quizzes, quiz_attempts, gamification, analytics, knowledge_graph, formative_assessments, teaching_sessions


settings.validate_for_production()

# Interactive API docs are useful locally but needlessly expose the full
# surface area of a public deployment.
_docs_url = None if settings.is_production else "/docs"

app = FastAPI(
    title="EduNexus API",
    version="0.1.0",
    docs_url=_docs_url,
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    """Services raise ValueError for client-fixable problems (bad/missing input).

    Translate these to 400 responses instead of leaking a 500.
    """
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.get("/")
def read_root():
    return {"status": "ok"}


@app.get("/health")
def health_check():
    """Liveness + database readiness.

    Used by the platform health check and by the uptime pinger that keeps
    the free-tier instance from sleeping.
    """
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
    except Exception:  # noqa: BLE001 - report unhealthy, never leak internals
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "unreachable"},
        )

    return {"status": "ok", "database": "ok"}


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
