from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.get("/test")
def auth_test():
    return {"message": "auth ok"}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    # Stub: accept any credentials and return a fake token
    return TokenResponse(access_token=f"fake-token-for-{payload.email}")
