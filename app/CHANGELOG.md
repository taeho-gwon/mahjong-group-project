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

## [2026-03-01] TODO(@agent-backend) — 게임기록 수정 API

### 작업 요청 by @agent-manager

**배경:** 게임기록 삭제는 `DELETE /game-records/{id}` 이미 구현됨.
수정 API가 없어 프론트엔드에서 수정 기능 구현 불가.

**구현할 것:**

1. `app/schemas/game_record.py`에 `GameRecordUpdate` 추가
   - 수정 가능 필드 (모두 optional): `east/south/west/north_player_id`, `east/south/west/north_point`, `game_link`, `played_at`

2. `app/repositories/game_record.py`에 `update` 메서드 추가
   - `model_dump(exclude_unset=True)` 패턴 사용
   - commit 후 `_with_players` 로드해서 반환

3. `app/services/game_record.py`에 `update_game_record` 추가
   - `created_by_id != current_user_id` → 403

4. `app/api/game_record.py`에 `PUT /{record_id}` 엔드포인트 추가
   - `response_model=GameRecordResponse`, status 200

**완료 조건:** `PUT /game-records/{id}` 가 생성자만 수정 가능하도록 동작

**영향:** @agent-frontend — API 완성 후 수정 UI 구현 가능

---

## 핸드오프 규칙

모델 변경 후 Backend 에이전트 할 일:
1. 이 파일(`app/CHANGELOG.md`)에 변경 사항 기록 (`@agent-devops` 알림 태그)
2. `infra/CHANGELOG.md`에 `TODO(@agent-devops): migration 필요` 추가
3. DevOps 에이전트가 `uv run alembic revision --autogenerate` 실행
