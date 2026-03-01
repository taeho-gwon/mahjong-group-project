"""initial_schema

Revision ID: e527fa9f2984
Revises:
Create Date: 2026-03-01 21:23:16.572126

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e527fa9f2984"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column(
            "hashed_password", sa.String(length=255), nullable=False
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_users_email"), "users", ["email"], unique=True
    )
    op.create_index(
        op.f("ix_users_id"), "users", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_users_username"), "users", ["username"], unique=True
    )

    op.create_table(
        "groups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column(
            "join_policy",
            sa.Enum("public", "private", name="joinpolicy"),
            server_default="public",
            nullable=False,
        ),
        sa.Column("invite_token", sa.String(), nullable=True),
        sa.Column(
            "invite_token_expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_groups_id"), "groups", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_groups_invite_token"),
        "groups",
        ["invite_token"],
        unique=True,
    )
    op.create_index(
        op.f("ix_groups_name"), "groups", ["name"], unique=False
    )
    op.create_index(
        op.f("ix_groups_owner_id"), "groups", ["owner_id"], unique=False
    )

    op.create_table(
        "contests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=True),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.Column(
            "ranking_type",
            sa.Enum("score", "match_point", name="rankingtype"),
            server_default="score",
            nullable=False,
        ),
        sa.Column(
            "contest_type",
            sa.Enum(
                "aggregate", "regular", "independent",
                name="contesttype",
            ),
            server_default="regular",
            nullable=False,
        ),
        sa.Column(
            "period_start",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "period_end",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "is_default",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
        sa.Column(
            "uma_1st",
            sa.Integer(),
            server_default="30",
            nullable=False,
        ),
        sa.Column(
            "uma_2nd",
            sa.Integer(),
            server_default="10",
            nullable=False,
        ),
        sa.Column(
            "uma_3rd",
            sa.Integer(),
            server_default="-10",
            nullable=False,
        ),
        sa.Column(
            "uma_4th",
            sa.Integer(),
            server_default="-30",
            nullable=False,
        ),
        sa.Column(
            "scoring_1st",
            sa.Integer(),
            server_default="4",
            nullable=False,
        ),
        sa.Column(
            "scoring_2nd",
            sa.Integer(),
            server_default="2",
            nullable=False,
        ),
        sa.Column(
            "scoring_3rd",
            sa.Integer(),
            server_default="1",
            nullable=False,
        ),
        sa.Column(
            "scoring_4th",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["group_id"], ["groups.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_contests_created_by_id"),
        "contests",
        ["created_by_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_contests_group_id"),
        "contests",
        ["group_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_contests_id"), "contests", ["id"], unique=False
    )

    op.create_table(
        "group_members",
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "role",
            sa.Enum("owner", "admin", "member", name="memberrole"),
            server_default="member",
            nullable=False,
        ),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["group_id"], ["groups.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("group_id", "user_id"),
    )

    op.create_table(
        "game_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=True),
        sa.Column("east_player_id", sa.Integer(), nullable=False),
        sa.Column("south_player_id", sa.Integer(), nullable=False),
        sa.Column("west_player_id", sa.Integer(), nullable=False),
        sa.Column("north_player_id", sa.Integer(), nullable=False),
        sa.Column("east_point", sa.Integer(), nullable=False),
        sa.Column("south_point", sa.Integer(), nullable=False),
        sa.Column("west_point", sa.Integer(), nullable=False),
        sa.Column("north_point", sa.Integer(), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=False),
        sa.Column("contest_id", sa.Integer(), nullable=True),
        sa.Column("game_link", sa.String(length=500), nullable=True),
        sa.Column(
            "played_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["contest_id"], ["contests.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["east_player_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["group_id"], ["groups.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["north_player_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["south_player_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["west_player_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_game_records_contest_id"),
        "game_records",
        ["contest_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_game_records_created_by_id"),
        "game_records",
        ["created_by_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_game_records_east_player_id"),
        "game_records",
        ["east_player_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_game_records_group_id"),
        "game_records",
        ["group_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_game_records_id"),
        "game_records",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_game_records_north_player_id"),
        "game_records",
        ["north_player_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_game_records_south_player_id"),
        "game_records",
        ["south_player_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_game_records_west_player_id"),
        "game_records",
        ["west_player_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_game_records_west_player_id"),
        table_name="game_records",
    )
    op.drop_index(
        op.f("ix_game_records_south_player_id"),
        table_name="game_records",
    )
    op.drop_index(
        op.f("ix_game_records_north_player_id"),
        table_name="game_records",
    )
    op.drop_index(
        op.f("ix_game_records_id"), table_name="game_records"
    )
    op.drop_index(
        op.f("ix_game_records_group_id"), table_name="game_records"
    )
    op.drop_index(
        op.f("ix_game_records_east_player_id"),
        table_name="game_records",
    )
    op.drop_index(
        op.f("ix_game_records_created_by_id"),
        table_name="game_records",
    )
    op.drop_index(
        op.f("ix_game_records_contest_id"), table_name="game_records"
    )
    op.drop_table("game_records")
    op.drop_table("group_members")
    op.drop_index(
        op.f("ix_contests_id"), table_name="contests"
    )
    op.drop_index(
        op.f("ix_contests_group_id"), table_name="contests"
    )
    op.drop_index(
        op.f("ix_contests_created_by_id"), table_name="contests"
    )
    op.drop_table("contests")
    op.drop_index(
        op.f("ix_groups_owner_id"), table_name="groups"
    )
    op.drop_index(
        op.f("ix_groups_name"), table_name="groups"
    )
    op.drop_index(
        op.f("ix_groups_invite_token"), table_name="groups"
    )
    op.drop_index(op.f("ix_groups_id"), table_name="groups")
    op.drop_table("groups")
    op.drop_index(
        op.f("ix_users_username"), table_name="users"
    )
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(
        op.f("ix_users_email"), table_name="users"
    )
    op.drop_table("users")
