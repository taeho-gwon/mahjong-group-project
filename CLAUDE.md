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

## Development Workflow

When working on this project:

1. **Navigate to the specific service directory** before running claude code:
   - For backend work: `cd app/`
   - For frontend work: `cd frontend/`

2. **Service-specific details** are documented in:
   - Backend: `app/CLAUDE.md`
   - Frontend: `frontend/CLAUDE.md`

3. **Root-level tasks** (project setup, documentation, CI/CD) can be done from this directory.

