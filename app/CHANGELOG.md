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

---

## [2026-03-01] @agent-backend ✅ DONE — Contest 타입 시스템 + Group uma 제거

**Manager 승인 완료** (Breaking 변경 포함)

### 작업 범위

#### 1. `app/models/contest.py`
- `ContestType` StrEnum 추가:
  ```python
  class ContestType(StrEnum):
      overall = "overall"
      regular = "regular"
      independent = "independent"
  ```
- `Contest` 모델에 컬럼 추가:
  ```python
  contest_type: Mapped[ContestType] = mapped_column(
      SAEnum(ContestType, name="contesttype"),
      default=ContestType.regular,
      server_default="regular",
      nullable=False,
  )
  ```

#### 2. `app/models/group.py`
- `uma_1st`, `uma_2nd`, `uma_3rd`, `uma_4th` 컬럼 **제거** (Breaking)

#### 3. `app/schemas/contest.py`
- `ContestCreate`에 `contest_type: ContestType = ContestType.regular` 추가
- `ContestResponse`에 `contest_type: ContestType` 추가

#### 4. `app/schemas/group.py`
- `GroupCreate`: `UmaFields` 상속 **유지** (overall Contest 생성 시 사용)
- `GroupUpdate`: `uma_*` 필드 및 `validate_uma_fields` validator 완전 제거
- `GroupResponse`: `uma_*` 필드 4개 제거

#### 5. `app/repositories/contest.py`
- `create_overall(group_id, created_by_id, uma: UmaFields)` 메서드 추가:
  - `name="전체 랭킹"`, `contest_type=ContestType.overall`, `ranking_type="score"`, uma 값 그대로 사용
- `get_overall_by_group(group_id: int) -> Contest | None` 메서드 추가

#### 6. `app/repositories/game_record.py`
- `list()` 시그니처에 `is_overall: bool = False` 파라미터 추가
- `count()` 시그니처에 `is_overall: bool = False` 파라미터 추가
- `is_overall=True`일 때 특수 쿼리 (outerjoin):
  ```python
  # overall contest 조회: null-contest + regular-contest 포함, independent 제외
  select(GameRecord)
    .outerjoin(Contest, GameRecord.contest_id == Contest.id)
    .where(GameRecord.group_id == group_id)
    .where(
        (GameRecord.contest_id.is_(None))
        | (Contest.contest_type == ContestType.regular)
    )
  ```

#### 7. `app/services/contest.py`
- `create_contest`: `contest_type == overall` → 400 반환
- `delete_contest`: `contest_type == overall` → 400 반환
- `update_contest`: `update_data.pop("contest_type", None)` — contest_type 변경 불가

#### 8. `app/services/group.py`
- `GroupService.__init__`에 `contest_repo: ContestRepository` 추가 주입
- `create_group` 완료 후 overall contest 자동 생성:
  ```python
  await self.contest_repo.create_overall(group.id, owner_id, data)
  ```

#### 9. `app/services/game_record.py`
- `GameRecordService.__init__`에 `contest_repo: ContestRepository` 추가 주입
- `list_game_records`에서 `contest_id` 있으면 contest 조회 후 `is_overall` 판별:
  ```python
  if contest_id is not None:
      contest = await self.contest_repo.get_by_id(contest_id)
      if contest and contest.contest_type == ContestType.overall:
          is_overall = True
          overall_group_id = contest.group_id
  ```
  - `is_overall=True`면 repo에 `is_overall=True` 전달

#### 10. `app/api/deps.py`
- `get_group_service`: `contest_repo: ContestRepository = Depends(get_contest_repository)` 추가
- `get_game_record_service`: `contest_repo: ContestRepository = Depends(get_contest_repository)` 추가

#### 11. 테스트 업데이트
- `tests/test_groups.py`:
  - `_GROUP_PAYLOAD`에서 `uma_*` 필드 제거 (GroupCreate는 여전히 uma 받지만 test용 기본값은 생략 가능)
  - 그룹 생성 후 overall contest 자동 생성 확인 테스트 추가
- `tests/test_contests.py`:
  - `POST /contests` with `contest_type="overall"` → 400 확인 테스트 추가
  - `DELETE /contests/<overall_id>` → 400 확인 테스트 추가
  - 그룹 생성 시 overall contest 목록에 포함됨 확인

### 완료 조건
- [x] `uv run pytest` 전체 통과 (34개)
- [x] `docs/api-contract.md` 업데이트 (contest_type 추가, group uma 제거)
- [x] `app/CHANGELOG.md` DONE 기록
- [x] `infra/CHANGELOG.md`에 TODO(@agent-devops) 추가 (migration 2개)
- [x] `docs/status.md` 업데이트

---

## 핸드오프 규칙

모델 변경 후 Backend 에이전트 할 일:
1. 이 파일(`app/CHANGELOG.md`)에 변경 사항 기록 (`@agent-devops` 알림 태그)
2. `infra/CHANGELOG.md`에 `TODO(@agent-devops): migration 필요` 추가
3. DevOps 에이전트가 `uv run alembic revision --autogenerate` 실행
