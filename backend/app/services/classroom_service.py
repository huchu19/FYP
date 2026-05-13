from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.analytics_event import AnalyticsEvent
from app.models.classroom_enrollment import ClassroomEnrollment
from app.models.classroom import Classroom
from app.models.concept import Concept
from app.models.gamification import Gamification
from app.models.lesson import Lesson
from app.models.quiz import Quiz
from app.models.user import User
from app.repositories.classroom_repository import ClassroomRepository
from app.repositories.user_repository import UserRepository
from app.schemas.classroom import ClassroomCreate, ClassroomUpdate


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

        normalized_code = payload.code.upper().strip()
        existing = self.classroom_repository.get_by_code(db, normalized_code)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Classroom code '{normalized_code}' already exists",
            )

        return self.classroom_repository.create(
            db,
            name=payload.name,
            code=normalized_code,
            teacher_id=actor_user.id,
            description=payload.description,
            subject=payload.subject,
            year_group=payload.year_group,
            learning_objectives=payload.learning_objectives,
            syllabus_notes=payload.syllabus_notes,
        )

    def enroll_student(self, db: Session, *, code: str, actor_user: User) -> Classroom:
        if actor_user.role != "student":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can enroll")

        classroom = self.classroom_repository.get_by_code(db, code.upper().strip())
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

    def update_classroom(
        self, db: Session, classroom_id: int, payload: ClassroomUpdate, *, actor_user: User
    ) -> Classroom:
        if actor_user.role != "teacher":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can update classrooms")

        classroom = self.classroom_repository.get_for_teacher(
            db, classroom_id=classroom_id, teacher_id=actor_user.id
        )
        if classroom is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

        data = payload.model_dump(exclude_unset=True)
        return self.classroom_repository.update(db, classroom, data=data)

    def delete_classroom(self, db: Session, classroom_id: int, *, actor_user: User) -> None:
        if actor_user.role != "teacher":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only teachers can delete classrooms",
            )

        classroom = self.classroom_repository.get_for_teacher(
            db, classroom_id=classroom_id, teacher_id=actor_user.id
        )
        if classroom is None:
            existing = self.classroom_repository.get_by_id(db, classroom_id)
            if existing is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Classroom not found",
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete classroom",
            )

        db.query(AnalyticsEvent).filter(
            AnalyticsEvent.classroom_id == classroom_id
        ).delete(synchronize_session=False)
        db.query(Gamification).filter(
            Gamification.classroom_id == classroom_id
        ).delete(synchronize_session=False)
        db.query(ClassroomEnrollment).filter(
            ClassroomEnrollment.classroom_id == classroom_id
        ).delete(synchronize_session=False)
        db.query(Concept).filter(
            Concept.classroom_id == classroom_id
        ).delete(synchronize_session=False)
        db.query(Quiz).filter(
            Quiz.classroom_id == classroom_id
        ).delete(synchronize_session=False)
        db.query(Lesson).filter(
            Lesson.classroom_id == classroom_id
        ).delete(synchronize_session=False)

        self.classroom_repository.delete(db, classroom)
        db.commit()
