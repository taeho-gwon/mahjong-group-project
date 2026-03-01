from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_user_service
from app.models.user import User
from app.schemas.user import UserProfileResponse
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service),
) -> UserProfileResponse:
    return await user_service.get_user_profile(user_id, current_user.id)
