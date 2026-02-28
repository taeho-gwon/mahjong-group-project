import secrets

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import group as group_db
from app.models.group import Group, JoinPolicy
from app.schemas.group import GroupCreate, GroupUpdate, InviteLinkResponse


async def create_group(db: AsyncSession, owner_id: int, data: GroupCreate) -> Group:
    group = await group_db.create(db, owner_id, data)
    await group_db.add_member(db, group.id, owner_id)
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


async def list_groups(db: AsyncSession) -> list[Group]:
    return await group_db.list_all(db)


async def update_group(
    db: AsyncSession, group_id: int, current_user_id: int, data: GroupUpdate
) -> Group:
    group = await get_group(db, group_id)
    if group.owner_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not the group owner"
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


async def generate_invite_token(
    db: AsyncSession, group_id: int, user_id: int
) -> InviteLinkResponse:
    group = await get_group(db, group_id)
    if group.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not the group owner"
        )
    token = secrets.token_urlsafe(32)
    await group_db.set_invite_token(db, group, token)
    return InviteLinkResponse(invite_token=token)


async def join_via_invite(db: AsyncSession, token: str, user_id: int) -> Group:
    group = await group_db.get_by_invite_token(db, token)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite token"
        )
    existing = await group_db.get_member(db, group.id, user_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Already a member"
        )
    await group_db.add_member(db, group.id, user_id)
    new_token = secrets.token_urlsafe(32)
    group = await group_db.set_invite_token(db, group, new_token)
    return group


async def remove_member(
    db: AsyncSession, group_id: int, current_user_id: int, target_user_id: int
) -> None:
    group = await group_db.get_by_id(db, group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )
    if group.owner_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not the group owner"
        )
    member = await group_db.get_member(db, group_id, target_user_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user is not a member",
        )
    await group_db.remove_member(db, group_id, target_user_id)
