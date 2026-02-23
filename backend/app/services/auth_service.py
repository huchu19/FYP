from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, user_repository: Optional[UserRepository] = None) -> None:
        self.user_repository = user_repository or UserRepository()

    def login(self, db: Session, *, email: str, password: str) -> dict:
        user = self.user_repository.get_by_email(db, email)
        if user is None or user.password_hash != password:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

        # Placeholder token until JWT integration is added.
        return {"access_token": f"dev-token-user-{user.id}", "token_type": "bearer"}
