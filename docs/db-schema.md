# DB 스키마

PostgreSQL 17 — 비동기 SQLAlchemy ORM

## 테이블 목록

### users

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK, auto |
| username | VARCHAR | UNIQUE, NOT NULL |
| email | VARCHAR | UNIQUE, NULL (미래용) |
| hashed_password | VARCHAR | NOT NULL |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### groups

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK, auto |
| name | VARCHAR | NOT NULL |
| description | TEXT | NULL |
| join_policy | VARCHAR | NOT NULL (public/private) |
| invite_token | VARCHAR | UNIQUE, NULL |
| invite_token_expires_at | TIMESTAMP | NULL |
| uma_1st | INTEGER | DEFAULT 30 |
| uma_2nd | INTEGER | DEFAULT 10 |
| uma_3rd | INTEGER | DEFAULT -10 |
| uma_4th | INTEGER | DEFAULT -30 |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### group_members

| 컬럼 | 타입 | 제약 |
|------|------|------|
| group_id | INTEGER | FK → groups.id (CASCADE), PK |
| user_id | INTEGER | FK → users.id (CASCADE), PK |
| role | VARCHAR | NOT NULL (owner/admin/member) |
| joined_at | TIMESTAMP | NOT NULL |

### contests

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK, auto |
| group_id | INTEGER | FK → groups.id (SET NULL), NULL |
| created_by_id | INTEGER | FK → users.id (CASCADE) |
| name | VARCHAR | NOT NULL |
| description | TEXT | NULL |
| ranking_type | VARCHAR | NOT NULL (score/match_point) |
| uma_1st | INTEGER | NOT NULL |
| uma_2nd | INTEGER | NOT NULL |
| uma_3rd | INTEGER | NOT NULL |
| uma_4th | INTEGER | NOT NULL |
| scoring_1st | INTEGER | NOT NULL |
| scoring_2nd | INTEGER | NOT NULL |
| scoring_3rd | INTEGER | NOT NULL |
| scoring_4th | INTEGER | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### game_records

| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK, auto |
| group_id | INTEGER | FK → groups.id (SET NULL), NULL |
| contest_id | INTEGER | FK → contests.id (SET NULL), NULL |
| east_player_id | INTEGER | FK → users.id (CASCADE), NOT NULL |
| south_player_id | INTEGER | FK → users.id (CASCADE), NOT NULL |
| west_player_id | INTEGER | FK → users.id (CASCADE), NOT NULL |
| north_player_id | INTEGER | FK → users.id (CASCADE), NOT NULL |
| east_point | INTEGER | NOT NULL |
| south_point | INTEGER | NOT NULL |
| west_point | INTEGER | NOT NULL |
| north_point | INTEGER | NOT NULL |
| created_by_id | INTEGER | FK → users.id (CASCADE), NOT NULL |
| game_link | VARCHAR(500) | NULL |
| played_at | TIMESTAMP | NOT NULL (default: now) |
| created_at | TIMESTAMP | NOT NULL (default: now) |

## 관계 다이어그램

```
users ──< group_members >── groups
                              │
                              ├──< contests
                              │
                              └──< game_records >── contests
```

## 마이그레이션

```bash
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1
```

> **Breaking 변경 시 Manager 에이전트 승인 필요**
