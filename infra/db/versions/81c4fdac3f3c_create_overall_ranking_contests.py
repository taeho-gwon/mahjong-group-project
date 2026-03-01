"""create_overall_ranking_contests

Revision ID: 81c4fdac3f3c
Revises: efffe4263d09
Create Date: 2026-03-01 11:17:49.209758

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "81c4fdac3f3c"
down_revision: Union[str, Sequence[str], None] = "efffe4263d09"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """그룹별 '전체 랭킹' contest 생성 + game_records contest_id 업데이트."""
    conn = op.get_bind()

    # 그룹별 '전체 랭킹' contest 생성
    conn.execute(
        sa.text(
            """
            INSERT INTO contests (
                name, group_id, created_by_id, ranking_type,
                uma_1st, uma_2nd, uma_3rd, uma_4th,
                scoring_1st, scoring_2nd, scoring_3rd, scoring_4th,
                created_at, updated_at
            )
            SELECT
                '전체 랭킹', id, owner_id, 'score',
                uma_1st, uma_2nd, uma_3rd, uma_4th,
                4, 2, 1, 0,
                created_at, updated_at
            FROM groups
            """
        )
    )

    # contest_id = NULL인 game_records를 해당 그룹의 '전체 랭킹' contest로 업데이트
    conn.execute(
        sa.text(
            """
            UPDATE game_records
            SET contest_id = (
                SELECT c.id
                FROM contests c
                WHERE c.group_id = game_records.group_id
                  AND c.name = '전체 랭킹'
            )
            WHERE contest_id IS NULL
              AND group_id IS NOT NULL
            """
        )
    )


def downgrade() -> None:
    """'전체 랭킹' contest 삭제 + game_records contest_id NULL로 복원."""
    conn = op.get_bind()

    # '전체 랭킹' contest에 속한 game_records를 NULL로 복원
    conn.execute(
        sa.text(
            """
            UPDATE game_records
            SET contest_id = NULL
            WHERE contest_id IN (
                SELECT id FROM contests WHERE name = '전체 랭킹'
            )
            """
        )
    )

    # '전체 랭킹' contest 삭제
    conn.execute(
        sa.text(
            """
            DELETE FROM contests WHERE name = '전체 랭킹'
            """
        )
    )
