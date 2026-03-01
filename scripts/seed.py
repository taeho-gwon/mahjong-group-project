"""
Seed script: Clear all data and create test dataset.

Users:   testuser1 ~ testuser30
Group A: testuser1  (owner) + testuser1~20
Group B: testuser11 (owner) + testuser11~30

Contests per group:
  - overall     (contest_type=overall,      ranking_type=score)
  - 정규 시즌   (contest_type=regular,      ranking_type=score)
  - 독립 리그   (contest_type=independent,  ranking_type=match_point)

Game records per group:
  - 10 games  contest_id=NULL     (overall에 집계됨)
  - 20 games  contest_id=regular
  - 10 games  contest_id=independent
"""

import asyncio
import random

from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.models.contest import Contest, ContestType, RankingType
from app.models.game_record import GameRecord
from app.models.group import Group, GroupMember, JoinPolicy, MemberRole
from app.models.user import User
from app.utils.security import hash_password

PASSWORD = "testpass123"
NUM_USERS = 30
SCORE_TOTAL = 100_000

GROUP_A_MEMBERS = list(range(1, 21))   # testuser1~20
GROUP_B_MEMBERS = list(range(11, 31))  # testuser11~30


def random_scores() -> tuple[int, int, int, int]:
    """4명 점수 (100 단위), 합계 SCORE_TOTAL."""
    unit = SCORE_TOTAL // 100
    offset = 300
    pool = unit + 4 * offset
    cuts = sorted(random.sample(range(1, pool), 3))
    parts = [cuts[0], cuts[1] - cuts[0], cuts[2] - cuts[1], pool - cuts[2]]
    scores = [(p - offset) * 100 for p in parts]
    random.shuffle(scores)
    assert sum(scores) == SCORE_TOTAL
    return tuple(scores)  # type: ignore[return-value]


def make_records(
    group: Group,
    members: list[User],
    owner: User,
    contest_id: int | None,
    n: int,
) -> list[GameRecord]:
    records = []
    for _ in range(n):
        e, s, w, no = random.sample(members, 4)
        ep, sp, wp, np_ = random_scores()
        records.append(GameRecord(
            group_id=group.id,
            contest_id=contest_id,
            east_player_id=e.id,
            south_player_id=s.id,
            west_player_id=w.id,
            north_player_id=no.id,
            east_point=ep,
            south_point=sp,
            west_point=wp,
            north_point=np_,
            created_by_id=owner.id,
        ))
    return records


async def setup_group(
    db,
    name: str,
    description: str,
    member_indices: list[int],
    user_map: dict[int, User],
) -> None:
    owner = user_map[member_indices[0]]

    group = Group(
        name=name,
        description=description,
        owner_id=owner.id,
        join_policy=JoinPolicy.public,
    )
    db.add(group)
    await db.commit()
    await db.refresh(group)

    for idx, uid in enumerate(member_indices):
        role = MemberRole.owner if idx == 0 else MemberRole.member
        db.add(GroupMember(group_id=group.id, user_id=user_map[uid].id, role=role))
    await db.commit()

    members = [user_map[uid] for uid in member_indices]
    print(f"  Created '{name}' (id={group.id}), {len(members)} members")

    # Contests
    overall = Contest(
        name="전체 랭킹",
        group_id=group.id,
        created_by_id=owner.id,
        contest_type=ContestType.overall,
        ranking_type=RankingType.score,
    )
    regular = Contest(
        name="정규 시즌",
        group_id=group.id,
        created_by_id=owner.id,
        contest_type=ContestType.regular,
        ranking_type=RankingType.score,
    )
    indep = Contest(
        name="독립 리그",
        group_id=group.id,
        created_by_id=owner.id,
        contest_type=ContestType.independent,
        ranking_type=RankingType.match_point,
    )
    db.add_all([overall, regular, indep])
    await db.commit()
    for c in [overall, regular, indep]:
        await db.refresh(c)
    print(f"    Contests: overall(id={overall.id}), regular(id={regular.id}), indep(id={indep.id})")

    # Game records
    records = (
        make_records(group, members, owner, None,        10) +  # null (overall 집계)
        make_records(group, members, owner, regular.id,  20) +  # regular
        make_records(group, members, owner, indep.id,    10)    # independent
    )
    db.add_all(records)
    await db.commit()
    print(f"    Game records: null×10, regular×20, indep×10 → 총 {len(records)}경기")


async def main() -> None:
    async with AsyncSessionLocal() as db:
        # 1. Clear all
        await db.execute(text("DELETE FROM game_records"))
        await db.execute(text("DELETE FROM contests"))
        await db.execute(text("DELETE FROM group_members"))
        await db.execute(text("DELETE FROM groups"))
        await db.execute(text("DELETE FROM users"))
        await db.commit()
        print("DB cleared.")

        # 2. Create 30 users
        hashed = hash_password(PASSWORD)
        users: list[User] = []
        for i in range(1, NUM_USERS + 1):
            u = User(username=f"testuser{i}", hashed_password=hashed)
            db.add(u)
            users.append(u)
        await db.commit()
        for u in users:
            await db.refresh(u)
        user_map = {i + 1: users[i] for i in range(NUM_USERS)}
        print(f"Created {NUM_USERS} users: testuser1 ~ testuser{NUM_USERS}")

        # 3. Group A: testuser1~20
        print("\n[Group A]")
        await setup_group(db, "테스트 그룹 A", "testuser1~20 그룹", GROUP_A_MEMBERS, user_map)

        # 4. Group B: testuser11~30
        print("\n[Group B]")
        await setup_group(db, "테스트 그룹 B", "testuser11~30 그룹", GROUP_B_MEMBERS, user_map)

        print(f"\nDone! Password for all users: {PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
