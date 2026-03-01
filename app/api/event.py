from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_event_service
from app.models.user import User
from app.schemas.event import EventCreate, EventResponse, EventUpdate
from app.services.event import EventService

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    data: EventCreate,
    user: User = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> EventResponse:
    return await event_service.create_event(user.id, data)


@router.get("", response_model=list[EventResponse])
async def list_events(
    group_id: int,
    event_service: EventService = Depends(get_event_service),
) -> list[EventResponse]:
    return await event_service.list_events(group_id)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    event_service: EventService = Depends(get_event_service),
) -> EventResponse:
    return await event_service.get_event(event_id)


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


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: int,
    user: User = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> None:
    await event_service.delete_event(event_id, user.id)
