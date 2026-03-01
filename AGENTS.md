# Agent Collaboration Guide

## 에이전트 역할

### 관리자 (Manager)
- **담당**: 아키텍처, 의사결정, 통합, 배포
- **작업 범위**: 전체 프로젝트
- **우선순위**: 높음 (충돌 해결 권한)
- **세부 지침**: `CLAUDE.md`

### BE 개발자 (Backend Developer)
- **담당**: API, 비즈니스 로직, 서버사이드
- **작업 범위**: `app/`
- **제약**: DB 스키마 직접 수정 금지 (Manager 승인 필요)
- **세부 지침**: `app/CLAUDE.md`, `docs/agents/backend-agent.md`

### FE 개발자 (Frontend Developer)
- **담당**: UI/UX, 클라이언트 로직, 상태 관리
- **작업 범위**: `frontend/`
- **제약**: API 엔드포인트 직접 수정 금지
- **세부 지침**: `frontend/CLAUDE.md`

### DevOps 엔지니어 (DevOps Engineer)
- **담당**: 인프라 설정, DB 스키마/마이그레이션 관리, Docker 환경, 쿼리 최적화
- **작업 범위**: `infra/`, `alembic.ini`, `app/models/` (읽기 전용)
- **제약**: `app/models/` 읽기만 가능, 비즈니스 로직 구현 금지, Breaking 마이그레이션은 Manager 승인 필요
- **세부 지침**: `infra/CLAUDE.md`
- **트리거**: Backend 에이전트가 `app/CHANGELOG.md`에 `@agent-devops` 태그 남기면 마이그레이션 실행

---

## 커뮤니케이션 규칙

### 방법 1: CHANGELOG 활용
각 에이전트는 자신의 CHANGELOG.md에 작업 내용 기록

예시:
```markdown
## [2024-03-01] @agent-backend
### Added
- POST /api/users - 사용자 생성 API
  - **의존성**: @agent-db - users 테이블 필요
  - **영향**: @agent-frontend - UserCreateForm에서 사용
```

### 방법 2: 코드 주석 태그
```python
# TODO(@agent-db): User 테이블에 email_verified 컬럼 추가 필요
# BLOCKED(@agent-frontend): 이 엔드포인트는 FE UserForm 완성 후 테스트 가능
# FYI(@agent-manager): 이 API는 rate limiting 필요할 수 있음
```

### 방법 3: 공유 문서 업데이트
- `docs/api-contract.md` - BE ↔ FE
- `docs/db-schema.md` - DB ↔ BE

---

## 파일 소유권 매트릭스

각 에이전트는 **소유 영역만 수정**하고, 타 영역은 읽기만 가능합니다.

### 디렉토리 소유권

| 디렉토리/파일 | 소유자 | BE | FE | DevOps | Manager |
|--------------|--------|----|----|--------|---------|
| `app/` | BE | **RW** | R | R | R |
| `tests/` | BE | **RW** | - | - | R |
| `frontend/` | FE | R | **RW** | - | R |
| `infra/` | DevOps | R | - | **RW** | R |
| `pyproject.toml` | BE | **RW** | - | R | R |
| `alembic.ini` | DevOps | R | - | **RW** | R |
| `scripts/` | DevOps | R | - | **RW** | R |

### docs/ 파일 소유권

| 파일 | 소유자 | 설명 |
|------|--------|------|
| `docs/api-contract.md` | BE | BE가 API 변경 시 업데이트. FE는 읽기 전용 |
| `docs/db-schema.md` | DevOps | 마이그레이션 후 업데이트 |
| `docs/decisions/` | Manager | ADR 작성은 Manager만 |
| `docs/architecture.md` | Manager | 아키텍처 문서 |
| `docs/status.md` | 공유 | 각 에이전트가 자기 담당 항목만 업데이트 |

### CHANGELOG 소유권

| 파일 | 소유자 | 타 에이전트 쓰기 권한 |
|------|--------|----------------------|
| `app/CHANGELOG.md` | BE | Manager만 TODO 작성 가능 |
| `frontend/CHANGELOG.md` | FE | Manager만 TODO 작성 가능 |
| `infra/CHANGELOG.md` | DevOps | Manager, BE가 TODO 작성 가능 |

