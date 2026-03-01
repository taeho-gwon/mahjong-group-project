"""
Seed script: Clear all data and create test users/groups/contests.

Groups:
  - Group A: testuser1 (owner), testuser2~6 (member)
  - Group B: testuser5 (owner), testuser6~10 (member)

Contests (Group A):
  - 정규 시즌 (score ranking, default uma)
  - 승점제 리그 (match_point ranking)
"""

import asyncio

from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.models.contest import Contest, RankingType
from app.models.game_record import GameRecord  # noqa: F401 (ensure table registered)
from app.models.group import Group, GroupMember, JoinPolicy, MemberRole
from app.models.user import User
from app.utils.security import hash_password

PASSWORD = "testpass123"
NUM_USERS = 10

GROUP_A_MEMBERS = list(range(1, 7))   # testuser1 ~ testuser6
GROUP_B_MEMBERS = list(range(5, 11))  # testuser5 ~ testuser10


async def main() -> None:
    async with AsyncSessionLocal() as db:
        # 1. Clear all tables (FK order)
        await db.execute(text("DELETE FROM game_records"))
        await db.execute(text("DELETE FROM contests"))
        await db.execute(text("DELETE FROM group_members"))
        await db.execute(text("DELETE FROM groups"))
        await db.execute(text("DELETE FROM users"))
        await db.commit()
        print("DB cleared.")

        # 2. Create 10 test users
        hashed = hash_password(PASSWORD)
        users: list[User] = []
        for i in range(1, NUM_USERS + 1):
            user = User(username=f"testuser{i}", hashed_password=hashed)
            db.add(user)
            users.append(user)
        await db.commit()
        for u in users:
            await db.refresh(u)
        print(f"Created {NUM_USERS} users: testuser1 ~ testuser{NUM_USERS}")

        user_map = {i + 1: users[i] for i in range(NUM_USERS)}

        # 3. Create Group A (testuser1 as owner, testuser1~6)
        group_a_owner = user_map[GROUP_A_MEMBERS[0]]
        group_a = Group(
            name="테스트 그룹 A",
            description="testuser1~6 그룹",
            owner_id=group_a_owner.id,
            join_policy=JoinPolicy.public,
        )
        db.add(group_a)
        await db.commit()
        await db.refresh(group_a)

        for idx, uid in enumerate(GROUP_A_MEMBERS):
            role = MemberRole.owner if idx == 0 else MemberRole.member
            db.add(GroupMember(group_id=group_a.id, user_id=user_map[uid].id, role=role))
        await db.commit()
        print(f"Created Group A (id={group_a.id}): members {GROUP_A_MEMBERS}")

        # 4. Create Group B (testuser5 as owner, testuser5~10)
        group_b_owner = user_map[GROUP_B_MEMBERS[0]]
        group_b = Group(
            name="테스트 그룹 B",
            description="testuser5~10 그룹",
            owner_id=group_b_owner.id,
            join_policy=JoinPolicy.public,
        )
        db.add(group_b)
        await db.commit()
        await db.refresh(group_b)

        for idx, uid in enumerate(GROUP_B_MEMBERS):
            role = MemberRole.owner if idx == 0 else MemberRole.member
            db.add(GroupMember(group_id=group_b.id, user_id=user_map[uid].id, role=role))
        await db.commit()
        print(f"Created Group B (id={group_b.id}): members {GROUP_B_MEMBERS}")

        # 5. Create contests for Group A
        contest_a1 = Contest(
            name="정규 시즌",
            group_id=group_a.id,
            created_by_id=group_a_owner.id,
            ranking_type=RankingType.score,
        )
        contest_a2 = Contest(
            name="승점제 리그",
            group_id=group_a.id,
            created_by_id=group_a_owner.id,
            ranking_type=RankingType.match_point,
        )
        db.add(contest_a1)
        db.add(contest_a2)
        await db.commit()
        await db.refresh(contest_a1)
        await db.refresh(contest_a2)
        print(f"Created Contest '정규 시즌' (id={contest_a1.id}, score ranking)")
        print(f"Created Contest '승점제 리그' (id={contest_a2.id}, match_point ranking)")

        print("\nDone! Password for all users:", PASSWORD)


if __name__ == "__main__":
    asyncio.run(main())
