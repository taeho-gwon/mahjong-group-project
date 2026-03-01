from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.event import Event
from app.models.user import User


class GameRecord(Base):
    __tablename__ = "game_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    group_id: Mapped[int | None] = mapped_column(
        ForeignKey("groups.id", ondelete="SET NULL"), index=True, nullable=True
    )
    east_player_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    south_player_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    west_player_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    north_player_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    east_point: Mapped[int] = mapped_column(Integer, nullable=False)
    south_point: Mapped[int] = mapped_column(Integer, nullable=False)
    west_point: Mapped[int] = mapped_column(Integer, nullable=False)
    north_point: Mapped[int] = mapped_column(Integer, nullable=False)
    created_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    event_id: Mapped[int | None] = mapped_column(
        ForeignKey("events.id", ondelete="SET NULL"), index=True, nullable=True
    )
    game_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    played_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    east_player: Mapped[User] = relationship(
        lazy="noload", foreign_keys=[east_player_id]
    )
    south_player: Mapped[User] = relationship(
        lazy="noload", foreign_keys=[south_player_id]
    )
    west_player: Mapped[User] = relationship(
        lazy="noload", foreign_keys=[west_player_id]
    )
    north_player: Mapped[User] = relationship(
        lazy="noload", foreign_keys=[north_player_id]
    )
    created_by: Mapped[User] = relationship(lazy="noload", foreign_keys=[created_by_id])
    event: Mapped[Event | None] = relationship(lazy="noload")
