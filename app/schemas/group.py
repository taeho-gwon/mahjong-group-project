from datetime import datetime

from pydantic import BaseModel

from app.models.group import JoinPolicy, MemberRole


class MemberInfo(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    username: str
    role: MemberRole


class MemberRoleUpdate(BaseModel):
    role: MemberRole


class GroupCreate(BaseModel):
    name: str
    description: str | None = None
    join_policy: JoinPolicy = JoinPolicy.public


class GroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    join_policy: JoinPolicy | None = None


class GroupResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    description: str | None
    owner_id: int
    join_policy: JoinPolicy
    is_active: bool
    created_at: datetime


class GroupDetailResponse(GroupResponse):
    members: list[MemberInfo]


class PaginatedGroupResponse(BaseModel):
    items: list[GroupResponse]
    total: int
    page: int
    size: int


class InviteLinkResponse(BaseModel):
    invite_token: str


class JoinByInviteRequest(BaseModel):
    invite_token: str
