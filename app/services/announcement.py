from fastapi import HTTPException, status

from app.models.announcement import Announcement
from app.repositories.announcement import AnnouncementRepository


class AnnouncementService:
    def __init__(self, announcement_repo: AnnouncementRepository) -> None:
        self.announcement_repo = announcement_repo

    async def get_announcement(self, announcement_id: int) -> Announcement:
        announcement = await self.announcement_repo.get_by_id(announcement_id)
        if not announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found",
            )
        return announcement

    async def list_announcements(self, page: int, size: int) -> list[Announcement]:
        offset = (page - 1) * size
        return await self.announcement_repo.list_active(offset, size)
