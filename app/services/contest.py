from fastapi import HTTPException, status

from app.models.contest import Contest
from app.repositories.contest import ContestRepository
from app.schemas.contest import ContestCreate, ContestUpdate


class ContestService:
    def __init__(self, contest_repo: ContestRepository) -> None:
        self.contest_repo = contest_repo

    async def create_contest(self, user_id: int, data: ContestCreate) -> Contest:
        return await self.contest_repo.create(user_id, data)

    async def get_contest(self, contest_id: int) -> Contest:
        contest = await self.contest_repo.get_by_id(contest_id)
        if not contest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contest not found",
            )
        return contest

    async def list_contests(self, group_id: int) -> list[Contest]:
        return await self.contest_repo.list_by_group(group_id)

    async def update_contest(
        self, contest_id: int, user_id: int, data: ContestUpdate
    ) -> Contest:
        contest = await self.get_contest(contest_id)
        if contest.created_by_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the contest creator can update it",
            )
        update_data = data.model_dump(exclude_unset=True)
        return await self.contest_repo.update(contest, update_data)

    async def delete_contest(self, contest_id: int, user_id: int) -> None:
        contest = await self.get_contest(contest_id)
        if contest.created_by_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the contest creator can delete it",
            )
        await self.contest_repo.delete(contest)
