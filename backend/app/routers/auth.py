from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/test")
def auth_test():
    return {"message": "auth ok"}
