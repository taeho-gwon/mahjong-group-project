from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.models.group import Group, GroupMember, JoinPolicy, MemberRole
from app.repositories.base import BaseRepository
from app.schemas.group import GroupCreate, GroupUpdate


class GroupRepository(BaseRepository):
    async def create(self, owner_id: int, data: GroupCreate) -> Group:
        group = Group(
            name=data.name,
            description=data.description,
            join_policy=data.join_policy,
            owner_id=owner_id,
        )
        self.db.add(group)
        await self.db.commit()
        await self.db.refresh(group)
        return group

    async def get_by_id(self, group_id: int) -> Group | None:
        result = await self.db.execute(select(Group).where(Group.id == group_id))
        return result.scalar_one_or_none()

    async def get_by_id_with_members(self, group_id: int) -> Group | None:
        result = await self.db.execute(
            select(Group)
            .where(Group.id == group_id)
            .options(selectinload(Group.members).selectinload(GroupMember.user))
        )
        return result.scalar_one_or_none()

    async def list_public(self, offset: int, limit: int) -> list[Group]:
        result = await self.db.execute(
            select(Group)
            .where(Group.join_policy == JoinPolicy.public)
            .order_by(Group.id)
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_public(self) -> int:
        result = await self.db.execute(
            select(func.count()).where(Group.join_policy == JoinPolicy.public)
        )
        return result.scalar_one()

    async def list_by_user(self, user_id: int) -> list[Group]:
        result = await self.db.execute(
            select(Group)
            .join(GroupMember, GroupMember.group_id == Group.id)
            .where(GroupMember.user_id == user_id)
            .order_by(Group.id)
        )
        return list(result.scalars().all())

    async def update(self, group: Group, data: GroupUpdate) -> Group:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(group, field, value)
        await self.db.commit()
        await self.db.refresh(group)
        return group

    async def delete(self, group: Group) -> None:
        await self.db.delete(group)
        await self.db.commit()

    async def get_member(self, group_id: int, user_id: int) -> GroupMember | None:
        result = await self.db.execute(
            select(GroupMember).where(
                GroupMember.group_id == group_id, GroupMember.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def add_member(
        self,
        group_id: int,
        user_id: int,
        role: MemberRole = MemberRole.member,
    ) -> GroupMember:
        member = GroupMember(group_id=group_id, user_id=user_id, role=role)
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def update_member_role(
        self, member: GroupMember, role: MemberRole
    ) -> GroupMember:
        group_id = member.group_id
        user_id = member.user_id
        member.role = role
        await self.db.commit()
        stmt = (
            select(GroupMember)
            .where(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
            .options(selectinload(GroupMember.user))
            .execution_options(populate_existing=True)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def remove_member(self, group_id: int, user_id: int) -> None:
        member = await self.get_member(group_id, user_id)
        if member:
            await self.db.delete(member)
            await self.db.commit()

    async def get_by_invite_token(self, token: str) -> Group | None:
        result = await self.db.execute(select(Group).where(Group.invite_token == token))
        return result.scalar_one_or_none()

    async def set_invite_token(
        self, group: Group, token: str | None, expires_at: datetime | None
    ) -> Group:
        group.invite_token = token
        group.invite_token_expires_at = expires_at
        await self.db.commit()
        await self.db.refresh(group)
        return group
