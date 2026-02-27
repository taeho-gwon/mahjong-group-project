from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
