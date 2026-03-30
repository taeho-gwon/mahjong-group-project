from typing import Literal

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_game_record_service, get_group_service
from app.models.user import User
from app.schemas.game_record import GroupRankingResponse, MemberStatsResponse
from app.schemas.group import (
    GroupCreate,
    GroupDetailResponse,
    GroupResponse,
    GroupUpdate,
    InviteLinkResponse,
    JoinByInviteRequest,
    JoinGroupRequest,
    MemberInfo,
    MemberRoleUpdate,
    NicknameUpdate,
    PaginatedGroupResponse,
)
from app.services.game_record import GameRecordService
from app.services.group import GroupService

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    data: GroupCreate,
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> GroupResponse:
    return await group_service.create_group(current_user.id, data)


@router.get("", response_model=PaginatedGroupResponse)
async def list_groups(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    group_service: GroupService = Depends(get_group_service),
) -> PaginatedGroupResponse:
    return await group_service.list_public_groups(page, size)


@router.get("/me", response_model=list[GroupResponse])
async def list_my_groups(
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> list[GroupResponse]:
    return await group_service.list_my_groups(current_user.id)


@router.post("/join-by-invite", response_model=GroupResponse)
async def join_by_invite(
    data: JoinByInviteRequest,
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> GroupResponse:
    return await group_service.join_via_invite(
        data.invite_token, current_user.id, data.nickname
    )


@router.get("/{group_id}", response_model=GroupDetailResponse)
async def get_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> GroupDetailResponse:
    return await group_service.get_group_detail(group_id, current_user.id)


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: int,
    data: GroupUpdate,
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> GroupResponse:
    return await group_service.update_group(group_id, current_user.id, data)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> None:
    await group_service.delete_group(group_id, current_user.id)


@router.post("/{group_id}/invite-link", response_model=InviteLinkResponse)
async def generate_invite_link(
    group_id: int,
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> InviteLinkResponse:
    return await group_service.generate_invite_token(group_id, current_user.id)


@router.post("/{group_id}/join", response_model=GroupResponse)
async def join_group(
    group_id: int,
    data: JoinGroupRequest | None = None,
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> GroupResponse:
    nickname = data.nickname if data else None
    await group_service.join_group(group_id, current_user.id, nickname)
    return await group_service.get_group(group_id)


@router.delete("/{group_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> None:
    await group_service.leave_group(group_id, current_user.id)


@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    group_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> None:
    await group_service.remove_member(group_id, current_user.id, user_id)


@router.put("/{group_id}/members/{user_id}/nickname", response_model=MemberInfo)
async def update_member_nickname(
    group_id: int,
    user_id: int,
    data: NicknameUpdate,
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> MemberInfo:
    return await group_service.update_member_nickname(
        group_id, current_user.id, user_id, data.nickname
    )


@router.put("/{group_id}/members/{user_id}/role", response_model=MemberInfo)
async def update_member_role(
    group_id: int,
    user_id: int,
    data: MemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service),
) -> MemberInfo:
    return await group_service.update_member_role(
        group_id, current_user.id, user_id, data
    )


@router.get("/{group_id}/ranking", response_model=GroupRankingResponse)
async def get_group_ranking(
    group_id: int,
    period: Literal["daily", "weekly", "monthly", "all"] = Query(default="all"),
    offset: int = Query(default=0),
    current_user: User = Depends(get_current_user),
    game_record_service: GameRecordService = Depends(get_game_record_service),
) -> GroupRankingResponse:
    return await game_record_service.get_group_ranking(
        group_id, current_user.id, period, offset
    )


@router.get("/{group_id}/members/{user_id}/stats", response_model=MemberStatsResponse)
async def get_member_stats(
    group_id: int,
    user_id: int,
    event_id: int | None = Query(default=None),
    period: Literal["daily", "weekly", "monthly", "all"] = Query(default="all"),
    offset: int = Query(default=0),
    current_user: User = Depends(get_current_user),
    game_record_service: GameRecordService = Depends(get_game_record_service),
) -> MemberStatsResponse:
    return await game_record_service.get_member_stats(
        group_id, user_id, current_user.id, event_id, period, offset
    )
