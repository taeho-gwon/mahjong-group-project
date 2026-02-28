from datetime import datetime

from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    username: str
    is_active: bool
    created_at: datetime
