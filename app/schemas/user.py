from datetime import datetime

from pydantic import BaseModel, Field

from app.constants import (
    NICKNAME_MAX_LENGTH,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
)


class UserCreate(BaseModel):
    username: str = Field(max_length=USERNAME_MAX_LENGTH)
    password: str = Field(
        min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH
    )


class UserUpdate(BaseModel):
    nickname: str | None = Field(None, max_length=NICKNAME_MAX_LENGTH)


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    username: str
    nickname: str | None = None
    is_active: bool
    created_at: datetime


class SharedGroupInfo(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str


class UserProfileResponse(BaseModel):
    id: int
    username: str
    nickname: str | None = None
    created_at: datetime
    shared_groups: list[SharedGroupInfo]
