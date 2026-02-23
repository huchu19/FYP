from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.services.quiz_service import QuizService
from app.schemas.quiz import Quiz, QuizCreate

router = APIRouter(prefix="/quizzes", tags=["quizzes"])
service = QuizService()


@router.get("/", response_model=list[Quiz])
def list_quizzes(db: Session = Depends(get_db)) -> list[Quiz]:
    return service.list_quizzes(db)


@router.post("/", response_model=Quiz, status_code=201)
def create_quiz(payload: QuizCreate, db: Session = Depends(get_db)) -> Quiz:
    return service.create_quiz(db, payload)


@router.get("/{quiz_id}", response_model=Quiz)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)) -> Quiz:
    return service.get_quiz(db, quiz_id)
