from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_game_record_service
from app.models.user import User
from app.schemas.game_record import (
    GameRecordCreate,
    GameRecordResponse,
    GameRecordUpdate,
    PaginatedGameRecordResponse,
)
from app.services.game_record import GameRecordService

router = APIRouter(prefix="/game-records", tags=["game-records"])


@router.post("", response_model=GameRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_game_record(
    data: GameRecordCreate,
    current_user: User = Depends(get_current_user),
    game_record_service: GameRecordService = Depends(get_game_record_service),
) -> GameRecordResponse:
    return await game_record_service.create_game_record(current_user.id, data)


@router.get("", response_model=PaginatedGameRecordResponse)
async def list_game_records(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    group_id: int | None = Query(default=None),
    event_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    game_record_service: GameRecordService = Depends(get_game_record_service),
) -> PaginatedGameRecordResponse:
    return await game_record_service.list_game_records(
        page, size, group_id, event_id, current_user.id
    )


@router.get("/{record_id}", response_model=GameRecordResponse)
async def get_game_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    game_record_service: GameRecordService = Depends(get_game_record_service),
) -> GameRecordResponse:
    return await game_record_service.get_game_record(record_id, current_user.id)


@router.put("/{record_id}", response_model=GameRecordResponse)
async def update_game_record(
    record_id: int,
    data: GameRecordUpdate,
    current_user: User = Depends(get_current_user),
    game_record_service: GameRecordService = Depends(get_game_record_service),
) -> GameRecordResponse:
    return await game_record_service.update_game_record(
        record_id, current_user.id, data
    )


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_game_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    game_record_service: GameRecordService = Depends(get_game_record_service),
) -> None:
    await game_record_service.delete_game_record(record_id, current_user.id)
