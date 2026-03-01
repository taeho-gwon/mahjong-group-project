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


class SharedGroupInfo(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str


class UserProfileResponse(BaseModel):
    id: int
    username: str
    created_at: datetime
    shared_groups: list[SharedGroupInfo]
