from typing import List

from fastapi import APIRouter, HTTPException

from app.schemas.lesson import Lesson, LessonCreate

router = APIRouter(prefix="/lessons", tags=["lessons"])

_lessons: List[Lesson] = []
_lessons.append(
    Lesson(
        id=1,
        classroom_id=1,
        title="Newton's Laws",
        prompt="Teach Newton's three laws for beginners",
        outline=["Law of Inertia", "Force = mass × acceleration", "Action-reaction"],
        body="Structured content would go here.",
    )
)


@router.get("/", response_model=List[Lesson])
def list_lessons() -> List[Lesson]:
    return _lessons


@router.post("/", response_model=Lesson, status_code=201)
def create_lesson(payload: LessonCreate) -> Lesson:
    new_id = len(_lessons) + 1
    lesson = Lesson(id=new_id, **payload.dict())
    _lessons.append(lesson)
    return lesson


@router.get("/{lesson_id}", response_model=Lesson)
def get_lesson(lesson_id: int) -> Lesson:
    for lesson in _lessons:
        if lesson.id == lesson_id:
            return lesson
    raise HTTPException(status_code=404, detail="Lesson not found")
