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

## TODO(@agent-backend) — API 통합 테스트 작성

### 작업 요청 by @agent-manager

**배경:** 현재 테스트가 없어 리팩토링/기능 추가 시 회귀 검증 불가.
`tests/conftest.py`에 async httpx 클라이언트 픽스처가 있으므로 바로 작성 가능.

**구현할 것:**

**1. `tests/test_auth.py`**
- `POST /auth/register` — 정상 가입, 중복 username 409
- `POST /auth/login` — 정상 로그인, 잘못된 비밀번호 401
- `POST /auth/refresh` — 정상 갱신, 만료/위조 토큰 401
- `GET /auth/me` — 정상 조회, 토큰 없음 401

**2. `tests/test_groups.py`**
- `POST /groups` — 생성, 인증 없음 401
- `GET /groups` — 공개 그룹 목록
- `GET /groups/{id}` — 상세 조회, 없는 id 404
- `POST /groups/{id}/join` — public 그룹 가입, private 그룹 거부
- `DELETE /groups/{id}` — owner만 삭제 가능, member 시도 403

**3. `tests/test_contests.py`**
- `POST /contests` — 생성, 인증 없음 401
- `GET /contests?group_id=` — 목록 조회
- `PUT /contests/{id}` — 생성자만 수정 가능, 타인 403
- `DELETE /contests/{id}` — 생성자만 삭제 가능, 타인 403

**4. `tests/test_game_records.py`**
- `POST /game-records` — 생성, 인증 없음 401
- `GET /game-records?contest_id=` — 목록 조회
- `PUT /game-records/{id}` — 생성자만 수정 가능, 타인 403
- `DELETE /game-records/{id}` — 생성자만 삭제 가능, 타인 403

**규칙:**
- 각 테스트는 독립적으로 실행 가능해야 함 (픽스처로 데이터 격리)
- 테스트 DB는 별도 설정 (`conftest.py` 확인 후 필요시 추가)
- `uv run pytest` 전체 통과가 완료 조건

**완료 조건:** `uv run pytest` 실행 시 전체 통과, 주요 엔드포인트 happy/error path 커버

---

## 핸드오프 규칙

모델 변경 후 Backend 에이전트 할 일:
1. 이 파일(`app/CHANGELOG.md`)에 변경 사항 기록 (`@agent-devops` 알림 태그)
2. `infra/CHANGELOG.md`에 `TODO(@agent-devops): migration 필요` 추가
3. DevOps 에이전트가 `uv run alembic revision --autogenerate` 실행
