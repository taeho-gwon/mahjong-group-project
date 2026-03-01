# DevOps Agent Changelog

작업 단위: 인프라/마이그레이션 변경 하나씩. 변경 후 이 파일을 업데이트할 것.

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

## 마이그레이션 완료 목록

- [x] users 테이블 초기 생성
- [x] groups + group_members 테이블
- [x] Group.uma_* 컬럼 추가
- [x] contests 테이블
- [x] game_records 테이블 (contest_id FK 포함)

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
