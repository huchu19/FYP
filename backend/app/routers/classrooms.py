from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.services.classroom_service import ClassroomService
from app.schemas.classroom import Classroom, ClassroomCreate

router = APIRouter(prefix="/classrooms", tags=["classrooms"])
service = ClassroomService()


@router.get("/", response_model=list[Classroom])
def list_classrooms(db: Session = Depends(get_db)) -> list[Classroom]:
    return service.list_classrooms(db)


@router.post("/", response_model=Classroom, status_code=201)
def create_classroom(payload: ClassroomCreate, db: Session = Depends(get_db)) -> Classroom:
    return service.create_classroom(db, payload)


@router.get("/{classroom_id}", response_model=Classroom)
def get_classroom(classroom_id: int, db: Session = Depends(get_db)) -> Classroom:
    return service.get_classroom(db, classroom_id)
