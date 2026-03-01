# 시스템 아키텍처

## 개요

```
[Client (React SPA)]
        │ HTTP/REST
        ▼
[FastAPI Server]
   ├── API Layer (routing, validation, status codes)
   ├── Service Layer (business logic, permissions, HTTPException)
   ├── Repository Layer (pure data access, CRUD)
   └── SQLAlchemy Async ORM
        │
        ▼
[PostgreSQL 17]
```

## 레이어 책임

| 레이어 | 파일 위치 | 책임 |
|--------|-----------|------|
| API | `app/api/` | 라우팅, 요청 검증, 상태 코드 |
| Service | `app/services/` | 비즈니스 로직, 권한 체크, HTTPException |
| Repository | `app/repositories/` | 순수 DB CRUD (예외 없음) |
| Model | `app/models/` | SQLAlchemy ORM 모델 |
| Schema | `app/schemas/` | Pydantic 입출력 스키마 |

## 인증 흐름

```
POST /auth/login
  → AuthService.login()
  → UserRepository.get_by_username()
  → verify_password() (Argon2id)
  → create_access_token() + create_refresh_token() (JWT)
  ← TokenResponse

Protected Route
  → get_current_user() [Depends]
  → decode_token() → user_id
  → UserRepository.get_by_id()
  ← User
```

## DI (의존성 주입) 체인

```
get_db() → AsyncSession
  → get_user_repository(db) → UserRepository
    → get_auth_service(user_repo) → AuthService
  → get_group_repository(db) → GroupRepository
    → get_group_service(group_repo) → GroupService
  → get_contest_repository(db) → ContestRepository
    → get_contest_service(contest_repo) → ContestService
  → get_game_record_repository(db) → GameRecordRepository
    → get_game_record_service(game_record_repo) → GameRecordService
```

## 배포 구성

```
Docker Compose:
  - PostgreSQL 17 (port 5433)

개발:
  - Backend: uv run uvicorn app.main:app --reload (port 8000)
  - Frontend: npm run dev (port 5173)
  - CORS: ALLOWED_ORIGINS=["http://localhost:5173"]
```

## 핵심 설계 결정

- API prefix 없음 (router는 root에 마운트)
- 랭킹 계산은 프론트엔드에서 수행 (전체 레코드 fetch 후 집계)
- JWT Access(단기) + Refresh(장기) 토큰 분리
- Relationship 로딩: 기본 `lazy="noload"`, 필요 시 `selectinload()` 명시
