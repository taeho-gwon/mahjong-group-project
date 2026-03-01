from fastapi import APIRouter, Depends, Query

from app.api.deps import get_announcement_service, get_current_user
from app.models.user import User
from app.schemas.announcement import AnnouncementResponse
from app.services.announcement import AnnouncementService

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("", response_model=list[AnnouncementResponse])
async def list_announcements(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    announcement_service: AnnouncementService = Depends(get_announcement_service),
) -> list[AnnouncementResponse]:
    return await announcement_service.list_announcements(page, size)


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement(
    announcement_id: int,
    user: User = Depends(get_current_user),
    announcement_service: AnnouncementService = Depends(get_announcement_service),
) -> AnnouncementResponse:
    return await announcement_service.get_announcement(announcement_id)
