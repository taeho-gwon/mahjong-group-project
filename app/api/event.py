from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_event_service
from app.models.user import User
from app.schemas.event import (
    EventCreate,
    EventResponse,
    EventUpdate,
    PaginatedEventResponse,
)
from app.services.event import EventService

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    data: EventCreate,
    user: User = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> EventResponse:
    return await event_service.create_event(user.id, data)


@router.get("", response_model=PaginatedEventResponse)
async def list_events(
    group_id: int,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=100, ge=1, le=200),
    user: User = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> PaginatedEventResponse:
    return await event_service.list_events(group_id, user.id, page, size)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    user: User = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> EventResponse:
    return await event_service.get_event(event_id, user.id)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    data: EventUpdate,
    user: User = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> EventResponse:
    return await event_service.update_event(event_id, user.id, data)


@router.post("/{event_id}/close", response_model=EventResponse)
async def close_event(
    event_id: int,
    user: User = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> EventResponse:
    return await event_service.close_event(event_id, user.id)


@router.post("/{event_id}/reopen", response_model=EventResponse)
async def reopen_event(
    event_id: int,
    user: User = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> EventResponse:
    return await event_service.reopen_event(event_id, user.id)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    user: User = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> None:
    await event_service.delete_event(event_id, user.id)
