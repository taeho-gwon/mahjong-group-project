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

### DB 관리자 (Database Administrator)
- **담당**: 스키마, 마이그레이션, 쿼리 최적화
- **작업 범위**: `alembic/`, `app/models/`
- **제약**: 비즈니스 로직 구현 금지

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

## 충돌 방지 규칙

### Rule 1: 읽기 전용 디렉토리
- agent-backend: `alembic/versions/`, `frontend/src/` 읽기만 가능
- agent-frontend: `app/api/`, `alembic/` 읽기만 가능
- agent-db: `app/services/`, `frontend/` 읽기만 가능

### Rule 2: Breaking Change는 반드시 승인
1. ADR 문서 작성 (`docs/decisions/YYYY-MM-DD-title.md`)
2. 영향받는 에이전트에 태그
3. 관리자 승인 후 진행

### Rule 3: 데일리 동기화
매일 작업 시작 전:
1. git pull
2. 다른 에이전트의 CHANGELOG 확인
3. `docs/` 변경사항 확인
