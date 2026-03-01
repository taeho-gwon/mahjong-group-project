from datetime import datetime

from pydantic import BaseModel, model_validator


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
    event_id: int | None = None
    game_link: str | None = None
    played_at: datetime | None = None

    @model_validator(mode="after")
    def check_point_sum(self) -> "GameRecordCreate":
        total = self.east_point + self.south_point + self.west_point + self.north_point
        if total != 100000:
            raise ValueError(f"Sum of points must be 100000, got {total}")
        return self

    @model_validator(mode="after")
    def check_unique_players(self) -> "GameRecordCreate":
        ids = [
            self.east_player_id,
            self.south_player_id,
            self.west_player_id,
            self.north_player_id,
        ]
        if len(set(ids)) != 4:
            raise ValueError("All four players must be different")
        return self


class GameRecordUpdate(BaseModel):
    east_player_id: int | None = None
    south_player_id: int | None = None
    west_player_id: int | None = None
    north_player_id: int | None = None
    east_point: int | None = None
    south_point: int | None = None
    west_point: int | None = None
    north_point: int | None = None
    game_link: str | None = None
    played_at: datetime | None = None

    @model_validator(mode="after")
    def check_point_sum(self) -> "GameRecordUpdate":
        points = [self.east_point, self.south_point, self.west_point, self.north_point]
        provided = [p for p in points if p is not None]
        if len(provided) == 4:
            total = sum(provided)
            if total != 100000:
                raise ValueError(f"Sum of points must be 100000, got {total}")
        return self


class GameRecordResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    group_id: int | None
    event_id: int | None
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
