from collections import defaultdict

from fastapi import HTTPException, status

from app.models.game_record import GameRecord
from app.models.group import Group, MemberRole, RankingType
from app.repositories.event import EventRepository
from app.repositories.game_record import GameRecordRepository
from app.repositories.group import GroupRepository
from app.schemas.game_record import (
    GameRecordCreate,
    GameRecordUpdate,
    MemberStatsResponse,
    PaginatedGameRecordResponse,
    PlacementCounts,
)
from app.utils.period import PeriodType, get_period_range


class GameRecordService:
    def __init__(
        self,
        game_record_repo: GameRecordRepository,
        group_repo: GroupRepository,
        event_repo: EventRepository,
    ) -> None:
        self.game_record_repo = game_record_repo
        self.group_repo = group_repo
        self.event_repo = event_repo

    async def _require_group_editor(self, group_id: int | None, user_id: int) -> None:
        """group_id 그룹에서 owner/admin인지 확인. 아니면 403."""
        if group_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Record has no group assigned",
            )
        member = await self.group_repo.get_member(group_id, user_id)
        if member is None or member.role not in (MemberRole.owner, MemberRole.admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only group owner or admin can modify game records",
            )

    async def create_game_record(
        self, created_by_id: int, data: GameRecordCreate
    ) -> GameRecord:
        if data.event_id is not None:
            event = await self.event_repo.get_by_id(data.event_id)
            if event and event.is_closed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot add records to a closed event",
                )
        if data.group_id is not None:
            member = await self.group_repo.get_member(data.group_id, created_by_id)
            if member is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must be a member of the group to create a game record",
                )
            player_ids = [
                data.east_player_id,
                data.south_player_id,
                data.west_player_id,
                data.north_player_id,
            ]
            member_ids = await self.group_repo.get_member_user_ids(
                data.group_id, player_ids
            )
            non_members = [pid for pid in player_ids if pid not in member_ids]
            if non_members:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Players {non_members} are not members of the group",
                )
        return await self.game_record_repo.create(created_by_id, data)

    async def _require_group_member(self, group_id: int | None, user_id: int) -> None:
        if group_id is None:
            return
        member = await self.group_repo.get_member(group_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this group",
            )

    async def _get_game_record(self, record_id: int) -> GameRecord:
        record = await self.game_record_repo.get_by_id(record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game record not found",
            )
        return record

    async def get_game_record(self, record_id: int, user_id: int) -> GameRecord:
        record = await self._get_game_record(record_id)
        await self._require_group_member(record.group_id, user_id)
        return record

    async def list_game_records(
        self,
        page: int,
        size: int,
        group_id: int | None,
        event_id: int | None,
        user_id: int,
    ) -> PaginatedGameRecordResponse:
        if group_id is not None:
            await self._require_group_member(group_id, user_id)
        elif event_id is not None:
            event = await self.event_repo.get_by_id(event_id)
            if event:
                await self._require_group_member(event.group_id, user_id)
        offset = (page - 1) * size
        items = await self.game_record_repo.list(offset, size, group_id, event_id)
        total = await self.game_record_repo.count(group_id, event_id)
        return PaginatedGameRecordResponse(
            items=items, total=total, page=page, size=size
        )

    async def update_game_record(
        self, record_id: int, current_user_id: int, data: GameRecordUpdate
    ) -> GameRecord:
        record = await self._get_game_record(record_id)
        await self._require_group_editor(record.group_id, current_user_id)
        directions = ("east", "south", "west", "north")
        player_ids = [
            getattr(data, f"{d}_player_id") or getattr(record, f"{d}_player_id")
            for d in directions
        ]
        if len(set(player_ids)) != 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All four players must be different",
            )
        # Validate point sum: merge provided points with existing record values
        points = [
            p if p is not None else getattr(record, f"{d}_point")
            for d, p in ((d, getattr(data, f"{d}_point")) for d in directions)
        ]
        has_any_point = any(getattr(data, f"{d}_point") is not None for d in directions)
        if has_any_point and sum(points) != 100000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sum of points must be 100000, got {sum(points)}",
            )
        return await self.game_record_repo.update(record, data)

    async def delete_game_record(self, record_id: int, current_user_id: int) -> None:
        record = await self._get_game_record(record_id)
        await self._require_group_editor(record.group_id, current_user_id)
        await self.game_record_repo.delete(record)

    async def get_member_stats(
        self,
        group_id: int,
        target_user_id: int,
        current_user_id: int,
        event_id: int | None = None,
        period: PeriodType = "all",
        offset: int = 0,
    ) -> MemberStatsResponse:
        """Calculate member stats within a group or specific event."""
        # Verify group exists
        group = await self.group_repo.get_by_id(group_id)
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found",
            )

        # Private group access check
        from app.models.group import JoinPolicy

        if group.join_policy == JoinPolicy.private:
            member = await self.group_repo.get_member(group_id, current_user_id)
            if not member:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only members can view private group stats",
                )

        # If event_id is given, verify it belongs to this group
        if event_id is not None:
            event = await self.event_repo.get_by_id(event_id)
            if not event or event.group_id != group_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found in this group",
                )

        # Calculate period date range
        date_range = get_period_range(
            period, offset, group.weekly_start_day, group.monthly_start_day
        )
        start_date = date_range[0] if date_range else None
        end_date = date_range[1] if date_range else None

        # Fetch all game records in scope
        records = await self.game_record_repo.list_by_group_with_events(
            group_id, event_id, start_date, end_date
        )

        # Calculate stats for all players
        player_stats = self._compute_player_stats(records, group, event_id)

        # Get target user's stats
        user_stats = player_stats.get(target_user_id)
        if user_stats is None:
            return MemberStatsResponse(
                total_games=0,
                rank=None,
                ranking_score=0.0,
                placement_counts=PlacementCounts(),
            )

        # Determine ranking type
        ranking_type = group.default_ranking_type
        if event_id is not None and event is not None:
            ranking_type = event.ranking_type

        # Sort all players to determine rank
        all_entries = list(player_stats.items())
        if ranking_type == RankingType.match_point:
            all_entries.sort(
                key=lambda x: (x[1]["match_point"], x[1]["total_score"]),
                reverse=True,
            )
            ranking_score = user_stats["match_point"]
        else:
            all_entries.sort(key=lambda x: x[1]["total_score"], reverse=True)
            ranking_score = user_stats["total_score"]

        rank = next(
            i + 1 for i, (uid, _) in enumerate(all_entries) if uid == target_user_id
        )

        return MemberStatsResponse(
            total_games=user_stats["game_count"],
            rank=rank,
            ranking_score=ranking_score,
            placement_counts=PlacementCounts(
                first=user_stats["placements"][0],
                second=user_stats["placements"][1],
                third=user_stats["placements"][2],
                fourth=user_stats["placements"][3],
            ),
        )

    @staticmethod
    def _compute_player_stats(
        records: list[GameRecord],
        group: Group,
        event_id: int | None,
    ) -> dict[int, dict]:
        """Compute ranking stats for all players from game records.

        Returns {user_id: {total_score, match_point, placements, game_count}}
        """
        default_uma = [
            group.default_uma_1st,
            group.default_uma_2nd,
            group.default_uma_3rd,
            group.default_uma_4th,
        ]
        default_scoring = [
            group.default_scoring_1st,
            group.default_scoring_2nd,
            group.default_scoring_3rd,
            group.default_scoring_4th,
        ]

        player_stats: dict[int, dict] = defaultdict(
            lambda: {
                "total_score": 0.0,
                "match_point": 0.0,
                "placements": [0, 0, 0, 0],
                "game_count": 0,
            }
        )

        for rec in records:
            event = rec.event
            if event:
                uma = [event.uma_1st, event.uma_2nd, event.uma_3rd, event.uma_4th]
                scoring = [
                    event.scoring_1st,
                    event.scoring_2nd,
                    event.scoring_3rd,
                    event.scoring_4th,
                ]
            else:
                uma = default_uma
                scoring = default_scoring

            seats = [
                (rec.east_player_id, rec.east_point),
                (rec.south_player_id, rec.south_point),
                (rec.west_player_id, rec.west_point),
                (rec.north_player_id, rec.north_point),
            ]
            # Sort by point descending (stable sort preserves seat order for ties)
            seats.sort(key=lambda x: x[1], reverse=True)

            for rank_idx, (player_id, point) in enumerate(seats):
                stats = player_stats[player_id]
                stats["total_score"] += (point - 25000) / 1000 + uma[rank_idx]
                stats["match_point"] += scoring[rank_idx]
                stats["placements"][rank_idx] += 1
                stats["game_count"] += 1

        return dict(player_stats)
