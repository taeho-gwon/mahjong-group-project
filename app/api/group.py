from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.group import (
    GroupCreate,
    GroupDetailResponse,
    GroupResponse,
    GroupUpdate,
    InviteLinkResponse,
    JoinByInviteRequest,
    PaginatedGroupResponse,
)
from app.services import group as group_service

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    data: GroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GroupResponse:
    return await group_service.create_group(db, current_user.id, data)


@router.get("", response_model=PaginatedGroupResponse)
async def list_groups(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedGroupResponse:
    return await group_service.list_public_groups(db, page, size)


@router.post("/join-by-invite", response_model=GroupResponse)
async def join_by_invite(
    data: JoinByInviteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GroupResponse:
    return await group_service.join_via_invite(db, data.invite_token, current_user.id)


@router.get("/{group_id}", response_model=GroupDetailResponse)
async def get_group(
    group_id: int, db: AsyncSession = Depends(get_db)
) -> GroupDetailResponse:
    return await group_service.get_group_detail(db, group_id)


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: int,
    data: GroupUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GroupResponse:
    return await group_service.update_group(db, group_id, current_user.id, data)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await group_service.delete_group(db, group_id, current_user.id)


@router.post("/{group_id}/invite-link", response_model=InviteLinkResponse)
async def generate_invite_link(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InviteLinkResponse:
    return await group_service.generate_invite_token(db, group_id, current_user.id)


@router.post("/{group_id}/join", response_model=GroupResponse)
async def join_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GroupResponse:
    await group_service.join_group(db, group_id, current_user.id)
    return await group_service.get_group(db, group_id)


@router.delete("/{group_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await group_service.leave_group(db, group_id, current_user.id)


@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    group_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await group_service.remove_member(db, group_id, current_user.id, user_id)
