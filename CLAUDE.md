# Mahjong Group Management Service

## Project Overview

A service for creating and managing Mahjong groups, with future support for game record tracking and statistics.

**Core Domain:**
- User: Service users
- Group: Mahjong gathering/club
- GameRecord: Game session records (future)

## Tech Stack

| Layer    | Stack |
|----------|-------|
| Backend  | Python 3.13, FastAPI, PostgreSQL, SQLAlchemy (async), Alembic, uv |
| Frontend | React + Vite + TypeScript |
| Auth     | JWT (Access + Refresh), Argon2id hashing |
| Tools    | Ruff, pre-commit, pytest, Docker |

## Project Structure

```
project-root/
├── app/                    # Backend → see app/CLAUDE.md
├── frontend/               # Frontend → see frontend/CLAUDE.md
├── alembic/               # Migrations
├── tests/                 # Tests
└── [config files]
```

**Reference structure:** taeho-gwon/mahjong-qna-be

## Current Progress

- [x] Tech stack decided
- [x] Project structure designed
- [x] Initial setup (directories, config files)
- [x] User model & authentication
- [x] Group model & API
- [ ] Frontend structure
- [ ] Game records feature (future)

## Key Decisions

- **Monorepo**: Easier backend/frontend management
- **Argon2**: Modern security standard, GPU attack resistant
- **Layer separation**: Testability, maintainability
- **Async**: Maximize FastAPI performance
- **uv**: Fast dependency management

**Future considerations:** game record model, statistics & ranking, real-time (WebSocket)

---

**References:** [FastAPI docs](https://fastapi.tiangolo.com/), [SQLAlchemy docs](https://docs.sqlalchemy.org/), [uv docs](https://docs.astral.sh/uv/)
