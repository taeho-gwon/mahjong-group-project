from sqlalchemy import select

from app.models.contest import Contest
from app.repositories.base import BaseRepository
from app.schemas.contest import ContestCreate


class ContestRepository(BaseRepository):
    async def create(self, created_by_id: int, data: ContestCreate) -> Contest:
        contest = Contest(
            created_by_id=created_by_id,
            **data.model_dump(),
        )
        self.db.add(contest)
        await self.db.commit()
        await self.db.refresh(contest)
        return contest

    async def get_by_id(self, contest_id: int) -> Contest | None:
        result = await self.db.execute(select(Contest).where(Contest.id == contest_id))
        return result.scalar_one_or_none()

    async def list_by_group(self, group_id: int) -> list[Contest]:
        result = await self.db.execute(
            select(Contest)
            .where(Contest.group_id == group_id)
            .order_by(Contest.created_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, contest: Contest, data: dict) -> Contest:
        for key, value in data.items():
            setattr(contest, key, value)
        await self.db.commit()
        await self.db.refresh(contest)
        return contest

    async def delete(self, contest: Contest) -> None:
        await self.db.delete(contest)
        await self.db.commit()
