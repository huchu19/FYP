from typing import List

from fastapi import APIRouter, HTTPException

from app.schemas.classroom import Classroom, ClassroomCreate

router = APIRouter(prefix="/classrooms", tags=["classrooms"])

# In-memory store to keep the demo self-contained
_classrooms: List[Classroom] = []
_seed = Classroom(id=1, name="Physics 101", code="PHYS-ABC", teacher_id=1, description="Intro mechanics and waves")
_classrooms.append(_seed)


@router.get("/", response_model=List[Classroom])
def list_classrooms() -> List[Classroom]:
    return _classrooms


@router.post("/", response_model=Classroom, status_code=201)
def create_classroom(payload: ClassroomCreate) -> Classroom:
    new_id = len(_classrooms) + 1
    classroom = Classroom(id=new_id, **payload.dict())
    _classrooms.append(classroom)
    return classroom


@router.get("/{classroom_id}", response_model=Classroom)
def get_classroom(classroom_id: int) -> Classroom:
    for classroom in _classrooms:
        if classroom.id == classroom_id:
            return classroom
    raise HTTPException(status_code=404, detail="Classroom not found")
