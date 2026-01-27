from typing import List

from fastapi import APIRouter, HTTPException

from app.schemas.quiz import Quiz, QuizCreate

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

_quizzes: List[Quiz] = []
_quizzes.append(
    Quiz(
        id=1,
        classroom_id=1,
        title="Kinematics basics",
        difficulty="medium",
        questions=[
            {"question": "What is displacement?", "answer": "Change in position"},
        ],
    )
)


@router.get("/", response_model=List[Quiz])
def list_quizzes() -> List[Quiz]:
    return _quizzes


@router.post("/", response_model=Quiz, status_code=201)
def create_quiz(payload: QuizCreate) -> Quiz:
    new_id = len(_quizzes) + 1
    quiz = Quiz(id=new_id, **payload.dict())
    _quizzes.append(quiz)
    return quiz


@router.get("/{quiz_id}", response_model=Quiz)
def get_quiz(quiz_id: int) -> Quiz:
    for quiz in _quizzes:
        if quiz.id == quiz_id:
            return quiz
    raise HTTPException(status_code=404, detail="Quiz not found")
