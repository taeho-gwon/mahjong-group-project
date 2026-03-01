from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.models.contest import Contest, ContestType
from app.models.game_record import GameRecord
from app.repositories.base import BaseRepository
from app.schemas.game_record import GameRecordCreate, GameRecordUpdate


def _with_players(stmt):  # type: ignore[no-untyped-def]
    return stmt.options(
        selectinload(GameRecord.east_player),
        selectinload(GameRecord.south_player),
        selectinload(GameRecord.west_player),
        selectinload(GameRecord.north_player),
    )


class GameRecordRepository(BaseRepository):
    async def create(self, created_by_id: int, data: GameRecordCreate) -> GameRecord:
        played_at = data.played_at or datetime.now(UTC)
        record = GameRecord(
            created_by_id=created_by_id,
            east_player_id=data.east_player_id,
            south_player_id=data.south_player_id,
            west_player_id=data.west_player_id,
            north_player_id=data.north_player_id,
            east_point=data.east_point,
            south_point=data.south_point,
            west_point=data.west_point,
            north_point=data.north_point,
            group_id=data.group_id,
            contest_id=data.contest_id,
            game_link=data.game_link,
            played_at=played_at,
        )
        self.db.add(record)
        await self.db.commit()

        result = await self.db.execute(
            _with_players(select(GameRecord).where(GameRecord.id == record.id))
        )
        return result.scalar_one()

    async def get_by_id(self, record_id: int) -> GameRecord | None:
        result = await self.db.execute(
            _with_players(select(GameRecord).where(GameRecord.id == record_id))
        )
        return result.scalar_one_or_none()

    async def list(
        self,
        offset: int,
        limit: int,
        group_id: int | None = None,
        contest_id: int | None = None,
        is_overall: bool = False,
    ) -> list[GameRecord]:
        if is_overall and group_id is not None:
            stmt = _with_players(
                select(GameRecord)
                .outerjoin(Contest, GameRecord.contest_id == Contest.id)
                .where(GameRecord.group_id == group_id)
                .where(
                    (GameRecord.contest_id.is_(None))
                    | (Contest.contest_type == ContestType.regular)
                )
            )
        else:
            stmt = _with_players(select(GameRecord))
            if group_id is not None:
                stmt = stmt.where(GameRecord.group_id == group_id)
            if contest_id is not None:
                stmt = stmt.where(GameRecord.contest_id == contest_id)
        stmt = stmt.order_by(GameRecord.played_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count(
        self,
        group_id: int | None = None,
        contest_id: int | None = None,
        is_overall: bool = False,
    ) -> int:
        if is_overall and group_id is not None:
            stmt = (
                select(func.count())
                .select_from(GameRecord)
                .outerjoin(Contest, GameRecord.contest_id == Contest.id)
                .where(GameRecord.group_id == group_id)
                .where(
                    (GameRecord.contest_id.is_(None))
                    | (Contest.contest_type == ContestType.regular)
                )
            )
        else:
            stmt = select(func.count()).select_from(GameRecord)
            if group_id is not None:
                stmt = stmt.where(GameRecord.group_id == group_id)
            if contest_id is not None:
                stmt = stmt.where(GameRecord.contest_id == contest_id)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def update(self, record: GameRecord, data: GameRecordUpdate) -> GameRecord:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(record, field, value)
        await self.db.commit()

        result = await self.db.execute(
            _with_players(select(GameRecord).where(GameRecord.id == record.id))
        )
        return result.scalar_one()

    async def delete(self, record: GameRecord) -> None:
        await self.db.delete(record)
        await self.db.commit()
