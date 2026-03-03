from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.constants import (
    GROUP_DESCRIPTION_MAX_LENGTH,
    GROUP_NAME_MAX_LENGTH,
    NICKNAME_MAX_LENGTH,
)
from app.models.group import JoinPolicy, MemberRole, RankingType


class MemberInfo(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    username: str
    role: MemberRole
    nickname: str | None = None
    user_nickname: str | None = None


class MemberRoleUpdate(BaseModel):
    role: MemberRole


class GroupCreate(BaseModel):
    name: str = Field(max_length=GROUP_NAME_MAX_LENGTH)
    description: str | None = Field(None, max_length=GROUP_DESCRIPTION_MAX_LENGTH)
    join_policy: JoinPolicy = JoinPolicy.public
    weekly_start_day: int = 0
    monthly_start_day: int = 1
    default_ranking_type: RankingType = RankingType.score
    default_uma_1st: int = 30
    default_uma_2nd: int = 10
    default_uma_3rd: int = -10
    default_uma_4th: int = -30
    default_scoring_1st: int = 4
    default_scoring_2nd: int = 2
    default_scoring_3rd: int = 1
    default_scoring_4th: int = 0

    @field_validator("weekly_start_day")
    @classmethod
    def validate_weekly_start_day(cls, v: int) -> int:
        if not 0 <= v <= 6:
            raise ValueError("weekly_start_day must be 0-6 (0=Mon, 6=Sun)")
        return v

    @field_validator("monthly_start_day")
    @classmethod
    def validate_monthly_start_day(cls, v: int) -> int:
        if not 1 <= v <= 28:
            raise ValueError("monthly_start_day must be 1-28")
        return v

    @model_validator(mode="after")
    def validate_uma_sum(self) -> "GroupCreate":
        total = (
            self.default_uma_1st
            + self.default_uma_2nd
            + self.default_uma_3rd
            + self.default_uma_4th
        )
        if total != 0:
            raise ValueError("우마 합계는 0이어야 합니다.")
        return self


class GroupUpdate(BaseModel):
    name: str | None = Field(None, max_length=GROUP_NAME_MAX_LENGTH)
    description: str | None = Field(None, max_length=GROUP_DESCRIPTION_MAX_LENGTH)
    join_policy: JoinPolicy | None = None
    weekly_start_day: int | None = None
    monthly_start_day: int | None = None
    default_ranking_type: RankingType | None = None
    default_uma_1st: int | None = None
    default_uma_2nd: int | None = None
    default_uma_3rd: int | None = None
    default_uma_4th: int | None = None
    default_scoring_1st: int | None = None
    default_scoring_2nd: int | None = None
    default_scoring_3rd: int | None = None
    default_scoring_4th: int | None = None

    @field_validator("weekly_start_day")
    @classmethod
    def validate_weekly_start_day(cls, v: int | None) -> int | None:
        if v is not None and not 0 <= v <= 6:
            raise ValueError("weekly_start_day must be 0-6 (0=Mon, 6=Sun)")
        return v

    @field_validator("monthly_start_day")
    @classmethod
    def validate_monthly_start_day(cls, v: int | None) -> int | None:
        if v is not None and not 1 <= v <= 28:
            raise ValueError("monthly_start_day must be 1-28")
        return v

    @model_validator(mode="after")
    def validate_uma_fields(self) -> "GroupUpdate":
        uma_values = [
            self.default_uma_1st,
            self.default_uma_2nd,
            self.default_uma_3rd,
            self.default_uma_4th,
        ]
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
    weekly_start_day: int
    monthly_start_day: int
    default_ranking_type: RankingType
    default_uma_1st: int
    default_uma_2nd: int
    default_uma_3rd: int
    default_uma_4th: int
    default_scoring_1st: int
    default_scoring_2nd: int
    default_scoring_3rd: int
    default_scoring_4th: int
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
    invite_url: str
    expires_at: datetime


class JoinGroupRequest(BaseModel):
    nickname: str | None = Field(None, max_length=NICKNAME_MAX_LENGTH)


class JoinByInviteRequest(BaseModel):
    invite_token: str
    nickname: str | None = Field(None, max_length=NICKNAME_MAX_LENGTH)


class NicknameUpdate(BaseModel):
    nickname: str | None = Field(None, max_length=NICKNAME_MAX_LENGTH)
