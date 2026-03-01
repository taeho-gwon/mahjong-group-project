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

## 일하는 방식

### 작업 시작 전
1. `infra/CHANGELOG.md`에서 `TODO(@agent-devops)` 항목 확인
2. 해당 항목의 스펙을 읽고 작업 범위 파악
3. 마이그레이션 작업이면 `app/CHANGELOG.md`에서 모델 변경 내용 확인

### 작업 중
- **소유 영역만 수정**: `infra/`, `alembic.ini`
- `app/models/` 는 읽기만 가능 (마이그레이션 생성 시 참조용)
- `frontend/`, `app/services/` 절대 수정 금지
- Breaking 마이그레이션은 반드시 Manager 승인 후 진행

### 작업 완료 후
`infra/CHANGELOG.md`의 해당 TODO 항목을 완료 기록으로 업데이트:
```markdown
## [YYYY-MM-DD] @agent-devops ✅ DONE
### Added
- game_records 테이블 마이그레이션 적용
  - `uv run alembic current` 로 정상 동작 확인
```

### 범위 외 요청 발생 시
직접 처리하지 말고 해당 CHANGELOG에 태그 남기기:
- 모델 변경 필요 → `app/CHANGELOG.md`에 `TODO(@agent-backend)` 기록
- Breaking 변경 → `docs/decisions/`에 ADR 작성 후 `@agent-manager` 승인 요청

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