### 루트 파일 소유권

| 파일 | 소유자 |
|------|--------|
| `CLAUDE.md` | Manager |
| `AGENTS.md` | Manager |
| `.env`, `.env.example` | DevOps |

---

## CHANGELOG 프로토콜

### TODO 작성 규칙 (작업 요청)
- **Manager → 모든 에이전트**: CHANGELOG에 TODO 작성 가능
- **BE → DevOps**: `infra/CHANGELOG.md`에 `TODO(@agent-devops)` 작성 (migration 핸드오프)
- **그 외 교차 요청**: 직접 쓰지 않고 Manager에게 요청

### TODO 형식
```markdown
## [YYYY-MM-DD] TODO(@agent-xxx) — 작업 제목
### 배경
- 왜 이 작업이 필요한지
### 구현 범위
- 구체적 파일명, 구현 방식
### 완료 조건
- [ ] 체크리스트
```

### DONE 형식
```markdown
## [YYYY-MM-DD] @agent-xxx ✅ DONE — 작업 제목
### Added/Changed/Fixed
- 변경 내용 요약
```

### 규칙
1. 자기 CHANGELOG의 TODO를 확인하고 작업 시작
2. 작업 완료 후 TODO를 DONE으로 업데이트
3. 타 에이전트 영향이 있으면 `**영향**: @agent-xxx — 설명` 태그
4. 선행 작업이 있으면 `**선행**: @agent-xxx 작업명 완료 후` 명시
5. **DONE 처리 시 `docs/status.md` 반드시 업데이트:**
   - "활성 TODO 목록" → 해당 항목 제거
   - "최근 완료된 작업" → 완료 항목 추가
   - "에이전트 피드백/이슈" → 이슈가 있으면 추가

---

## 교차 영역 작업 규칙

### 원칙: 남의 코드를 직접 수정하지 않는다

| 상황 | 올바른 방법 | 잘못된 방법 |
|------|------------|------------|
| BE가 FE 변경 필요 | Manager에게 보고 → Manager가 FE CHANGELOG에 TODO | BE가 `frontend/` 직접 수정 |
| FE가 새 API 필요 | Manager에게 보고 → Manager가 BE CHANGELOG에 TODO | FE가 `app/` 직접 수정 |
| BE 모델 변경 후 migration | BE가 `infra/CHANGELOG.md`에 TODO 작성 | BE가 `uv run alembic revision` 직접 실행 |
| Manager가 현황 파악 필요 | 에이전트에게 조사 요청 (sub-agent 활용) | Manager가 소스 코드 직접 읽기 |

### 공유 파일 수정 순서 (api-contract.md)
1. BE가 API 변경 → `docs/api-contract.md` 업데이트
2. FE는 api-contract.md를 **읽기 전용**으로 참조
3. FE가 스펙 변경이 필요하면 → Manager를 통해 BE에 요청

---

## 충돌 방지 규칙

### Rule 1: 소유권 존중
- 위 매트릭스의 **RW** 표시된 영역만 수정 가능
- R(읽기) 영역은 참조만, 절대 수정 금지
- 소유권이 불명확한 파일은 Manager에게 확인

### Rule 2: Breaking Change는 반드시 승인
1. ADR 문서 작성 (`docs/decisions/YYYY-MM-DD-title.md`)
2. 영향받는 에이전트에 태그
3. Manager 승인 후 진행

### Rule 3: 데일리 동기화
매일 작업 시작 전:
1. git pull
2. 자기 CHANGELOG에서 TODO 항목 확인
3. 다른 에이전트의 CHANGELOG에서 자기 태그(@agent-xxx) 확인
4. `docs/` 변경사항 확인

### Rule 4: 동시 수정 방지
- 같은 파일을 여러 에이전트가 수정하지 않도록, 작업 범위가 겹치면 Manager가 순서 지정
- 공유 파일(`docs/status.md` 등) 수정 시 자기 섹션만 수정
