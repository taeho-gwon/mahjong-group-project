# Mahjong Group

마작 모임 관리 서비스 - 그룹 생성, 게임 기록, 랭킹 관리

**https://mjgroup.duckdns.org**

## 주요 기능

- 그룹 생성/관리 (공개/비공개, 초대 링크)
- 이벤트 관리 (일반/독립 타입, 마감 기능)
- 게임 기록 등록/수정/삭제 (4인 마작)
- 랭킹 집계 (점수제/승점제, 기간별 필터)
- 멤버 역할 관리 (owner/admin/member)
- 그룹별 닉네임

## 기술 스택

| 레이어 | 스택 |
|--------|------|
| Backend | Python 3.13, FastAPI, PostgreSQL, SQLAlchemy (async), Alembic |
| Frontend | React, Vite, TypeScript, React Query, Tailwind CSS |
| Auth | JWT (Access + Refresh), Argon2id |
| Infra | Docker Compose, Nginx, Let's Encrypt |

## 로컬 개발

### 사전 요구사항

- Python 3.13+ / [uv](https://docs.astral.sh/uv/)
- Node.js 22+ / npm
- Docker (PostgreSQL)

### DB 실행

```bash
docker compose -f infra/docker/docker-compose.yml up -d  # PostgreSQL (port 5433)
```

### Backend

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### 테스트

```bash
uv run pytest
```

## 프로젝트 구조

```
├── app/           # Backend (FastAPI)
├── frontend/      # Frontend (React + Vite)
├── infra/         # Docker, Alembic 마이그레이션
├── tests/         # 통합 테스트
└── docs/          # API 계약서, DB 스키마, 아키텍처 문서
```
