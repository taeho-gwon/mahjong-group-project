from sqlalchemy import select

from app.models.event import Event, EventType, RankingType
from app.repositories.base import BaseRepository
from app.schemas.event import EventCreate


class EventRepository(BaseRepository):
    async def create(self, created_by_id: int, data: EventCreate) -> Event:
        event = Event(
            created_by_id=created_by_id,
            **data.model_dump(),
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def get_by_id(self, event_id: int) -> Event | None:
        result = await self.db.execute(select(Event).where(Event.id == event_id))
        return result.scalar_one_or_none()

    async def list_by_group(self, group_id: int) -> list[Event]:
        result = await self.db.execute(
            select(Event)
            .where(Event.group_id == group_id)
            .order_by(Event.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, event: Event, data: dict) -> Event:
        for key, value in data.items():
            setattr(event, key, value)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def close(self, event: Event) -> Event:
        event.is_closed = True
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def delete(self, event: Event) -> None:
        await self.db.delete(event)
        await self.db.commit()

    async def create_default_aggregate(
        self, group_id: int, created_by_id: int
    ) -> Event:
        event = Event(
            name="전체 랭킹",
            event_type=EventType.aggregate,
            ranking_type=RankingType.score,
            group_id=group_id,
            created_by_id=created_by_id,
            is_default=True,
            uma_1st=30,
            uma_2nd=10,
            uma_3rd=-10,
            uma_4th=-30,
            scoring_1st=4,
            scoring_2nd=2,
            scoring_3rd=1,
            scoring_4th=0,
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def get_default_aggregate_by_group(
        self, group_id: int
    ) -> Event | None:
        result = await self.db.execute(
            select(Event).where(
                Event.group_id == group_id,
                Event.event_type == EventType.aggregate,
                Event.is_default.is_(True),
            )
        )
        return result.scalar_one_or_none()
