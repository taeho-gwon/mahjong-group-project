from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.group import Group, GroupMember, JoinPolicy, MemberRole
from app.schemas.group import GroupCreate, GroupUpdate


async def create(db: AsyncSession, owner_id: int, data: GroupCreate) -> Group:
    group = Group(
        name=data.name,
        description=data.description,
        owner_id=owner_id,
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return group


async def get_by_id(db: AsyncSession, group_id: int) -> Group | None:
    result = await db.execute(select(Group).where(Group.id == group_id))
    return result.scalar_one_or_none()


async def get_by_id_with_members(db: AsyncSession, group_id: int) -> Group | None:
    result = await db.execute(
        select(Group)
        .where(Group.id == group_id)
        .options(selectinload(Group.members).selectinload(GroupMember.user))
    )
    return result.scalar_one_or_none()


async def list_all(db: AsyncSession) -> list[Group]:
    result = await db.execute(select(Group))
    return list(result.scalars().all())


async def list_public(db: AsyncSession, offset: int, limit: int) -> list[Group]:
    result = await db.execute(
        select(Group)
        .where(Group.join_policy == JoinPolicy.public)
        .order_by(Group.id)
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_public(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count()).where(Group.join_policy == JoinPolicy.public)
    )
    return result.scalar_one()


async def list_by_user(db: AsyncSession, user_id: int) -> list[Group]:
    result = await db.execute(
        select(Group)
        .join(GroupMember, GroupMember.group_id == Group.id)
        .where(GroupMember.user_id == user_id)
        .order_by(Group.id)
    )
    return list(result.scalars().all())


async def update(db: AsyncSession, group: Group, data: GroupUpdate) -> Group:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(group, field, value)
    await db.commit()
    await db.refresh(group)
    return group


async def delete(db: AsyncSession, group: Group) -> None:
    await db.delete(group)
    await db.commit()


async def get_member(
    db: AsyncSession, group_id: int, user_id: int
) -> GroupMember | None:
    result = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id, GroupMember.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def add_member(
    db: AsyncSession,
    group_id: int,
    user_id: int,
    role: MemberRole = MemberRole.member,
) -> GroupMember:
    member = GroupMember(group_id=group_id, user_id=user_id, role=role)
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


async def update_member_role(
    db: AsyncSession, member: GroupMember, role: MemberRole
) -> GroupMember:
    member.role = role
    await db.commit()
    await db.refresh(member)
    return member


async def remove_member(db: AsyncSession, group_id: int, user_id: int) -> None:
    member = await get_member(db, group_id, user_id)
    if member:
        await db.delete(member)
        await db.commit()


async def get_by_invite_token(db: AsyncSession, token: str) -> Group | None:
    result = await db.execute(select(Group).where(Group.invite_token == token))
    return result.scalar_one_or_none()


async def set_invite_token(
    db: AsyncSession, group: Group, token: str | None, expires_at: datetime | None
) -> Group:
    group.invite_token = token
    group.invite_token_expires_at = expires_at
    await db.commit()
    await db.refresh(group)
    return group
