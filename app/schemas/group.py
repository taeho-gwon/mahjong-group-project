from datetime import datetime

from pydantic import BaseModel, model_validator

from app.models.group import JoinPolicy, MemberRole
from app.schemas.common import UmaFields


class MemberInfo(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    username: str
    role: MemberRole


class MemberRoleUpdate(BaseModel):
    role: MemberRole


class GroupCreate(UmaFields):
    name: str
    description: str | None = None
    join_policy: JoinPolicy = JoinPolicy.public


class GroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    join_policy: JoinPolicy | None = None
    uma_1st: int | None = None
    uma_2nd: int | None = None
    uma_3rd: int | None = None
    uma_4th: int | None = None

    @model_validator(mode="after")
    def validate_uma_fields(self) -> "GroupUpdate":
        uma_values = [self.uma_1st, self.uma_2nd, self.uma_3rd, self.uma_4th]
        provided = [v for v in uma_values if v is not None]
        if provided and len(provided) != 4:
            raise ValueError("우마는 4개 순위를 모두 함께 변경해야 합니다.")
        if len(provided) == 4 and sum(provided) != 0:
            raise ValueError("우마 합계는 0이어야 합니다.")
        return self


class GroupResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    description: str | None
    owner_id: int
    join_policy: JoinPolicy
    uma_1st: int
    uma_2nd: int
    uma_3rd: int
    uma_4th: int
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
