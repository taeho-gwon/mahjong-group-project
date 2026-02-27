from datetime import datetime

from pydantic import BaseModel


class MemberInfo(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    username: str


class GroupCreate(BaseModel):
    name: str
    description: str | None = None


class GroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class GroupResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    description: str | None
    owner_id: int
    is_active: bool
    created_at: datetime


class GroupDetailResponse(GroupResponse):
    members: list[MemberInfo]
