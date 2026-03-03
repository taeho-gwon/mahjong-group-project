from fastapi import HTTPException, status

from app.repositories.group import GroupRepository
from app.repositories.user import UserRepository
from app.schemas.user import SharedGroupInfo, UserProfileResponse


class UserService:
    def __init__(self, user_repo: UserRepository, group_repo: GroupRepository) -> None:
        self.user_repo = user_repo
        self.group_repo = group_repo

    async def get_user_profile(
        self, target_user_id: int, viewer_user_id: int
    ) -> UserProfileResponse:
        user = await self.user_repo.get_by_id(target_user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        shared = await self.group_repo.list_shared_groups(
            viewer_user_id, target_user_id
        )
        return UserProfileResponse(
            id=user.id,
            username=user.username,
            nickname=user.nickname,
            created_at=user.created_at,
            shared_groups=[SharedGroupInfo.model_validate(g) for g in shared],
        )
