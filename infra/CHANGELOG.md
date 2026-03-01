# DevOps Agent Changelog

작업 단위: 인프라/마이그레이션 변경 하나씩. 변경 후 이 파일을 업데이트할 것.

---

## [2026-03-02] @agent-devops ✅ DONE — nginx HTTP → HTTPS 강제 리다이렉트

### 확인 결과
- `nginx.conf` port 80 server block에 `return 301 https://$host$request_uri;` 이미 설정됨
- `curl http://mjgroup.duckdns.org/` → 301 → `https://mjgroup.duckdns.org/` 정상 리다이렉트 확인

### 완료 조건
- [x] `http://mjgroup.duckdns.org` 접속 시 HTTPS로 리다이렉트 확인
- [x] `infra/CHANGELOG.md` DONE 기록

---

## [2026-03-02] @agent-devops ✅ DONE — nginx proxy 규칙을 /api/ prefix로 변경

### Changed
- `infra/docker/nginx.conf` — API proxy 규칙 단순화
  - 기존: `location ~ ^/(auth|groups|events|game-records|users)(/|$)` (regex 패턴)
  - 변경: `location /api/` (prefix match)
  - 프론트엔드 SPA fallback (`try_files $uri $uri/ /index.html`) 유지
- BE에 `/api` prefix 추가 완료 확인 후 적용

### 완료 조건
- [x] 새로고침 시 프론트엔드 페이지 정상 표시 (SPA fallback 유지)
- [x] API 호출 `/api/...` 정상 프록시
- [x] `infra/CHANGELOG.md` DONE 기록

---

## [2026-03-02] @agent-devops ✅ DONE — announcements 테이블 migration

### Added
- `infra/db/versions/e72e21f9f8a2_add_announcements_table.py` — announcements 테이블 마이그레이션
  - 컬럼: `id`, `title` (String 255), `content` (Text), `is_active` (Boolean, default true), `created_at`, `updated_at`
  - `upgrade()` / `downgrade()` 모두 구현
- `infra/db/env.py` — `announcement` 모델 import 추가

### 완료 조건
- [x] `uv run alembic current` → `e72e21f9f8a2 (head)` ✅
- [x] `infra/CHANGELOG.md` DONE 기록

---

## [2026-03-02] @agent-devops ✅ DONE — Contest → Event 리네이밍 migration

### Migration 적용 — initial_schema 재생성 (데이터 초기화)
- 기존 migration 2개 삭제 (`e527fa9f2984`, `0dfadc37485c`)
- DB 스키마 전체 초기화 후 `initial_schema` 재생성 (`e7340feacebb`)
- `infra/db/env.py` import 수정: `contest` → `event`
- 테이블: `events` (구 `contests`), FK: `game_records.event_id`, enum: `eventtype`
- `is_closed`, `preset_type`, `is_default`, `period_start/end` 모두 포함
- `uv run alembic current` → `e7340feacebb (head)` ✅

---

## [2026-03-01] @agent-devops ✅ DONE — Contest 종료 기능 migration

### Migration 적용 — Contest 종료 + preset_type
- 마이그레이션 파일: `0dfadc37485c_add_contest_is_closed_and_preset_type.py`
- `contests` 테이블에 `is_closed` 컬럼 추가 (Boolean, NOT NULL, default false)
- `contests` 테이블에 `preset_type` 컬럼 추가 (Enum presettype, nullable)
- `downgrade()`에서 enum 타입 정리 포함
- `uv run alembic current` → `0dfadc37485c (head)` ✅

---

## [2026-03-01] @agent-devops ✅ DONE — 프로덕션 배포 준비

### Fixed
- `infra/docker/nginx.conf` — API 프록시 라우트에 `/game-records`, `/users` 추가
  - **이전**: `/auth`, `/groups`, `/contests`만 프록시 → 게임기록/유저 API가 프로덕션에서 404
  - **이후**: `^/(auth|groups|contests|game-records|users)(/|$)`
  - **⚠️ 승인 필요**: 배포 환경 설정 변경

### Changed
- `infra/docker/docker-compose.prod.yml` — 전 서비스에 로깅 설정 추가
  - json-file 드라이버, max-size 10m, 로그 로테이션 (backend 5개, db/nginx 3개)
  - **⚠️ 승인 필요**: 배포 환경 설정 변경
- `.env.prod.example` — 비밀번호/시크릿 생성 가이드 추가 (`openssl rand` 예시)

