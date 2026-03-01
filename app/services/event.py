from fastapi import HTTPException, status

from app.models.event import Event, EventType
from app.models.group import MemberRole
from app.repositories.event import EventRepository
from app.repositories.group import GroupRepository
from app.schemas.event import EventCreate, EventUpdate


class EventService:
    def __init__(
        self, event_repo: EventRepository, group_repo: GroupRepository
    ) -> None:
        self.event_repo = event_repo
        self.group_repo = group_repo

    async def create_event(self, user_id: int, data: EventCreate) -> Event:
        if data.event_type != EventType.aggregate:
            data = data.model_copy(update={"preset_type": None})
        return await self.event_repo.create(user_id, data)

    async def get_event(self, event_id: int) -> Event:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )
        return event

    async def list_events(self, group_id: int) -> list[Event]:
        return await self.event_repo.list_by_group(group_id)

    async def close_event(self, event_id: int, user_id: int) -> Event:
        event = await self.get_event(event_id)
        if event.is_closed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is already closed",
            )
        if event.group_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot close an event without a group",
            )
        member = await self.group_repo.get_member(event.group_id, user_id)
        if member is None or member.role not in (MemberRole.owner, MemberRole.admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only group owner or admin can close an event",
            )
        return await self.event_repo.close(event)

    async def update_event(
        self, event_id: int, user_id: int, data: EventUpdate
    ) -> Event:
        event = await self.get_event(event_id)
        if event.is_closed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update a closed event",
            )
        if event.created_by_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the event creator can update it",
            )
        update_data = data.model_dump(exclude_unset=True)
        update_data.pop("event_type", None)
        update_data.pop("is_default", None)
        return await self.event_repo.update(event, update_data)

    async def delete_event(self, event_id: int, user_id: int) -> None:
        event = await self.get_event(event_id)
        if event.is_default:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete a default event",
            )
        if event.created_by_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the event creator can delete it",
            )
        await self.event_repo.delete(event)
