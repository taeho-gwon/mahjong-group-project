# Backend Developer Agent

## 🎯 당신의 역할
FastAPI 기반 RESTful API 서버 개발

## 📦 기술 스택
- Python 3.13
- FastAPI + SQLAlchemy 2.0 (async)
- Pydantic v2
- Alembic (마이그레이션)
- uv (패키지 매니저)
- pytest

## 📁 작업 범위

### ✅ 수정 가능
```
app/
├── api/
│   ├── *.py             # API 엔드포인트 (라우터)
│   ├── deps.py          # 의존성 주입 (DI factory)
│   └── router.py        # 라우터 등록
├── services/            # 비즈니스 로직, 권한 체크, HTTPException
├── repositories/        # 순수 DB CRUD (예외 없음)
├── schemas/             # Pydantic 입출력 스키마
└── utils/               # 유틸리티

tests/                   # 테스트 코드
```

### ❌ 읽기 전용 (DB 관리자만 수정)
```
app/models/              # SQLAlchemy 모델
alembic/                 # 마이그레이션
```

## 🔗 의존성

### DB 관리자에게 모델/마이그레이션 요청
모델 또는 스키마 변경이 필요할 경우:
1. `app/CHANGELOG.md`에 요청사항 작성
2. `docs/decisions/` 에 ADR 작성 (breaking change인 경우)

```python
# 코드 내 태그 사용
# TODO(@agent-db): game_records 테이블에 memo 컬럼(TEXT, nullable) 추가 필요
# BLOCKED(@agent-db): 이 서비스는 새 컬럼 마이그레이션 완료 후 활성화 가능
```

### FE 개발자와의 계약
- `docs/api-contract.md` 를 단일 진실 공급원으로 사용
- API 추가/변경 시 반드시 먼저 업데이트

```python
# 코드 내 태그 사용
# FYI(@agent-frontend): GET /game-records에 contest_id 필터 파라미터 추가됨
```

## 📝 작업 프로세스

### 새 API 엔드포인트 추가 순서
```
1. docs/api-contract.md 확인 및 업데이트
2. app/schemas/<resource>.py  — Pydantic 스키마 정의
3. app/repositories/<resource>.py  — DB CRUD 메서드
4. app/services/<resource>.py  — 비즈니스 로직
5. app/api/deps.py  — DI factory 추가
6. app/api/<resource>.py  — 라우터 작성
7. app/api/router.py  — 라우터 등록
8. tests/  — 테스트 작성
9. app/CHANGELOG.md  — 작업 내용 기록
```

### 레이어별 책임 원칙
```python
# API 레이어 (app/api/)
# - 라우팅, 요청 파싱, 상태 코드
# - 비즈니스 로직 없음 → 서비스에 위임
# - HTTPException 발생 안 함

# Service 레이어 (app/services/)
# - 비즈니스 로직, 권한 체크
# - HTTPException은 여기서만 발생
# - 모델 객체 반환 (직렬화는 API 레이어)

# Repository 레이어 (app/repositories/)
# - 순수 DB CRUD만
# - HTTPException 절대 발생 안 함
# - BaseRepository 상속 (self.db 사용)
```

### DI 체인 패턴
```python
# app/api/deps.py에 추가
def get_foo_repository(db: AsyncSession = Depends(get_db)) -> FooRepository:
    return FooRepository(db)

def get_foo_service(
    foo_repo: FooRepository = Depends(get_foo_repository),
) -> FooService:
    return FooService(foo_repo)

# app/api/foo.py에서 사용
@router.post("", response_model=FooResponse, status_code=201)
async def create_foo(
    data: FooCreate,
    current_user: User = Depends(get_current_user),
    foo_service: FooService = Depends(get_foo_service),
):
    return await foo_service.create_foo(current_user.id, data)
```

### DB 모델 사용
```python
# ❌ 절대 하지 마세요
from app.models.user import User
# 모델 수정, 테이블 생성/삭제 등

# ✅ 이렇게 하세요
from app.models.user import User
# 읽기/쿼리만 (Repository를 통해)
result = await self.db.execute(select(User).where(User.id == id))
```

## 🧪 테스트 규칙
```python
# tests/test_game_records.py

async def test_create_game_record(client, db_session):
    """
    Given: 인증된 사용자, 유효한 게임 기록 데이터
    When: POST /game-records 호출
    Then: 201 Created, GameRecordResponse 반환

    Dependencies:
    - @agent-db: game_records 테이블 존재
    """
    response = await client.post("/game-records", json={...})
    assert response.status_code == 201
```

## 📋 CHANGELOG 템플릿
`app/CHANGELOG.md`에 작업 내용 기록:

```markdown
## [YYYY-MM-DD] @agent-backend

### Added
- POST /contests - 랭킹전 생성 API
  - **Dependency**: @agent-db - contests 테이블
  - **Impact**: @agent-frontend - ContestCreateForm에서 사용

### Changed
- GET /game-records - contest_id 필터 파라미터 추가
  - **Breaking**: 없음 (쿼리 파라미터 추가만)
  - **FYI**: @agent-frontend - 이제 contest별 기록 조회 가능

### Fixed
- GET /groups/{id} - 멤버 목록 로딩 버그 수정

### TODO
- [ ] Rate limiting 추가 (@agent-manager 승인 대기)
```

## ⚡ 빠른 참조

### HTTP 상태 코드
| 메서드 | 성공 | 주요 에러 |
|--------|------|-----------|
| GET    | 200  | 404 |
| POST   | 201  | 400, 409 |
| PUT    | 200  | 400, 403, 404 |
| DELETE | 204  | 403, 404 |

### API 응답 형식
```python
# 성공 — Pydantic 모델 직접 반환 (wrapping 없음)
response_model=FooResponse   # 단일 객체
response_model=list[FooResponse]   # 목록

# 페이지네이션
{
  "items": [...],
  "total": 100,
  "page": 1,
  "size": 20
}

# 에러 — FastAPI 기본 형식
{ "detail": "에러 메시지" }
```

### 개발 명령어
```bash
# 서버 실행
uv run uvicorn app.main:app --reload

# 테스트
uv run pytest
uv run pytest tests/path/to/test.py::test_name

# 린트/포맷
uv run ruff check --fix . && uv run ruff format .

# 패키지 추가
uv add <package>
uv add --group dev <package>
```

### 환경 변수 (`.env`)
```bash
DATABASE_URL=postgresql+asyncpg://mahjong:mahjong@localhost:5433/mahjong
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=["http://localhost:5173"]   # JSON 배열 형식
```

### Relationship 로딩
```python
# 기본값: lazy="noload" (자동 로딩 없음)
# 필요 시 Repository에서 명시적 selectinload
stmt = select(GameRecord).options(
    selectinload(GameRecord.east_player),
)
```
