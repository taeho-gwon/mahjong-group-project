from datetime import datetime

from pydantic import BaseModel


class PlayerInfo(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    username: str


class GameRecordCreate(BaseModel):
    east_player_id: int
    south_player_id: int
    west_player_id: int
    north_player_id: int
    east_point: int
    south_point: int
    west_point: int
    north_point: int
    group_id: int | None = None
    game_link: str | None = None
    played_at: datetime | None = None


class GameRecordResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    group_id: int | None
    created_by_id: int
    east_player: PlayerInfo
    south_player: PlayerInfo
    west_player: PlayerInfo
    north_player: PlayerInfo
    east_point: int
    south_point: int
    west_point: int
    north_point: int
    game_link: str | None
    played_at: datetime
    created_at: datetime


class PaginatedGameRecordResponse(BaseModel):
    items: list[GameRecordResponse]
    total: int
    page: int
    size: int
