from fastapi import HTTPException, status

from app.models.contest import ContestType
from app.models.game_record import GameRecord
from app.models.group import MemberRole
from app.repositories.contest import ContestRepository
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
        contest_repo: ContestRepository,
    ) -> None:
        self.game_record_repo = game_record_repo
        self.group_repo = group_repo
        self.contest_repo = contest_repo

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
        contest_id: int | None = None,
    ) -> PaginatedGameRecordResponse:
        offset = (page - 1) * size
        is_overall = False
        overall_group_id = group_id
        if contest_id is not None:
            contest = await self.contest_repo.get_by_id(contest_id)
            if contest and contest.contest_type == ContestType.overall:
                is_overall = True
                overall_group_id = contest.group_id
        if is_overall:
            items = await self.game_record_repo.list(
                offset, size, group_id=overall_group_id, is_overall=True
            )
            total = await self.game_record_repo.count(
                group_id=overall_group_id, is_overall=True
            )
        else:
            items = await self.game_record_repo.list(offset, size, group_id, contest_id)
            total = await self.game_record_repo.count(group_id, contest_id)
        return PaginatedGameRecordResponse(
            items=items, total=total, page=page, size=size
        )

    async def update_game_record(
        self, record_id: int, current_user_id: int, data: GameRecordUpdate
    ) -> GameRecord:
        record = await self.get_game_record(record_id)
        await self._require_group_editor(record.group_id, current_user_id)
        return await self.game_record_repo.update(record, data)

    async def delete_game_record(self, record_id: int, current_user_id: int) -> None:
        record = await self.get_game_record(record_id)
        await self._require_group_editor(record.group_id, current_user_id)
        await self.game_record_repo.delete(record)
