from fastapi import HTTPException, status

from app.models.game_record import GameRecord
from app.repositories.game_record import GameRecordRepository
from app.schemas.game_record import GameRecordCreate, PaginatedGameRecordResponse


class GameRecordService:
    def __init__(self, game_record_repo: GameRecordRepository) -> None:
        self.game_record_repo = game_record_repo

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
        items = await self.game_record_repo.list(offset, size, group_id, contest_id)
        total = await self.game_record_repo.count(group_id, contest_id)
        return PaginatedGameRecordResponse(
            items=items, total=total, page=page, size=size
        )

    async def delete_game_record(self, record_id: int, current_user_id: int) -> None:
        record = await self.get_game_record(record_id)
        if record.created_by_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the creator can delete this record",
            )
        await self.game_record_repo.delete(record)
