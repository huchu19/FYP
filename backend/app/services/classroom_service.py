from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.classroom import Classroom
from app.models.user import User
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

    def list_classrooms(self, db: Session, *, actor_user: User) -> list[Classroom]:
        if actor_user.role == "teacher":
            return self.classroom_repository.list_for_teacher(db, teacher_id=actor_user.id)
        if actor_user.role == "student":
            return self.classroom_repository.list_for_student(db, student_id=actor_user.id)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unsupported user role")

    def get_classroom(self, db: Session, classroom_id: int, *, actor_user: User) -> Classroom:
        classroom = self.classroom_repository.get_by_id(db, classroom_id)
        if classroom is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

        if actor_user.role == "teacher":
            if classroom.teacher_id != actor_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access classroom"
                )
        elif actor_user.role == "student":
            enrolled = self.classroom_repository.get_for_student(
                db, classroom_id=classroom_id, student_id=actor_user.id
            )
            if enrolled is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this classroom"
                )
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unsupported user role")

        return classroom

    def create_classroom(self, db: Session, payload: ClassroomCreate, *, actor_user: User) -> Classroom:
        if actor_user.role != "teacher":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can create classrooms")

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
            teacher_id=actor_user.id,
            description=payload.description,
        )

    def enroll_student(self, db: Session, *, code: str, actor_user: User) -> Classroom:
        if actor_user.role != "student":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can enroll")

        classroom = self.classroom_repository.get_by_code(db, code)
        if classroom is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

        existing = self.classroom_repository.get_enrollment(
            db, classroom_id=classroom.id, student_id=actor_user.id
        )
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already enrolled")

        self.classroom_repository.enroll_student(
            db, classroom_id=classroom.id, student_id=actor_user.id
        )
        return classroom
