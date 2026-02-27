# Mahjong Group Management Service

## Project Overview

A service for creating and managing Mahjong groups, with future support for game record tracking and statistics.

**Core Domain:**
- User: Service users
- Group: Mahjong gathering/club
- GameRecord: Game session records (future)

## Tech Stack

**Backend:**
- Python 3.13, FastAPI, PostgreSQL
- SQLAlchemy (async), Alembic
- JWT auth, Argon2id hashing
- uv (dependency management)

**Frontend:**
- React + Vite + TypeScript

**Tools:**
- Ruff (linting/formatting)
- pre-commit, pytest
- Docker, docker-compose

## Project Structure

```
project-root/
├── app/                    # Backend (root level)
│   ├── api/               # Endpoints (HTTP handling)
│   ├── services/          # Business logic
│   ├── db/                # DB query functions
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   └── utils/             # Utilities
├── alembic/               # Migrations
├── tests/                 # Tests
├── static/                # Static files
├── frontend/              # Frontend
└── [config files]
```

**Reference structure:** taeho-gwon/mahjong-qna-be

## Core Architecture Principles

### Layer Separation
```
API (endpoints) → Service (business logic) → DB (queries)
```

- **API Layer**: HTTP request/response, validation, routing only
- **Service Layer**: Business logic, transactions, domain rules
- **DB Layer**: Pure data access, CRUD queries only
- No repository pattern

### Async Processing
- All DB operations use async/await
- SQLAlchemy AsyncSession

### Authentication & Security
- JWT-based auth (Access + Refresh tokens)
- Argon2id password hashing (more secure than bcrypt)

## Development Guidelines

### Coding Style
- Ruff for linting/formatting (`ruff format .`, `ruff check --fix .`)
- Type hints required for all functions
- snake_case (variables/functions), PascalCase (classes)
- Async functions use async def

### Testing Strategy
1. **Early**: Unit tests for core logic only (JWT, permissions, etc.)
2. **Mid**: Add API integration tests
3. **Pre-deployment**: E2E tests

### Key Commands
```bash
# Backend dev server
uv run uvicorn app.main:app --reload

# Linting / formatting
uv run ruff check --fix .
uv run ruff format .

# Tests
uv run pytest
uv run pytest tests/path/to/test_file.py::test_name  # single test

# Migrations
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head

# Add dependency
uv add <package>
uv add --group dev <package>

# Frontend
cd frontend && npm run dev
cd frontend && npm run build
```

### Setup
```bash
# First-time setup
cp .env.example .env  # then fill in values
uv sync --group dev
docker compose up -d  # start PostgreSQL
uv run alembic upgrade head

# Install pre-commit hooks
uv run pre-commit install

# Node.js (via fnm — installed locally)
export PATH="$HOME/.local/share/fnm:$PATH" && eval "$(fnm env)"
fnm use 22
```

## Environment Variables (.env)

```bash
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS=http://localhost:5173
```

## Current Progress

- [x] Tech stack decided
- [x] Project structure designed
- [x] Initial setup (directories, config files)
- [ ] User model & authentication
- [ ] Group model & API
- [ ] Frontend structure
- [ ] Game records feature (future)

## Key Decisions

**Why these choices:**
- **Monorepo**: Easier backend/frontend management
- **Argon2**: Modern security standard, GPU attack resistant
- **Layer separation**: Testability, maintainability
- **Async**: Maximize FastAPI performance
- **uv**: Fast dependency management

**Future considerations:**
- Game record domain model design
- Statistics & ranking features
- Real-time features (WebSocket)

---

**References:** [FastAPI docs](https://fastapi.tiangolo.com/), [SQLAlchemy docs](https://docs.sqlalchemy.org/), [uv docs](https://docs.astral.sh/uv/)