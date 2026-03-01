from fastapi import APIRouter, Depends

from app.api.deps import get_contest_service, get_current_user
from app.models.user import User
from app.schemas.contest import ContestCreate, ContestResponse, ContestUpdate
from app.services.contest import ContestService

router = APIRouter(prefix="/contests", tags=["contests"])


@router.post("", response_model=ContestResponse, status_code=201)
async def create_contest(
    data: ContestCreate,
    user: User = Depends(get_current_user),
    contest_service: ContestService = Depends(get_contest_service),
) -> ContestResponse:
    return await contest_service.create_contest(user.id, data)  # type: ignore[return-value]


@router.get("", response_model=list[ContestResponse])
async def list_contests(
    group_id: int,
    contest_service: ContestService = Depends(get_contest_service),
) -> list[ContestResponse]:
    return await contest_service.list_contests(group_id)  # type: ignore[return-value]


@router.get("/{contest_id}", response_model=ContestResponse)
async def get_contest(
    contest_id: int,
    contest_service: ContestService = Depends(get_contest_service),
) -> ContestResponse:
    return await contest_service.get_contest(contest_id)  # type: ignore[return-value]


@router.put("/{contest_id}", response_model=ContestResponse)
async def update_contest(
    contest_id: int,
    data: ContestUpdate,
    user: User = Depends(get_current_user),
    contest_service: ContestService = Depends(get_contest_service),
) -> ContestResponse:
    return await contest_service.update_contest(contest_id, user.id, data)  # type: ignore[return-value]


@router.delete("/{contest_id}", status_code=204)
async def delete_contest(
    contest_id: int,
    user: User = Depends(get_current_user),
    contest_service: ContestService = Depends(get_contest_service),
) -> None:
    await contest_service.delete_contest(contest_id, user.id)
