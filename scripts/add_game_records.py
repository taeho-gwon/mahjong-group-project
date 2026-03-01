"""
Add random game records to Group A contests.
Each contest: 20 games, 4 random players from group members, scores sum to 100,000.
"""

import asyncio
import random

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.contest import Contest
from app.models.game_record import GameRecord
from app.models.group import Group, GroupMember
from app.models.user import User

NUM_RECORDS = 20
SCORE_TOTAL = 100_000
GROUP_NAME = "테스트 그룹 A"
CONTEST_NAMES = ["정규 시즌", "승점제 리그"]


def random_scores() -> tuple[int, int, int, int]:
    """Generate 4 scores (multiples of 100) that sum to SCORE_TOTAL."""
    unit = SCORE_TOTAL // 100  # 1000 units
    offset = 300
    pool = unit + 4 * offset
    cuts = sorted(random.sample(range(1, pool), 3))
    parts = [cuts[0], cuts[1] - cuts[0], cuts[2] - cuts[1], pool - cuts[2]]
    scores = [(p - offset) * 100 for p in parts]
    random.shuffle(scores)
    assert sum(scores) == SCORE_TOTAL
    return tuple(scores)  # type: ignore[return-value]


async def main() -> None:
    async with AsyncSessionLocal() as db:
        # Find Group A
        result = await db.execute(select(Group).where(Group.name == GROUP_NAME))
        group = result.scalar_one_or_none()
        if not group:
            print(f"Group '{GROUP_NAME}' not found. Run seed.py first.")
            return

        # Get members
        result = await db.execute(
            select(User)
            .join(GroupMember, GroupMember.user_id == User.id)
            .where(GroupMember.group_id == group.id)
        )
        members = list(result.scalars().all())
        if len(members) < 4:
            print("Not enough members (need at least 4).")
            return
        print(f"Group A members: {[m.username for m in members]}")

        # Find contests
        result = await db.execute(
            select(Contest).where(
                Contest.group_id == group.id,
                Contest.name.in_(CONTEST_NAMES),
            )
        )
        contests = list(result.scalars().all())
        found_names = {c.name for c in contests}
        for name in CONTEST_NAMES:
            if name not in found_names:
                print(f"Contest '{name}' not found.")
                return

        # Add records per contest
        owner = next(m for m in members if m.id == group.owner_id)
        total = 0
        for contest in contests:
            print(f"\n[{contest.name}] (id={contest.id}, {contest.ranking_type})")
            for i in range(NUM_RECORDS):
                players = random.sample(members, 4)
                east, south, west, north = players
                e_pt, s_pt, w_pt, n_pt = random_scores()
                db.add(GameRecord(
                    group_id=group.id,
                    contest_id=contest.id,
                    east_player_id=east.id,
                    south_player_id=south.id,
                    west_player_id=west.id,
                    north_player_id=north.id,
                    east_point=e_pt,
                    south_point=s_pt,
                    west_point=w_pt,
                    north_point=n_pt,
                    created_by_id=owner.id,
                ))
                print(
                    f"  [{i+1:2d}] {east.username}({e_pt:+,}) "
                    f"{south.username}({s_pt:+,}) "
                    f"{west.username}({w_pt:+,}) "
                    f"{north.username}({n_pt:+,})"
                )
                total += 1

        await db.commit()
        print(f"\n총 {total}개의 게임 결과가 추가되었습니다.")


if __name__ == "__main__":
    asyncio.run(main())
