from sqlalchemy import func, select

from app.models.event import Event
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

    async def list_by_group(
        self, group_id: int, offset: int, limit: int
    ) -> list[Event]:
        result = await self.db.execute(
            select(Event)
            .where(Event.group_id == group_id)
            .order_by(Event.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_group(self, group_id: int) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(Event).where(Event.group_id == group_id)
        )
        return result.scalar_one()

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
