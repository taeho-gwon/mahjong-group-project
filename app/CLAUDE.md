# Backend 에이전트

Mahjong game management backend API server

## 에이전트 역할

**역할:** FastAPI 백엔드 개발 및 유지보수

**소유 영역:** `app/`, `tests/`, `pyproject.toml`

**읽기 전용:** `infra/db/versions/` (마이그레이션 파일은 DevOps 에이전트가 관리)

**책임:**
- REST API 엔드포인트 구현
- DB 모델 정의 (`app/models/`) — 마이그레이션은 DevOps 에이전트에 위임
- 비즈니스 로직 (Service 레이어)
- 인증/인가 (JWT + Argon2id)

**타 에이전트 연동:**
- API 변경 시 → `docs/api-contract.md` 업데이트
- DB Breaking 변경 시 → Manager 승인 필요
- Frontend 요청사항 → `docs/api-contract.md` 기준으로 협의
- **모델 변경 후 마이그레이션 핸드오프** (아래 참조)

---

## Communication

- **Language**: Communicate in Korean, code/comments in English
- **Explanation**: Detailed, step-by-step
- **Work Unit**: One resource/feature at a time
- **Verification**: Check existing code before modifications

---

## Tech Stack

- FastAPI + SQLAlchemy 2.0 (async)
- PostgreSQL
- Alembic (migrations)
- Pydantic v2
- uv (package manager)

---

## Project Structure

```
app/
├── api/           # HTTP layer: routing, validation, status codes
├── services/      # Business logic, permissions, HTTPException
├── repositories/  # Pure data access (CRUD only, class-based)
├── db/            # DB session + engine (session.py)
├── models/        # SQLAlchemy models
├── schemas/       # Pydantic schemas
└── utils/         # Utilities
```

**Architecture Flow:**
```
API → Service → Repository → Database
```

**DI Chain:**
```
get_db() [AsyncSession]
  → get_user_repository(db) → UserRepository
    → get_auth_service(user_repo) → AuthService
      → route handler

get_db() [AsyncSession]
  → get_group_repository(db) → GroupRepository
    → get_group_service(group_repo) → GroupService
      → route handler
```

---

## Adding a New Resource

When adding a new resource (e.g., `GameRecord`), follow this order:

### 1. Model (`app/models/<resource>.py`)

```python
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

class GameRecord(Base):
    __tablename__ = "game_records"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    group_id: Mapped[int] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"), 
        index=True
    )
    
    # Relationships - ALWAYS lazy="noload"
    group: Mapped["Group"] = relationship(lazy="noload")
```

**Rules:**
- Use `Mapped[T]` + `mapped_column()`
- ForeignKey must have `ondelete=` and `index=True`
- Relationships use `lazy="noload"` (explicit loading via selectinload)

### 2. Schema (`app/schemas/<resource>.py`)

```python
from pydantic import BaseModel

class GameRecordCreate(BaseModel):
    group_id: int  # Input fields only, exclude id/timestamps

class GameRecordUpdate(BaseModel):
    field: str | None = None  # All fields optional

class GameRecordResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    group_id: int
```

**Rules:**
- Create/Update: No ORM config (pure input)
- Response: `from_attributes = True` required
- Update: All fields `T | None`, use `model_dump(exclude_unset=True)`

### 3. Repository (`app/repositories/<resource>.py`)

```python
from app.repositories.base import BaseRepository

class GameRecordRepository(BaseRepository):
    async def get_by_id(self, id: int) -> GameRecord | None:
        result = await self.db.execute(select(GameRecord).where(GameRecord.id == id))
        return result.scalar_one_or_none()

    async def list_all(self) -> list[GameRecord]:
        result = await self.db.execute(select(GameRecord))
        return list(result.scalars().all())

    async def create(self, data: GameRecordCreate) -> GameRecord:
        obj = GameRecord(**data.model_dump())
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj
```

**Rules:**
- Inherit from `BaseRepository` (`self.db` 사용)
- Single row: `scalar_one_or_none()` → `Model | None`
- Multiple rows: `list(scalars().all())` → `list[Model]`
- Relationship loading: Separate method with `selectinload()`
- **NO HTTPException** (pure data access only)

### 4. Service Layer (`app/services/<resource>.py`)

```python
from app.repositories.game_record import GameRecordRepository

class GameRecordService:
    def __init__(self, game_record_repo: GameRecordRepository) -> None:
        self.game_record_repo = game_record_repo

    async def get_game_record(self, id: int) -> GameRecord:
        obj = await self.game_record_repo.get_by_id(id)
        if not obj:
            raise HTTPException(404, "Not found")
        return obj

    async def create_game_record(
        self, user_id: int, data: GameRecordCreate
    ) -> GameRecord:
        # Business logic, permission checks, etc.
        return await self.game_record_repo.create(data)
```

