from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, classrooms, lessons, quizzes, gamification


app = FastAPI(title="EduNexus API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
app.include_router(gamification.router)
