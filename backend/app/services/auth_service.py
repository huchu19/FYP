from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, user_repository: Optional[UserRepository] = None) -> None:
        self.user_repository = user_repository or UserRepository()

    def login(self, db: Session, *, email: str, password: str) -> dict:
        user = self.user_repository.get_by_email(db, email)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

        verification = verify_password(password, user.password_hash)
        if not verification.verified:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if verification.needs_rehash:
            user = self.user_repository.update_password_hash(
                db,
                user,
                password_hash=hash_password(password),
            )

        access_token = create_access_token(subject=str(user.id), role=user.role)
        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    def register(
        self,
        db: Session,
        *,
        name: str,
        email: str,
        password: str,
        role: str,
    ) -> User:
        if role not in {"teacher", "student"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be teacher or student")

        existing = self.user_repository.get_by_email(db, email)
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

        return self.user_repository.create(
            db,
            name=name,
            email=email,
            role=role,
            password_hash=hash_password(password),
        )