**Rules:**
- Class with `__init__(self, <resource>_repo: <Resource>Repository)`
- **All HTTPException raised ONLY here**
- Permission checks after resource retrieval
- Return model object (serialization in API layer)

### 5. DI Factory (`app/api/deps.py`)

Add DI factory functions:
```python
def get_game_record_repository(db: AsyncSession = Depends(get_db)) -> GameRecordRepository:
    return GameRecordRepository(db)

def get_game_record_service(
    game_record_repo: GameRecordRepository = Depends(get_game_record_repository),
) -> GameRecordService:
    return GameRecordService(game_record_repo)
```

### 6. API Layer (`app/api/<resource>.py`)

```python
from app.api.deps import get_current_user, get_game_record_service
from app.services.game_record import GameRecordService

router = APIRouter(prefix="/game-records", tags=["game-records"])

@router.post("", response_model=Response, status_code=201)
async def create(
    data: Create,
    user: User = Depends(get_current_user),
    game_record_service: GameRecordService = Depends(get_game_record_service),
):
    return await game_record_service.create_game_record(user.id, data)

@router.get("/{id}", response_model=Response)
async def get(
    id: int,
    game_record_service: GameRecordService = Depends(get_game_record_service),
):
    return await game_record_service.get_game_record(id)
```

**Rules:**
- Inject service via `Depends(get_<resource>_service)`
- Prefix uses kebab-case
- POST→201, DELETE→204, GET/PUT→200
- `get_current_user` only on protected endpoints
- **No business logic** (delegate to service)

### 7. Register Router

Add to `app/api/router.py`:
```python
from app.api.game_record import router as game_record_router
router.include_router(game_record_router)
```

### 8. Migration 핸드오프

모델 변경 후 Backend 에이전트는 직접 마이그레이션을 실행하지 않습니다.
대신 DevOps 에이전트에 위임합니다:

1. `app/CHANGELOG.md`에 변경 사항 기록 (`@agent-devops` 태그 필수)
   ```markdown
   ## [YYYY-MM-DD] @agent-backend
   ### Added
   - GameRecord 모델 추가
     - **영향**: @agent-devops - migration 필요 (game_records 테이블)
   ```

2. `infra/CHANGELOG.md`에 TODO 추가
   ```markdown
   <!-- TODO(@agent-devops): game_records 테이블 migration 실행 필요 -->
   ```

3. DevOps 에이전트가 수행:
   ```bash
   uv run alembic revision --autogenerate -m "add game_records"
   # 생성된 파일 검토 후
   uv run alembic upgrade head
   ```

> Breaking 마이그레이션(컬럼 삭제, 타입 변경 등)은 Manager 에이전트 승인 후 진행

---

## HTTP Status Codes

| Method | Success | Error Cases |
|--------|---------|-------------|
| GET    | 200     | 404 not found |
| POST   | 201     | 400 bad request, 409 conflict |
| PUT    | 200     | 400, 403 forbidden, 404 |
| DELETE | 204     | 403, 404 |

Common errors:
- **400**: Bad request, business rule violation
- **401**: Authentication failed
- **403**: Authenticated but not authorized
- **404**: Resource not found
- **409**: Conflict (e.g., duplicate)

---

## Development Commands

```bash
# Dev server
uv run uvicorn app.main:app --reload

# Lint / format
uv run ruff check --fix .
uv run ruff format .

# Tests
uv run pytest
uv run pytest tests/path/to/test.py::test_name

# Migrations
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head

# Dependencies
uv add <package>
uv add --group dev <package>
```

---

## Coding Standards

- **Type hints**: Required on all functions
- **Naming**: `snake_case` (variables/functions), `PascalCase` (classes)
- **Async**: Always `async def` for DB-touching functions
- **Formatting**: Use Ruff
- **Import order**: Repository class from `app.repositories.<resource>`, Service class from `app.services.<resource>`

---

## Testing Strategy

1. **Early**: Unit tests for core logic (JWT, permissions)
2. **Mid**: API integration tests
3. **Pre-deployment**: E2E tests

---

## Setup

```bash
cp .env.example .env    # Configure environment variables
uv sync --group dev
docker compose up -d    # PostgreSQL (port 5433)
uv run alembic upgrade head
uv run pre-commit install
```

**Environment Variables:**
```bash
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=["http://localhost:5173"]  # JSON array
```