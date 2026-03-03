from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.constants import (
    GROUP_DESCRIPTION_MAX_LENGTH,
    GROUP_NAME_MAX_LENGTH,
    NICKNAME_MAX_LENGTH,
)
from app.models.base import Base
from app.models.user import User


class RankingType(StrEnum):
    score = "score"
    match_point = "match_point"


class JoinPolicy(StrEnum):
    public = "public"
    private = "private"


class MemberRole(StrEnum):
    owner = "owner"
    admin = "admin"
    member = "member"


class GroupMember(Base):
    __tablename__ = "group_members"
    __table_args__ = (
        UniqueConstraint(
            "group_id", "nickname", name="uq_group_members_group_nickname"
        ),
    )

    group_id: Mapped[int] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role: Mapped[MemberRole] = mapped_column(
        SAEnum(MemberRole, name="memberrole"),
        default=MemberRole.member,
        server_default="member",
        nullable=False,
    )
    nickname: Mapped[str | None] = mapped_column(
        String(NICKNAME_MAX_LENGTH), nullable=True
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(lazy="noload")

    @property
    def id(self) -> int:
        return self.user.id

    @property
    def username(self) -> str:
        return self.user.username

    @property
    def user_nickname(self) -> str | None:
        return self.user.nickname if self.user else None


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(
        String(GROUP_NAME_MAX_LENGTH), index=True, nullable=False
    )
    description: Mapped[str | None] = mapped_column(
        String(GROUP_DESCRIPTION_MAX_LENGTH), nullable=True
    )
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    join_policy: Mapped[JoinPolicy] = mapped_column(
        SAEnum(JoinPolicy, name="joinpolicy"),
        default=JoinPolicy.public,
        server_default="public",
        nullable=False,
    )
    invite_token: Mapped[str | None] = mapped_column(
        unique=True, index=True, nullable=True
    )
    invite_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    weekly_start_day: Mapped[int] = mapped_column(
        default=0, server_default="0", nullable=False
    )
    monthly_start_day: Mapped[int] = mapped_column(
        default=1, server_default="1", nullable=False
    )

    # 기본 랭킹 설정
    default_ranking_type: Mapped[RankingType] = mapped_column(
        SAEnum(RankingType, name="rankingtype", create_constraint=False),
        default=RankingType.score,
        server_default="score",
        nullable=False,
    )
    default_uma_1st: Mapped[int] = mapped_column(
        default=30, server_default="30", nullable=False
    )
    default_uma_2nd: Mapped[int] = mapped_column(
        default=10, server_default="10", nullable=False
    )
    default_uma_3rd: Mapped[int] = mapped_column(
        default=-10, server_default="-10", nullable=False
    )
    default_uma_4th: Mapped[int] = mapped_column(
        default=-30, server_default="-30", nullable=False
    )
    default_scoring_1st: Mapped[int] = mapped_column(
        default=4, server_default="4", nullable=False
    )
    default_scoring_2nd: Mapped[int] = mapped_column(
        default=2, server_default="2", nullable=False
    )
    default_scoring_3rd: Mapped[int] = mapped_column(
        default=1, server_default="1", nullable=False
    )
    default_scoring_4th: Mapped[int] = mapped_column(
        default=0, server_default="0", nullable=False
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    members: Mapped[list[GroupMember]] = relationship(
        GroupMember,
        lazy="noload",
        foreign_keys=[GroupMember.group_id],
    )
