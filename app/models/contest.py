from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.group import Group
from app.models.user import User


class RankingType(StrEnum):
    score = "score"
    match_point = "match_point"


class Contest(Base):
    __tablename__ = "contests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("groups.id", ondelete="SET NULL"), index=True, nullable=True
    )
    created_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    ranking_type: Mapped[RankingType] = mapped_column(
        SAEnum(RankingType, name="rankingtype"),
        default=RankingType.score,
        server_default="score",
        nullable=False,
    )

    # 우마 (그룹 우마 override)
    uma_1st: Mapped[int] = mapped_column(
        default=30, server_default="30", nullable=False
    )
    uma_2nd: Mapped[int] = mapped_column(
        default=10, server_default="10", nullable=False
    )
    uma_3rd: Mapped[int] = mapped_column(
        default=-10, server_default="-10", nullable=False
    )
    uma_4th: Mapped[int] = mapped_column(
        default=-30, server_default="-30", nullable=False
    )

    # 승점 배점
    scoring_1st: Mapped[int] = mapped_column(
        default=4, server_default="4", nullable=False
    )
    scoring_2nd: Mapped[int] = mapped_column(
        default=2, server_default="2", nullable=False
    )
    scoring_3rd: Mapped[int] = mapped_column(
        default=1, server_default="1", nullable=False
    )
    scoring_4th: Mapped[int] = mapped_column(
        default=0, server_default="0", nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    group: Mapped[Group | None] = relationship(lazy="noload")
    created_by: Mapped[User] = relationship(lazy="noload", foreign_keys=[created_by_id])
