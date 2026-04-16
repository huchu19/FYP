from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.services.classroom_service import ClassroomService
from app.services.lesson_service import LessonService
from app.services.quiz_service import QuizService
from app.schemas.classroom import Classroom, ClassroomCreate, ClassroomJoin
from app.schemas.lesson import Lesson as LessonSchema
from app.schemas.quiz import Quiz as QuizSchema

router = APIRouter(prefix="/classrooms", tags=["classrooms"])
service = ClassroomService()
lesson_service = LessonService()
quiz_service = QuizService()


@router.get("/", response_model=list[Classroom])
def list_classrooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Classroom]:
    return service.list_classrooms(db, actor_user=current_user)


@router.post("/", response_model=Classroom, status_code=201)
def create_classroom(
    payload: ClassroomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Classroom:
    return service.create_classroom(db, payload, actor_user=current_user)


@router.post("/join", response_model=Classroom)
def join_classroom(
    payload: ClassroomJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
) -> Classroom:
    return service.enroll_student(db, code=payload.code, actor_user=current_user)


@router.get("/{classroom_id}", response_model=Classroom)
def get_classroom(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Classroom:
    return service.get_classroom(db, classroom_id, actor_user=current_user)


@router.get("/{classroom_id}/lessons", response_model=list[LessonSchema])
def list_classroom_lessons(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[LessonSchema]:
    service.get_classroom(db, classroom_id, actor_user=current_user)
    published_only = current_user.role == "student"
    return lesson_service.list_for_classroom(db, classroom_id, published_only=published_only)


@router.get("/{classroom_id}/quizzes", response_model=list[QuizSchema])
def list_classroom_quizzes(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[QuizSchema]:
    service.get_classroom(db, classroom_id, actor_user=current_user)
    published_only = current_user.role == "student"
    return quiz_service.list_for_classroom(db, classroom_id, published_only=published_only)


@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("teacher")),
) -> Response:
    service.delete_classroom(db, classroom_id, actor_user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
