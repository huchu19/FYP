from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr


class User(UserBase):
    id: int

    class Config:
        orm_mode = True
