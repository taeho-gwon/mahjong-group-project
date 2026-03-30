from fastapi import HTTPException, status

from app.models.event import Event
from app.models.group import MemberRole
from app.repositories.event import EventRepository
from app.repositories.group import GroupRepository
from app.schemas.event import EventCreate, EventUpdate, PaginatedEventResponse


class EventService:
    def __init__(
        self, event_repo: EventRepository, group_repo: GroupRepository
    ) -> None:
        self.event_repo = event_repo
        self.group_repo = group_repo

    async def _require_owner_or_admin(self, group_id: int | None, user_id: int) -> None:
        if group_id is None:
            return
        member = await self.group_repo.get_member(group_id, user_id)
        if member is None or member.role not in (
            MemberRole.owner,
            MemberRole.admin,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only group owner or admin can perform this action",
            )

    async def create_event(self, user_id: int, data: EventCreate) -> Event:
        await self._require_owner_or_admin(data.group_id, user_id)
        return await self.event_repo.create(user_id, data)

    async def _require_group_member(self, group_id: int | None, user_id: int) -> None:
        if group_id is None:
            return
        member = await self.group_repo.get_member(group_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this group",
            )

    async def _get_event(self, event_id: int) -> Event:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )
        return event

    async def get_event(self, event_id: int, user_id: int) -> Event:
        event = await self._get_event(event_id)
        await self._require_group_member(event.group_id, user_id)
        return event

    async def list_events(
        self, group_id: int, user_id: int, page: int, size: int
    ) -> PaginatedEventResponse:
        await self._require_group_member(group_id, user_id)
        offset = (page - 1) * size
        items = await self.event_repo.list_by_group(group_id, offset, size)
        total = await self.event_repo.count_by_group(group_id)
        return PaginatedEventResponse(items=items, total=total, page=page, size=size)

    async def close_event(self, event_id: int, user_id: int) -> Event:
        event = await self._get_event(event_id)
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

    async def reopen_event(self, event_id: int, user_id: int) -> Event:
        event = await self._get_event(event_id)
        if not event.is_closed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is already open",
            )
        if event.group_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot reopen an event without a group",
            )
        member = await self.group_repo.get_member(event.group_id, user_id)
        if member is None or member.role not in (MemberRole.owner, MemberRole.admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only group owner or admin can reopen an event",
            )
        return await self.event_repo.reopen(event)

    async def update_event(
        self, event_id: int, user_id: int, data: EventUpdate
    ) -> Event:
        event = await self._get_event(event_id)
        if event.is_closed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update a closed event",
            )
        await self._require_owner_or_admin(event.group_id, user_id)
        update_data = data.model_dump(exclude_unset=True)
        return await self.event_repo.update(event, update_data)

    async def delete_event(self, event_id: int, user_id: int) -> None:
        event = await self._get_event(event_id)
        await self._require_owner_or_admin(event.group_id, user_id)
        await self.event_repo.delete(event)
