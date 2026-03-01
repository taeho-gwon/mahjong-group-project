import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from app.config import settings
from app.models.group import Group, GroupMember, JoinPolicy, MemberRole
from app.repositories.contest import ContestRepository
from app.repositories.group import GroupRepository
from app.schemas.group import (
    GroupCreate,
    GroupUpdate,
    InviteLinkResponse,
    MemberRoleUpdate,
    PaginatedGroupResponse,
)

INVITE_TOKEN_TTL_DAYS = 7


class GroupService:
    def __init__(
        self, group_repo: GroupRepository, contest_repo: ContestRepository
    ) -> None:
        self.group_repo = group_repo
        self.contest_repo = contest_repo

    async def _require_member(self, group_id: int, user_id: int) -> GroupMember:
        member = await self.group_repo.get_member(group_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this group",
            )
        return member

    async def create_group(self, owner_id: int, data: GroupCreate) -> Group:
        group = await self.group_repo.create(owner_id, data)
        await self.group_repo.add_member(group.id, owner_id, role=MemberRole.owner)
        await self.contest_repo.create_default_aggregate(group.id, owner_id, data)
        return group

    async def get_group(self, group_id: int) -> Group:
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
            )
        return group

    async def get_group_detail(self, group_id: int) -> Group:
        group = await self.group_repo.get_by_id_with_members(group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
            )
        return group

    async def list_my_groups(self, user_id: int) -> list[Group]:
        return await self.group_repo.list_by_user(user_id)

    async def list_public_groups(self, page: int, size: int) -> PaginatedGroupResponse:
        offset = (page - 1) * size
        items = await self.group_repo.list_public(offset, size)
        total = await self.group_repo.count_public()
        return PaginatedGroupResponse(items=items, total=total, page=page, size=size)

    async def update_group(
        self, group_id: int, current_user_id: int, data: GroupUpdate
    ) -> Group:
        group = await self.get_group(group_id)
        member = await self._require_member(group_id, current_user_id)
        if member.role not in (MemberRole.owner, MemberRole.admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owner or admin can update group",
            )
        return await self.group_repo.update(group, data)

    async def delete_group(self, group_id: int, current_user_id: int) -> None:
        group = await self.get_group(group_id)
        if group.owner_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Not the group owner"
            )
        await self.group_repo.delete(group)

    async def join_group(self, group_id: int, user_id: int) -> None:
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
            )
        if group.join_policy == JoinPolicy.private:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This group requires an invite link to join",
            )
        existing = await self.group_repo.get_member(group_id, user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Already a member"
            )
        await self.group_repo.add_member(group_id, user_id)

    async def leave_group(self, group_id: int, user_id: int) -> None:
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
            )
        if group.owner_id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Owner cannot leave the group; delete the group instead",
            )
        member = await self.group_repo.get_member(group_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Not a member"
            )
        await self.group_repo.remove_member(group_id, user_id)

    async def generate_invite_token(
        self, group_id: int, user_id: int
    ) -> InviteLinkResponse:
        group = await self.get_group(group_id)
        member = await self._require_member(group_id, user_id)
        if member.role not in (MemberRole.owner, MemberRole.admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owner or admin can generate invite link",
            )
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(UTC) + timedelta(days=INVITE_TOKEN_TTL_DAYS)
        await self.group_repo.set_invite_token(group, token, expires_at)
        base_url = settings.allowed_origins[0].rstrip("/")
        invite_url = f"{base_url}/join?token={token}"
        return InviteLinkResponse(invite_url=invite_url, expires_at=expires_at)

    async def join_via_invite(self, token: str, user_id: int) -> Group:
        group = await self.group_repo.get_by_invite_token(token)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite token"
            )
        now = datetime.now(UTC)
        if group.invite_token_expires_at is None or group.invite_token_expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invite token has expired"
            )
        existing = await self.group_repo.get_member(group.id, user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Already a member"
            )
        await self.group_repo.add_member(group.id, user_id)
        return group

    async def remove_member(
        self, group_id: int, current_user_id: int, target_user_id: int
    ) -> None:
        await self.get_group(group_id)
        requester = await self._require_member(group_id, current_user_id)
        if requester.role not in (MemberRole.owner, MemberRole.admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owner or admin can remove members",
            )
        target = await self.group_repo.get_member(group_id, target_user_id)
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
        if target.role == MemberRole.admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove an admin",
            )
        await self.group_repo.remove_member(group_id, target_user_id)

    async def update_member_role(
        self,
        group_id: int,
        current_user_id: int,
        target_user_id: int,
        data: MemberRoleUpdate,
    ) -> GroupMember:
        group = await self.get_group(group_id)
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
        member = await self.group_repo.get_member(group_id, target_user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target user is not a member",
            )
        return await self.group_repo.update_member_role(member, data.role)
