# 프로젝트 대시보드

> 마일스톤, API 동기화, ADR 인덱스만 관리.
> **활성 작업은 `docs/backlog.md` 참조.**
> 마지막 업데이트: 2026-03-03

---

## MVP 진행 상황

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 인증 (가입/로그인/토큰 갱신) | ✅ | BE+FE | |
| 그룹 CRUD + 멤버 관리 | ✅ | BE+FE | |
| 초대 링크 (생성/가입) | ✅ | BE+FE | |
| 공개 그룹 가입 | ✅ | FE | |
| 랭킹전 CRUD (aggregate/regular/independent) | ✅ | BE | |
| 랭킹전 aggregate UI | ✅ | FE | |
| 게임 기록 CRUD + 권한 | ✅ | BE+FE | |
| 랭킹 계산 (프론트엔드) | ✅ | FE | |
| 유저 프로필 | ✅ | BE+FE | |
| 401 토큰 자동 갱신 | ✅ | FE | |
| 그룹 탈퇴 UX | ✅ | FE | |
| 멤버 목록 정렬 통일 | ✅ | FE | |
| independent/regular 차이 UI | ✅ | FE | |
| **그룹 삭제 UI** | ✅ | FE | |
| **에러 페이지 (404/403)** | ✅ | FE | |
| **aggregate migration** | ✅ | DevOps | initial_schema 재생성으로 반영 |
| **배포 인프라 마무리** | ✅ | DevOps | entrypoint + nginx 보안/gzip/캐싱 |
| **BE 기술부채 해결** | ✅ | BE | 입력검증, 권한체크, 테스트 보강 (53개) |

---

## API 계약 동기화

| 엔드포인트 | 문서 반영 | 최종 확인 |
|------------|----------|-----------|
| Auth 전체 (/register, /login, /refresh, /me) | ✅ | 2026-03-01 |
| Group CRUD 전체 | ✅ | 2026-03-01 |
| Event CRUD 전체 (aggregate 포함) | ✅ | 2026-03-02 |
| GameRecord CRUD 전체 | ✅ | 2026-03-01 |
| GET /users/{id} | ✅ | 2026-03-01 |
| POST /groups/{id}/invite-link | ✅ | 2026-03-01 |
| POST /events/{id}/close | ✅ | 2026-03-02 |
| GET /announcements | ✅ | 2026-03-02 |
| GET /announcements/{id} | ✅ | 2026-03-02 |

---

## ADR (아키텍처 결정 기록)

| 파일 | 주제 | 날짜 |
|------|------|------|
| `2026-03-01-infra-directory-restructure.md` | infra 디렉토리 구조 개편 | 2026-03-01 |
| `2026-03-01-rename-overall-to-aggregate.md` | ContestType overall→aggregate + 기간 필드 | 2026-03-01 |
| `2026-03-03-separate-ranking-from-events.md` | 랭킹 집계를 Event에서 분리, Group 설정으로 이동 | 2026-03-03 |
| `2026-03-03-nickname-feature.md` | 닉네임 기능 (글로벌 + 그룹별, 그룹 내 유니크) | 2026-03-03 |
| `2026-03-03-rbac-refinement.md` | 역할별 권한 정비 (그룹 조회, 이벤트 생성/수정/삭제) | 2026-03-03 |
