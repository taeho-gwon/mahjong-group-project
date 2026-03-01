from sqlalchemy import select

from app.models.contest import Contest, ContestType, RankingType
from app.repositories.base import BaseRepository
from app.schemas.common import UmaFields
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

    async def create_default_aggregate(
        self, group_id: int, created_by_id: int, uma: UmaFields
    ) -> Contest:
        contest = Contest(
            name="전체 랭킹",
            contest_type=ContestType.aggregate,
            ranking_type=RankingType.score,
            group_id=group_id,
            created_by_id=created_by_id,
            is_default=True,
            uma_1st=uma.uma_1st,
            uma_2nd=uma.uma_2nd,
            uma_3rd=uma.uma_3rd,
            uma_4th=uma.uma_4th,
            scoring_1st=4,
            scoring_2nd=2,
            scoring_3rd=1,
            scoring_4th=0,
        )
        self.db.add(contest)
        await self.db.commit()
        await self.db.refresh(contest)
        return contest

    async def get_default_aggregate_by_group(
        self, group_id: int
    ) -> Contest | None:
        result = await self.db.execute(
            select(Contest).where(
                Contest.group_id == group_id,
                Contest.contest_type == ContestType.aggregate,
                Contest.is_default.is_(True),
            )
        )
        return result.scalar_one_or_none()
