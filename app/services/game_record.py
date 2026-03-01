from fastapi import HTTPException, status

from app.models.event import EventType
from app.models.game_record import GameRecord
from app.models.group import MemberRole
from app.repositories.event import EventRepository
from app.repositories.game_record import GameRecordRepository
from app.repositories.group import GroupRepository
from app.schemas.game_record import (
    GameRecordCreate,
    GameRecordUpdate,
    PaginatedGameRecordResponse,
)


class GameRecordService:
    def __init__(
        self,
        game_record_repo: GameRecordRepository,
        group_repo: GroupRepository,
        event_repo: EventRepository,
    ) -> None:
        self.game_record_repo = game_record_repo
        self.group_repo = group_repo
        self.event_repo = event_repo

    async def _require_group_editor(self, group_id: int | None, user_id: int) -> None:
        """group_id 그룹에서 owner/admin인지 확인. 아니면 403."""
        if group_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Record has no group assigned",
            )
        member = await self.group_repo.get_member(group_id, user_id)
        if member is None or member.role not in (MemberRole.owner, MemberRole.admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only group owner or admin can modify game records",
            )

    async def create_game_record(
        self, created_by_id: int, data: GameRecordCreate
    ) -> GameRecord:
        if data.event_id is not None:
            event = await self.event_repo.get_by_id(data.event_id)
            if event and event.is_closed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot add records to a closed event",
                )
        if data.group_id is not None:
            member = await self.group_repo.get_member(data.group_id, created_by_id)
            if member is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must be a member of the group to create a game record",
                )
        return await self.game_record_repo.create(created_by_id, data)

    async def get_game_record(self, record_id: int) -> GameRecord:
        record = await self.game_record_repo.get_by_id(record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game record not found",
            )
        return record

    async def list_game_records(
        self,
        page: int,
        size: int,
        group_id: int | None,
        event_id: int | None = None,
    ) -> PaginatedGameRecordResponse:
        offset = (page - 1) * size
        is_aggregate = False
        aggregate_group_id = group_id
        period_start = None
        period_end = None
        if event_id is not None:
            event = await self.event_repo.get_by_id(event_id)
            if event and event.event_type == EventType.aggregate:
                is_aggregate = True
                aggregate_group_id = event.group_id
                period_start = event.period_start
                period_end = event.period_end
        if is_aggregate:
            items = await self.game_record_repo.list(
                offset,
                size,
                group_id=aggregate_group_id,
                is_aggregate=True,
                period_start=period_start,
                period_end=period_end,
            )
            total = await self.game_record_repo.count(
                group_id=aggregate_group_id,
                is_aggregate=True,
                period_start=period_start,
                period_end=period_end,
            )
        else:
            items = await self.game_record_repo.list(offset, size, group_id, event_id)
            total = await self.game_record_repo.count(group_id, event_id)
        return PaginatedGameRecordResponse(
            items=items, total=total, page=page, size=size
        )

    async def update_game_record(
        self, record_id: int, current_user_id: int, data: GameRecordUpdate
    ) -> GameRecord:
        record = await self.get_game_record(record_id)
        await self._require_group_editor(record.group_id, current_user_id)
        directions = ("east", "south", "west", "north")
        player_ids = [
            getattr(data, f"{d}_player_id") or getattr(record, f"{d}_player_id")
            for d in directions
        ]
        if len(set(player_ids)) != 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All four players must be different",
            )
        return await self.game_record_repo.update(record, data)

    async def delete_game_record(self, record_id: int, current_user_id: int) -> None:
        record = await self.get_game_record(record_id)
        await self._require_group_editor(record.group_id, current_user_id)
        await self.game_record_repo.delete(record)
