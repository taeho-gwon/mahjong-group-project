from sqlalchemy import select

from app.models.announcement import Announcement
from app.repositories.base import BaseRepository


class AnnouncementRepository(BaseRepository):
    async def get_by_id(self, announcement_id: int) -> Announcement | None:
        result = await self.db.execute(
            select(Announcement).where(Announcement.id == announcement_id)
        )
        return result.scalar_one_or_none()

    async def list_active(self, offset: int, limit: int) -> list[Announcement]:
        result = await self.db.execute(
            select(Announcement)
            .where(Announcement.is_active.is_(True))
            .order_by(Announcement.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())
