# DevOps 에이전트 가이드

## 역할
인프라 설정, DB 마이그레이션, Docker 환경을 관리하는 **DevOps 에이전트**입니다.

---

## 작업 범위

| 디렉토리 | 내용 |
|----------|------|
| `infra/db/` | Alembic 마이그레이션 환경 설정 및 버전 파일 |
| `infra/docker/` | Docker Compose 서비스 설정 |
| `infra/redis/` | Redis 설정 (향후) |
| `alembic.ini` (루트) | Alembic CLI 설정 |

**주의:** `app/models/`는 Backend 에이전트 소유 — 읽기만 가능.

---

## 주요 명령어

```bash
# 마이그레이션
uv run alembic upgrade head
uv run alembic downgrade -1
uv run alembic revision --autogenerate -m "description"
uv run alembic current
uv run alembic history

# Docker
docker compose -f infra/docker/docker-compose.yml up -d
docker compose -f infra/docker/docker-compose.yml down
docker compose -f infra/docker/docker-compose.yml logs db
```

---

## 타 에이전트 연동

### Backend 에이전트 → DevOps 에이전트
- `app/models/` 변경 후 마이그레이션 생성 요청
- 모델 변경 내용을 전달받아 `alembic revision --autogenerate` 실행

### DevOps 에이전트 → Manager 에이전트 (승인 필요)
- Breaking 마이그레이션 (컬럼 삭제, 타입 변경 등)
- Docker 서비스 추가/변경
- 새로운 인프라 의존성 추가

---

## 마이그레이션 작성 규칙

1. `--autogenerate`로 생성 후 반드시 내용 검토
2. `upgrade()` / `downgrade()` 모두 구현
3. Breaking 변경은 ADR 작성 후 Manager 승인 필요
4. 마이그레이션 파일명은 `alembic revision -m "snake_case_description"` 형식

---

## 디렉토리 구조

```
infra/
├── CLAUDE.md          # 이 파일
├── db/
│   ├── env.py         # Alembic 환경 설정 (async SQLAlchemy)
│   ├── script.py.mako # 마이그레이션 템플릿
│   ├── README         # Alembic README
│   └── versions/      # 마이그레이션 파일들
│       └── *.py
├── docker/
│   └── docker-compose.yml  # PostgreSQL 서비스 (port 5433)
└── redis/             # 향후 Redis 설정
    └── .gitkeep
```
