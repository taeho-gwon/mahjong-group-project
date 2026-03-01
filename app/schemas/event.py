from datetime import datetime

from pydantic import BaseModel, model_validator

from app.models.event import EventType, PresetType, RankingType
from app.schemas.common import UmaFields


class EventCreate(UmaFields):
    name: str
    group_id: int | None = None
    ranking_type: RankingType = RankingType.score
    event_type: EventType = EventType.regular
    scoring_1st: int = 4
    scoring_2nd: int = 2
    scoring_3rd: int = 1
    scoring_4th: int = 0
    period_start: datetime | None = None
    period_end: datetime | None = None
    preset_type: PresetType | None = None

    @model_validator(mode="after")
    def check_period_order(self) -> "EventCreate":
        if self.period_start is not None and self.period_end is not None:
            if self.period_start >= self.period_end:
                raise ValueError("period_start must be before period_end")
        return self


class EventUpdate(BaseModel):
    name: str | None = None
    group_id: int | None = None
    ranking_type: RankingType | None = None
    uma_1st: int | None = None
    uma_2nd: int | None = None
    uma_3rd: int | None = None
    uma_4th: int | None = None
    scoring_1st: int | None = None
    scoring_2nd: int | None = None
    scoring_3rd: int | None = None
    scoring_4th: int | None = None

    @model_validator(mode="after")
    def validate_uma_fields(self) -> "EventUpdate":
        uma_values = [self.uma_1st, self.uma_2nd, self.uma_3rd, self.uma_4th]
        provided = [v for v in uma_values if v is not None]
        if provided and len(provided) != 4:
            raise ValueError("우마는 4개 순위를 모두 함께 변경해야 합니다.")
        if len(provided) == 4 and sum(provided) != 0:
            raise ValueError("우마 합계는 0이어야 합니다.")
        return self


class EventResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    group_id: int | None
    created_by_id: int
    ranking_type: RankingType
    event_type: EventType
    uma_1st: int
    uma_2nd: int
    uma_3rd: int
    uma_4th: int
    scoring_1st: int
    scoring_2nd: int
    scoring_3rd: int
    scoring_4th: int
    period_start: datetime | None
    period_end: datetime | None
    is_default: bool
    is_closed: bool
    preset_type: PresetType | None
    created_at: datetime
    updated_at: datetime
