# Backend Agent Changelog

작업 단위: 리소스/기능 하나씩. 변경 후 이 파일을 업데이트할 것.

---

## [2026-03-01] @agent-backend

### Added
- GameRecord 모델 (`app/models/game_record.py`)
  - east/south/west/north player FK, 점수 컬럼, played_at, game_link
  - contest_id FK (SET NULL, nullable)
  - **영향**: @agent-devops - migration 필요 (game_records 테이블)

### Changed
- Group 모델에 uma_1st/2nd/3rd/4th 컬럼 추가 (DEFAULT 30/10/-10/-30)
  - **영향**: @agent-devops - migration 필요

### Added
- Contest 모델 (`app/models/contest.py`)
  - ranking_type (score/match_point), uma override, scoring 1st~4th
  - group_id FK (SET NULL), created_by_id FK (CASCADE)
  - **영향**: @agent-devops - migration 필요 (contests 테이블)

### Refactored
- infra/ 디렉토리 구조 개편: alembic/ → infra/db/
  - **영향**: @agent-devops - infra/CLAUDE.md 참조

---

## [2026-03-01] @agent-backend ✅ DONE — 게임기록 수정 API

### Added
- `PUT /game-records/{id}` — 게임기록 수정 엔드포인트
  - `GameRecordUpdate` 스키마 추가 (모든 필드 optional)
  - 생성자(`created_by_id`)만 수정 가능, 타인 시도 시 403
  - **영향**: @agent-frontend — 수정 UI 구현 가능

---

## [2026-03-01] @agent-backend ✅ DONE — 게임기록 수정/삭제 권한 변경

### Changed
- `PUT /game-records/{id}`, `DELETE /game-records/{id}` 권한 변경
  - 기존: 생성자(`created_by_id`)만 허용
  - 변경: 해당 그룹의 `owner` 또는 `admin`만 허용
- `GameRecordService`에 `GroupRepository` 추가 주입
- `app/api/deps.py`의 `get_game_record_service` DI에 `group_repo` 추가
- 테스트 업데이트: `test_game_records.py` 권한 시나리오 반영
- **영향**: @agent-frontend — 수정/삭제는 그룹 owner/admin 권한 필요

---

## [2026-03-01] @agent-backend ✅ DONE — API 통합 테스트 작성

### Added
- `tests/conftest.py` 재구성: NullPool 기반 test DB, setup_db(autouse), client/auth_headers 픽스처
- `tests/test_auth.py` — 8개 테스트
- `tests/test_groups.py` — 8개 테스트
- `tests/test_contests.py` — 7개 테스트
- `tests/test_game_records.py` — 7개 테스트
- 31개 전체 통과 (`uv run pytest` 기준)
- 테스트 DB: `mahjong_test` (port 5433, 별도 생성 필요)

---

## 핸드오프 규칙

모델 변경 후 Backend 에이전트 할 일:
1. 이 파일(`app/CHANGELOG.md`)에 변경 사항 기록 (`@agent-devops` 알림 태그)
2. `infra/CHANGELOG.md`에 `TODO(@agent-devops): migration 필요` 추가
3. DevOps 에이전트가 `uv run alembic revision --autogenerate` 실행
