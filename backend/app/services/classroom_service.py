from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.classroom import Classroom
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.user_repository import UserRepository
from app.schemas.classroom import ClassroomCreate


class ClassroomService:
    def __init__(
        self,
        classroom_repository: Optional[ClassroomRepository] = None,
        user_repository: Optional[UserRepository] = None,
    ) -> None:
        self.classroom_repository = classroom_repository or ClassroomRepository()
        self.user_repository = user_repository or UserRepository()

    def list_classrooms(self, db: Session) -> list[Classroom]:
        return self.classroom_repository.list_all(db)

    def get_classroom(self, db: Session, classroom_id: int) -> Classroom:
        classroom = self.classroom_repository.get_by_id(db, classroom_id)
        if classroom is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")
        return classroom

    def create_classroom(self, db: Session, payload: ClassroomCreate) -> Classroom:
        teacher = self.user_repository.get_by_id(db, payload.teacher_id)
        if teacher is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
        if teacher.role != "teacher":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="teacher_id must reference a teacher")

        existing = self.classroom_repository.get_by_code(db, payload.code)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Classroom code '{payload.code}' already exists",
            )

        return self.classroom_repository.create(
            db,
            name=payload.name,
            code=payload.code,
            teacher_id=payload.teacher_id,
            description=payload.description,
        )
