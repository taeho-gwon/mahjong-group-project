# Backend (FastAPI)

Mahjong game management backend API server

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
├── api/        # HTTP layer: routing, validation, status codes
├── services/   # Business logic, permissions, HTTPException
├── db/         # Pure data access (CRUD only)
├── models/     # SQLAlchemy models
├── schemas/    # Pydantic schemas
└── utils/      # Utilities
```

**Architecture Flow:**
```
API → Service → DB → Database
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

### 3. DB Layer (`app/db/<resource>.py`)

```python
async def get_by_id(db: AsyncSession, id: int) -> Model | None:
    result = await db.execute(select(Model).where(Model.id == id))
    return result.scalar_one_or_none()

async def list_all(db: AsyncSession) -> list[Model]:
    result = await db.execute(select(Model))
    return list(result.scalars().all())

async def create(db: AsyncSession, data: CreateSchema) -> Model:
    obj = Model(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj
```

**Rules:**
- Module-level async functions (no class wrapper)
- Single row: `scalar_one_or_none()` → `Model | None`
- Multiple rows: `list(scalars().all())` → `list[Model]`
- Relationship loading: Separate function with `selectinload()`
- **NO HTTPException** (pure data access only)

### 4. Service Layer (`app/services/<resource>.py`)

```python
from app.db import game_record as game_record_db

async def get_game_record(db: AsyncSession, id: int) -> GameRecord:
    obj = await game_record_db.get_by_id(db, id)
    if not obj:
        raise HTTPException(404, "Not found")
    return obj

async def create_game_record(
    db: AsyncSession, 
    user_id: int, 
    data: GameRecordCreate
) -> GameRecord:
    # Business logic, permission checks, etc.
    return await game_record_db.create(db, data)
```

**Rules:**
- Import DB module as `<resource>_db`
- **All HTTPException raised ONLY here**
- Permission checks after resource retrieval
- Return model object (serialization in API layer)

### 5. API Layer (`app/api/<resource>.py`)

```python
from app.services import game_record as game_record_service

router = APIRouter(prefix="/game-records", tags=["game-records"])

@router.post("", response_model=Response, status_code=201)
async def create(
    data: Create,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await game_record_service.create_game_record(db, user.id, data)

@router.get("/{id}", response_model=Response)
async def get(id: int, db: AsyncSession = Depends(get_db)):
    return await game_record_service.get_game_record(db, id)
```

**Rules:**
- Import service as `<resource>_service`
- Prefix uses kebab-case
- POST→201, DELETE→204, GET/PUT→200
- `get_current_user` only on protected endpoints
- **No business logic** (delegate to service)

### 6. Register Router

Add to `app/api/router.py`:
```python
from app.api.game_record import router as game_record_router
router.include_router(game_record_router)
```

### 7. Migration

```bash
uv run alembic revision --autogenerate -m "add game_records"
# Review generated file, then
uv run alembic upgrade head
```

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
- **Import order**: DB module as `<resource>_db`, Service as `<resource>_service`

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