# DevOps Agent Changelog

작업 단위: 인프라/마이그레이션 변경 하나씩. 변경 후 이 파일을 업데이트할 것.

---

## [2026-03-01] @agent-devops (기술 부채 해결)

### Fixed
- `alembic.ini` — ruff post_write_hook 활성화 (마이그레이션 파일 자동 포맷)
- `infra/docker/docker-compose.yml` — `name: mahjong` 추가 (volume 네임스페이스), `restart: unless-stopped` 추가
- `scripts/seed.py` — Contest 시드 데이터 추가 (정규 시즌, 승점제 리그), DELETE 순서에 contests 포함

### Added
- `scripts/dev_reset.sh` — DB 재시작 + 마이그레이션 + 시드를 한 번에 실행하는 개발용 스크립트
  - `bash scripts/dev_reset.sh` — 전체 초기화
  - `bash scripts/dev_reset.sh --no-seed` — 마이그레이션만

---

## [2026-03-01] @agent-devops

### Restructured
- `alembic/` → `infra/db/` 디렉토리로 이전
  - `infra/db/versions/` — 마이그레이션 파일
  - `infra/db/env.py` — Async Alembic 설정
  - `alembic.ini` — `script_location = infra/db` 로 업데이트
  - **영향**: @agent-backend — `uv run alembic` 명령어는 동일하게 동작

### Added
- `infra/docker/docker-compose.yml` — PostgreSQL 17 서비스 (port 5433)
  - user/pass/db: mahjong
  - Note: port 5432는 mahjongqna 프로젝트가 사용 중

---

---

<!-- TODO(@agent-devops): Contest 타입 + Group uma 제거 migration — @agent-backend ✅ DONE (2026-03-01) -->

## [2026-03-01] @agent-devops ✅ DONE — Contest 타입 + Group uma 제거 Migration

### Added
- `infra/db/versions/1b81330c150d_add_contest_type_to_contests_and_remove_.py`
  - `contests.contest_type` 컬럼 추가 (contesttype enum: overall/regular/independent, default='regular')
  - `groups.uma_1st/2nd/3rd/4th` 컬럼 제거
  - `upgrade()` / `downgrade()` 모두 구현 (enum 타입 생성/삭제 포함)
- `uv run alembic current` → `1b81330c150d (head)` ✅
- `uv run pytest` → 34개 전체 통과 ✅

---

## 마이그레이션 완료 목록

- [x] users 테이블 초기 생성
- [x] groups + group_members 테이블
- [x] Group.uma_* 컬럼 추가
- [x] contests 테이블
- [x] game_records 테이블 (contest_id FK 포함)
- [x] contests.contest_type 추가 + groups.uma_* 제거

---

## 마이그레이션 실행 방법

```bash
# 마이그레이션 파일 생성 (Backend 에이전트 모델 변경 후)
uv run alembic revision --autogenerate -m "description"

# 검토 후 적용
uv run alembic upgrade head

# 롤백
uv run alembic downgrade -1
```

> Breaking 마이그레이션은 Manager 에이전트 승인 필요
