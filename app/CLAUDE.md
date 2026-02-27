# Backend

## Structure

```
app/
├── api/        # Endpoints — HTTP handling, routing, validation only
├── services/   # Business logic, transactions, domain rules
├── db/         # Pure data access, CRUD queries only
├── models/     # SQLAlchemy models
├── schemas/    # Pydantic schemas
└── utils/      # Utilities
```

## Architecture

```
API → Service → DB
```

- No repository pattern
- All DB operations use `async/await` with `AsyncSession`
- JWT Bearer auth via `app/api/deps.py::get_current_user`

## Coding Style

- Ruff for linting/formatting
- Type hints required on all functions
- `snake_case` for variables/functions, `PascalCase` for classes
- Always `async def` for DB-touching functions

## Testing Strategy

1. **Early**: Unit tests for core logic (JWT, permissions)
2. **Mid**: API integration tests
3. **Pre-deployment**: E2E tests

## Commands

```bash
# Dev server
uv run uvicorn app.main:app --reload

# Lint / format
uv run ruff check --fix .
uv run ruff format .

# Tests
uv run pytest
uv run pytest tests/path/to/test_file.py::test_name

# Migrations
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head

# Dependencies
uv add <package>
uv add --group dev <package>
```

## Setup

```bash
cp .env.example .env   # fill in values
uv sync --group dev
docker compose up -d   # PostgreSQL on port 5433
uv run alembic upgrade head
uv run pre-commit install
```

## Environment Variables

```bash
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=["http://localhost:5173"]   # JSON array
```
