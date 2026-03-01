# 프로젝트 대시보드

> Manager가 한눈에 현황을 파악하기 위한 단일 소스.
> **모든 에이전트는 작업 완료(DONE) 시 이 파일의 해당 섹션을 반드시 업데이트한다.**
> 마지막 업데이트: 2026-03-02

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

## 활성 TODO 목록

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| Contest 종료 기능 (모델/스키마/서비스/API/테스트) | ✅ | BE | is_closed + preset_type + close API (60 tests) |
| Contest 종료 migration | ✅ | DevOps | 0dfadc37485c 적용 완료 |
| Contest 종료 UI + Auto-Rolling Aggregate | ✅ | FE | 마감 UI + auto-roll 훅 완료 |
| **Contest → Event 리네이밍 (BE)** | ✅ | BE | 모델/스키마/서비스/API/테스트 전체 (60 tests) |
| **Contest → Event migration** | ✅ | DevOps | initial_schema 재생성 (e7340feacebb) |
| **Contest → Event 리네이밍 (FE)** | ✅ | FE | 파일/코드/라우트/UI라벨 전체 완료 |
| **UI 라벨 "그룹" → "모임" 변경** | ✅ | FE | 토스트/페이지제목/버튼/에러메시지 전체 완료 |
| **안내문 조회 API** | ✅ | BE | GET /announcements, GET /announcements/{id} |
| **API /api prefix 추가** | ✅ | BE | 모든 API 경로 /api/... 로 변경 (62 tests) |
| **게임 기록 중복 플레이어 방지** | ✅ | BE | 생성/수정 시 4명 중복 체크 |
| **announcements migration** | ✅ | DevOps | e72e21f9f8a2 적용 완료 |
| **nginx /api/ proxy 규칙 변경** | ✅ | DevOps | location /api/ prefix match |
| **FE API base URL /api prefix 추가** | ✅ | FE | src/api/client.ts BASE_URL 변경 |
| **FE 메인 페이지 안내문 표시** | ✅ | FE | API 연동 + MainPage 안내 섹션 |
| **FE 게임 기록 중복 선택 방지** | ✅ | FE | 드롭다운 disabled + 제출 차단 |
| **안내문 API 인증 제거** | ✅ | BE | GET /announcements 비로그인 허용 |
| **FE 안내문을 로그인/회원가입/메인에 표시** | ✅ | FE | AnnouncementSection 공통 컴포넌트 + 3개 페이지 |

---

## 최근 완료된 작업

| 작업 | 담당 | 완료일 |
|------|------|--------|
| FE 안내문을 로그인/회원가입/메인 페이지에 표시 (AnnouncementSection 컴포넌트) | FE | 2026-03-02 |
| 안내문 API 인증 제거 (GET /announcements 비로그인 허용) | BE | 2026-03-02 |
| FE 게임 기록 동일 인물 중복 선택 방지 (disabled + 제출 차단) | FE | 2026-03-02 |
| FE API base URL /api prefix 추가 (client.ts) | FE | 2026-03-02 |
| FE 메인 페이지 안내문 표시 (useAnnouncements + MainPage 섹션) | FE | 2026-03-02 |
| nginx /api/ proxy 규칙 변경 (location /api/ prefix match) | DevOps | 2026-03-02 |
| announcements 테이블 migration (e72e21f9f8a2) | DevOps | 2026-03-02 |
| 게임 기록 중복 플레이어 방지 (생성/수정 시 4명 중복 체크, 62 tests) | BE | 2026-03-02 |
| API /api prefix 추가 (main.py + 테스트 전체 경로 변경) | BE | 2026-03-02 |
| 안내문 조회 API (GET /announcements, GET /announcements/{id}) | BE | 2026-03-02 |
| UI 라벨 "그룹" → "모임" 전체 변경 | FE | 2026-03-02 |
| Contest → Event 전체 리네이밍 (FE 파일/코드/라우트/UI라벨) | FE | 2026-03-02 |
| Contest → Event migration (initial_schema 재생성) | DevOps | 2026-03-02 |
| Contest → Event 전체 리네이밍 (BE 모델/스키마/서비스/API/테스트) | BE | 2026-03-02 |
| Contest 종료 UI + Auto-Rolling Aggregate | FE | 2026-03-01 |
| GroupCreate에서 UmaFields 제거 (BE 스키마/repo/service) | BE | 2026-03-01 |
| Contest 종료 migration (is_closed + preset_type) | DevOps | 2026-03-01 |
| Contest 종료 기능 (BE 모델/서비스/API, 60 tests) | BE | 2026-03-01 |
| 그룹 생성 폼 우마 입력 제거 | FE | 2026-03-01 |
| 그룹 생성 페이지 분리 (MyPage → /groups/new) | FE | 2026-03-01 |
| overall → aggregate 리네이밍 + 기간 필드 (39 tests) | BE | 2026-03-01 |
| 유저 프로필 API (GET /users/{id}, 38 tests) | BE | 2026-03-01 |
| 초대 링크 API 수정 (invite_url + expires_at) | BE | 2026-03-01 |
| 유저 프로필 페이지 + 유저명 링크 | FE | 2026-03-01 |
| 공개 그룹 가입 버튼 | FE | 2026-03-01 |
| 그룹 탈퇴 UX (useLeaveGroup + GroupDetailPage 버튼) | FE | 2026-03-01 |
| 멤버 목록 정렬 통일 (owner→admin→member) | FE | 2026-03-01 |
| independent/regular 차이 UI | FE | 2026-03-01 |
| Access Token 자동 갱신 (401 인터셉터) | FE | 2026-03-01 |
| 버그 수정 3건 (overall→contest_type, overall 선택지 제거) | FE | 2026-03-01 |
| AGENTS.md 거버넌스 확인 | FE | 2026-03-01 |
| AGENTS.md 거버넌스 확인 | DevOps | 2026-03-01 |
| aggregate migration (initial_schema 재생성) | DevOps | 2026-03-01 |
| MVP 배포 인프라 마무리 (entrypoint + nginx 보안) | DevOps | 2026-03-01 |
| 프로덕션 배포 준비 (nginx 라우트 수정, 로깅, 백업 스크립트) | DevOps | 2026-03-01 |
| 종합 거버넌스 규칙 (AGENTS.md) | Manager | 2026-03-01 |
| ADR: overall → aggregate 리네이밍 | Manager | 2026-03-01 |
| 랭킹전 aggregate UI (ContestCreate/Manage/Detail 기간 필드, GroupRanking is_default) | FE | 2026-03-01 |
| 그룹 삭제 UI (useDeleteGroup + GroupManagePage 위험 구역) | FE | 2026-03-01 |
| 에러 페이지 (NotFoundPage 404 + ForbiddenPage 403) | FE | 2026-03-01 |
| 기술부채 해결 (입력검증, 권한체크, type:ignore 제거, 테스트 39→53) | BE | 2026-03-01 |
| AGENTS.md 거버넌스 확인 | BE | 2026-03-01 |

---

## 에이전트 피드백/이슈

| 출처 | 내용 | 상태 |
|------|------|------|
| DevOps | `scripts/` 소유권 미정의 | ✅ 해결 (AGENTS.md에 DevOps로 추가) |

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

---

## 상태 기호

| 기호 | 의미 |
|------|------|
| ✅ | 완료 |
| ⏳ | 대기 중 (TODO 배정됨) |
| 🚧 | 진행 중 |
| ❌ | 차단됨 / 이슈 |
