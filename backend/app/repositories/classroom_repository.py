from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.classroom_enrollment import ClassroomEnrollment
from app.models.classroom import Classroom


class ClassroomRepository:
    def list_all(self, db: Session) -> list[Classroom]:
        return db.query(Classroom).order_by(Classroom.id.asc()).all()

    def list_for_teacher(self, db: Session, *, teacher_id: int) -> list[Classroom]:
        return (
            db.query(Classroom)
            .filter(Classroom.teacher_id == teacher_id)
            .order_by(Classroom.id.asc())
            .all()
        )

    def list_for_student(self, db: Session, *, student_id: int) -> list[Classroom]:
        return (
            db.query(Classroom)
            .join(ClassroomEnrollment, ClassroomEnrollment.classroom_id == Classroom.id)
            .filter(ClassroomEnrollment.student_id == student_id)
            .order_by(Classroom.id.asc())
            .all()
        )

    def get_by_id(self, db: Session, classroom_id: int) -> Optional[Classroom]:
        return db.query(Classroom).filter(Classroom.id == classroom_id).first()

    def get_for_teacher(self, db: Session, *, classroom_id: int, teacher_id: int) -> Optional[Classroom]:
        return (
            db.query(Classroom)
            .filter(
                Classroom.id == classroom_id,
                Classroom.teacher_id == teacher_id,
            )
            .first()
        )

    def get_for_student(self, db: Session, *, classroom_id: int, student_id: int) -> Optional[Classroom]:
        return (
            db.query(Classroom)
            .join(ClassroomEnrollment, ClassroomEnrollment.classroom_id == Classroom.id)
            .filter(
                Classroom.id == classroom_id,
                ClassroomEnrollment.student_id == student_id,
            )
            .first()
        )

    def get_by_code(self, db: Session, code: str) -> Optional[Classroom]:
        return db.query(Classroom).filter(func.upper(Classroom.code) == code.upper()).first()

    def get_enrollment(
        self,
        db: Session,
        *,
        classroom_id: int,
        student_id: int,
    ) -> Optional[ClassroomEnrollment]:
        return (
            db.query(ClassroomEnrollment)
            .filter(
                ClassroomEnrollment.classroom_id == classroom_id,
                ClassroomEnrollment.student_id == student_id,
            )
            .first()
        )

    def enroll_student(
        self,
        db: Session,
        *,
        classroom_id: int,
        student_id: int,
    ) -> ClassroomEnrollment:
        enrollment = ClassroomEnrollment(
            classroom_id=classroom_id,
            student_id=student_id,
        )
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        return enrollment

    def create(
        self,
        db: Session,
        *,
        name: str,
        code: str,
        teacher_id: int,
        description: Optional[str],
        subject: Optional[str] = None,
        year_group: Optional[str] = None,
        learning_objectives: Optional[str] = None,
        syllabus_notes: Optional[str] = None,
    ) -> Classroom:
        classroom = Classroom(
            name=name,
            code=code,
            teacher_id=teacher_id,
            description=description,
            subject=subject,
            year_group=year_group,
            learning_objectives=learning_objectives,
            syllabus_notes=syllabus_notes,
        )
        db.add(classroom)
        db.commit()
        db.refresh(classroom)
        return classroom

    def update(self, db: Session, classroom: Classroom, *, data: dict) -> Classroom:
        for key, value in data.items():
            setattr(classroom, key, value)
        db.add(classroom)
        db.commit()
        db.refresh(classroom)
        return classroom

    def delete(self, db: Session, classroom: Classroom) -> None:
        db.delete(classroom)
