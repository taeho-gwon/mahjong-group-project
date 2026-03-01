# ADR-001: infra/ 디렉토리 도입 및 alembic 이전

**날짜:** 2026-03-01
**상태:** Accepted
**결정자:** @agent-manager
**영향 에이전트:** @agent-backend, @agent-devops

---

## 배경

기존 프로젝트 루트에 `alembic/` 디렉토리가 존재했고, Docker 설정 파일도 루트에 산재해 있었다.
멀티에이전트 프레임워크 도입과 함께 DevOps 에이전트의 작업 범위를 명확히 분리할 필요가 생겼다.

---

## 결정

`alembic/` 디렉토리와 Docker 설정을 `infra/` 하위로 이전한다.

### 변경 전

```
project-root/
├── alembic/
│   └── versions/
├── alembic.ini
└── (docker 설정 산재)
```

### 변경 후

```
project-root/
├── infra/
│   ├── db/              # 구 alembic/
│   │   └── versions/
│   ├── docker/
│   │   └── docker-compose.yml
│   └── redis/           # 향후 사용
├── alembic.ini          # script_location = infra/db
└── infra/CLAUDE.md      # DevOps 에이전트 가이드
```

---

## 근거

1. **에이전트 경계 명확화**: DevOps 에이전트 작업 범위 = `infra/`로 단일화
2. **Backend 에이전트 책임 감소**: 마이그레이션 관리를 DevOps에 완전 위임
3. **확장성**: Redis, Nginx 등 향후 인프라 구성 요소 추가 시 `infra/` 하위에 일관되게 위치

---

## 영향

| 에이전트 | 변경 사항 |
|----------|----------|
| @agent-backend | `alembic revision` 명령어 직접 실행 금지. 모델 변경 시 CHANGELOG에 `@agent-devops` 태그 |
| @agent-devops | 작업 범위 = `infra/`. `uv run alembic` 명령어는 루트에서 동일하게 실행 |
| @agent-frontend | 영향 없음 |

---

## 후속 조치

- [x] `app/CLAUDE.md` scope에서 `alembic/versions/` 제거, `infra/db/` 읽기 전용으로 변경
- [x] `AGENTS.md` DevOps 에이전트 담당 범위 업데이트
- [x] DB 관리자 에이전트를 DevOps 에이전트로 통합 (역할 중복 제거)
- [x] Backend→DevOps 마이그레이션 핸드오프 절차 `app/CLAUDE.md`에 명문화
