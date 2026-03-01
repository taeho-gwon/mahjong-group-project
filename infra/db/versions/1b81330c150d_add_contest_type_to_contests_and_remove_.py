"""add_contest_type_to_contests_and_remove_uma_from_groups

Revision ID: 1b81330c150d
Revises: 81c4fdac3f3c
Create Date: 2026-03-01 16:40:24.311975

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1b81330c150d"
down_revision: str | Sequence[str] | None = "81c4fdac3f3c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

contesttype = sa.Enum("overall", "regular", "independent", name="contesttype")


def upgrade() -> None:
    """Add contest_type to contests; remove uma_* from groups."""
    contesttype.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "contests",
        sa.Column(
            "contest_type",
            contesttype,
            server_default="regular",
            nullable=False,
        ),
    )
    op.drop_column("groups", "uma_1st")
    op.drop_column("groups", "uma_2nd")
    op.drop_column("groups", "uma_3rd")
    op.drop_column("groups", "uma_4th")


def downgrade() -> None:
    """Re-add uma_* to groups; remove contest_type from contests."""
    op.add_column(
        "groups",
        sa.Column(
            "uma_1st",
            sa.INTEGER(),
            server_default=sa.text("30"),
            autoincrement=False,
            nullable=False,
        ),
    )
    op.add_column(
        "groups",
        sa.Column(
            "uma_2nd",
            sa.INTEGER(),
            server_default=sa.text("10"),
            autoincrement=False,
            nullable=False,
        ),
    )
    op.add_column(
        "groups",
        sa.Column(
            "uma_3rd",
            sa.INTEGER(),
            server_default=sa.text("'-10'::integer"),
            autoincrement=False,
            nullable=False,
        ),
    )
    op.add_column(
        "groups",
        sa.Column(
            "uma_4th",
            sa.INTEGER(),
            server_default=sa.text("'-30'::integer"),
            autoincrement=False,
            nullable=False,
        ),
    )
    op.drop_column("contests", "contest_type")
    contesttype.drop(op.get_bind(), checkfirst=True)