### Added
- `scripts/backup_db.sh` — PostgreSQL 백업 스크립트 (프로덕션용)
  - pg_dump + gzip 압축, 날짜별 파일명
  - `KEEP_DAYS` 환경변수로 오래된 백업 자동 정리 (기본 7일)
  - FYI(@agent-manager): `scripts/` 디렉토리 소유권이 AGENTS.md에 미정의. DevOps 범위로 판단하여 생성함

### Migration
- 기존 12개 마이그레이션 → 1개 `initial_schema`로 통합 재생성 (e527fa9f2984)
  - 최신 모델 반영: `contesttype` enum `overall→aggregate`, `period_start/end`, `is_default` 컬럼 포함
  - 이전 버전(bd7db8cf9814)은 모델 변경 미반영 → downgrade 후 재생성
  - orphaned enum 타입 수동 정리 (`joinpolicy`, `memberrole`, `rankingtype`, `contesttype`)
  - `uv run alembic current` → `e527fa9f2984 (head)` ✅
- `scripts/seed.py` — `ContestType.overall` → `ContestType.aggregate` 수정

---

## [2026-03-01] @agent-devops (기술 부채 해결)

### Fixed
- `alembic.ini` — ruff post_write_hook 활성화 (마이그레이션 파일 자동 포맷)
- `infra/docker/docker-compose.yml` — `name: mahjong` 추가 (volume 네임스페이스), `restart: unless-stopped` 추가
- `scripts/seed.py` — Contest 시드 데이터 추가 (정규 시즌, 승점제 리그), DELETE 순서에 contests 포함

### Added
- `scripts/dev_reset.sh` — DB 재시작 + 마이그레이션 + 시드를 한 번에 실행하는 개발용 스크립트
  - `bash scripts/dev_reset.sh` — 전체 초기화
  - `bash scripts/dev_reset.sh --no-seed` — 마이그레이션만

---

## [2026-03-01] @agent-devops

### Restructured
- `alembic/` → `infra/db/` 디렉토리로 이전
  - `infra/db/versions/` — 마이그레이션 파일
  - `infra/db/env.py` — Async Alembic 설정
  - `alembic.ini` — `script_location = infra/db` 로 업데이트
  - **영향**: @agent-backend — `uv run alembic` 명령어는 동일하게 동작

### Added
- `infra/docker/docker-compose.yml` — PostgreSQL 17 서비스 (port 5433)
  - user/pass/db: mahjong
  - Note: port 5432는 mahjongqna 프로젝트가 사용 중

---

---

## 마이그레이션 현황

- 현재 HEAD: `e72e21f9f8a2` (add_announcements_table)
- `e7340feacebb` — initial_schema (Contest→Event 리네이밍 반영)
- 이전 migration들은 초기화로 삭제됨

---

## 마이그레이션 실행 방법

```bash
# 마이그레이션 파일 생성 (Backend 에이전트 모델 변경 후)
uv run alembic revision --autogenerate -m "description"

# 검토 후 적용
uv run alembic upgrade head

# 롤백
uv run alembic downgrade -1
```

> Breaking 마이그레이션은 Manager 에이전트 승인 필요

---

## [2026-03-01] @agent-devops ✅ DONE — AGENTS.md 거버넌스 규칙 확인

### 확인 결과
- [x] `AGENTS.md` 확인 완료
- [x] `infra/CLAUDE.md`와 충돌 없음 확인
- [x] 피드백 기록

### 피드백
- FYI(@agent-manager): `scripts/` 디렉토리 소유권이 AGENTS.md 파일 소유권 매트릭스에 미정의
  - 현재 DevOps(`backup_db.sh`, `dev_reset.sh`, `seed.py`)와 BE 성격 스크립트가 혼재
  - 소유권 명시 또는 `scripts/infra/`, `scripts/data/` 등 하위 분류 권장

---

## [2026-03-01] @agent-devops ✅ DONE — MVP 배포 인프라 마무리

### Added
- `infra/docker/entrypoint.sh` — 배포 시 migration 자동 실행 후 서버 시작
- `Dockerfile.backend` — entrypoint.sh 사용하도록 변경 (CMD → entrypoint)

### Changed
- `infra/docker/nginx.conf` — 보안 헤더 + Gzip + 정적 파일 캐싱 추가
  - Gzip: text/plain, text/css, application/json, application/javascript, text/xml
  - 보안 헤더: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
  - 정적 파일(JS/CSS/이미지/폰트): 30일 캐시 + immutable

### 완료 확인
- [x] entrypoint.sh 생성 + Dockerfile 반영
- [x] nginx.conf 보안 헤더 + Gzip 추가
- [x] aggregate migration — initial_schema 재생성으로 이미 반영됨 (`e527fa9f2984`)
- [x] CHANGELOG DONE 기록
