import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import group as group_db
from app.models.group import Group, GroupMember, JoinPolicy, MemberRole
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    InviteLinkResponse,
    MemberRoleUpdate,
    PaginatedGroupResponse,
)


async def _require_member(db: AsyncSession, group_id: int, user_id: int) -> GroupMember:
    member = await group_db.get_member(db, group_id, user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this group",
        )
    return member


async def create_group(db: AsyncSession, owner_id: int, data: GroupCreate) -> Group:
    group = await group_db.create(db, owner_id, data)
    await group_db.add_member(db, group.id, owner_id, role=MemberRole.owner)
    return group


async def get_group(db: AsyncSession, group_id: int) -> Group:
    group = await group_db.get_by_id(db, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )
    return group


async def get_group_detail(db: AsyncSession, group_id: int) -> Group:
    group = await group_db.get_by_id_with_members(db, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )
    return group


async def list_my_groups(db: AsyncSession, user_id: int) -> list[Group]:
    return await group_db.list_by_user(db, user_id)


async def list_public_groups(
    db: AsyncSession, page: int, size: int
) -> PaginatedGroupResponse:
    offset = (page - 1) * size
    items = await group_db.list_public(db, offset, size)
    total = await group_db.count_public(db)
    return PaginatedGroupResponse(items=items, total=total, page=page, size=size)


async def update_group(
    db: AsyncSession, group_id: int, current_user_id: int, data: GroupUpdate
) -> Group:
    group = await get_group(db, group_id)
    member = await _require_member(db, group_id, current_user_id)
    if member.role not in (MemberRole.owner, MemberRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner or admin can update group",
        )
    return await group_db.update(db, group, data)


async def delete_group(db: AsyncSession, group_id: int, current_user_id: int) -> None:
    group = await get_group(db, group_id)
    if group.owner_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not the group owner"
        )
    await group_db.delete(db, group)


async def join_group(db: AsyncSession, group_id: int, user_id: int) -> None:
    group = await group_db.get_by_id(db, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )
    if group.join_policy == JoinPolicy.private:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This group requires an invite link to join",
        )
    existing = await group_db.get_member(db, group_id, user_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Already a member"
        )
    await group_db.add_member(db, group_id, user_id)


async def leave_group(db: AsyncSession, group_id: int, user_id: int) -> None:
    group = await group_db.get_by_id(db, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )
    if group.owner_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owner cannot leave the group; delete the group instead",
        )
    member = await group_db.get_member(db, group_id, user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Not a member"
        )
    await group_db.remove_member(db, group_id, user_id)


INVITE_TOKEN_TTL_DAYS = 7


async def generate_invite_token(
    db: AsyncSession, group_id: int, user_id: int
) -> InviteLinkResponse:
    group = await get_group(db, group_id)
    member = await _require_member(db, group_id, user_id)
    if member.role not in (MemberRole.owner, MemberRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner or admin can generate invite link",
        )
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(days=INVITE_TOKEN_TTL_DAYS)
    await group_db.set_invite_token(db, group, token, expires_at)
    return InviteLinkResponse(invite_token=token)


async def join_via_invite(db: AsyncSession, token: str, user_id: int) -> Group:
    group = await group_db.get_by_invite_token(db, token)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite token"
        )
    now = datetime.now(UTC)
    if group.invite_token_expires_at is None or group.invite_token_expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invite token has expired"
        )
    existing = await group_db.get_member(db, group.id, user_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Already a member"
        )
    await group_db.add_member(db, group.id, user_id)
    return group


async def remove_member(
    db: AsyncSession, group_id: int, current_user_id: int, target_user_id: int
) -> None:
    await get_group(db, group_id)
    requester = await _require_member(db, group_id, current_user_id)
    if requester.role not in (MemberRole.owner, MemberRole.admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner or admin can remove members",
        )
    target = await group_db.get_member(db, group_id, target_user_id)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user is not a member",
        )
    if target.role == MemberRole.owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the group owner",
        )
    if target.role == MemberRole.admin and requester.role != MemberRole.owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can remove an admin",
        )
    await group_db.remove_member(db, group_id, target_user_id)


async def update_member_role(
    db: AsyncSession,
    group_id: int,
    current_user_id: int,
    target_user_id: int,
    data: MemberRoleUpdate,
) -> GroupMember:
    group = await get_group(db, group_id)
    if group.owner_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can change roles",
        )
    if data.role == MemberRole.owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign owner role",
        )
    if target_user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )
    member = await group_db.get_member(db, group_id, target_user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user is not a member",
        )
    return await group_db.update_member_role(db, member, data.role)
