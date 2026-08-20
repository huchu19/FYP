from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.rate_limit import rate_limit
from app.core.security import get_current_user
from app.models.user import User
from app.core.dependencies import get_db
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
service = AuthService()


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit(limit=10, window_seconds=300, scope="login"))],
)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    token = service.login(db, email=payload.email, password=payload.password)
    return TokenResponse(**token)


@router.post(
    "/register",
    response_model=AuthUserResponse,
    status_code=201,
    dependencies=[Depends(rate_limit(limit=5, window_seconds=3600, scope="register"))],
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    user = service.register(
        db,
        name=payload.name,
        email=payload.email,
        password=payload.password,
        role=payload.role.lower(),
    )
    return AuthUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
    )


@router.get("/me", response_model=AuthUserResponse)
def me(current_user: User = Depends(get_current_user)):
    return AuthUserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
    )
