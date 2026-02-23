from typing import Optional

from sqlalchemy.orm import Session

from app.models.classroom import Classroom


class ClassroomRepository:
    def list_all(self, db: Session) -> list[Classroom]:
        return db.query(Classroom).order_by(Classroom.id.asc()).all()

    def get_by_id(self, db: Session, classroom_id: int) -> Optional[Classroom]:
        return db.query(Classroom).filter(Classroom.id == classroom_id).first()

    def get_by_code(self, db: Session, code: str) -> Optional[Classroom]:
        return db.query(Classroom).filter(Classroom.code == code).first()

    def create(
        self,
        db: Session,
        *,
        name: str,
        code: str,
        teacher_id: int,
        description: Optional[str],
    ) -> Classroom:
        classroom = Classroom(
            name=name,
            code=code,
            teacher_id=teacher_id,
            description=description,
        )
        db.add(classroom)
        db.commit()
        db.refresh(classroom)
        return classroom
