from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def get_by_id(self, db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(
        self,
        db: Session,
        *,
        name: str,
        email: str,
        role: str,
        password_hash: str,
    ) -> User:
        user = User(
            name=name,
            email=email,
            role=role,
            password_hash=password_hash,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update_password_hash(self, db: Session, user: User, *, password_hash: str) -> User:
        user.password_hash = password_hash
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
