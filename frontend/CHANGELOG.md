# Frontend Agent Changelog

작업 단위: 페이지/기능 하나씩. 변경 후 이 파일을 업데이트할 것.

---

## [2026-03-01] @agent-frontend

### Migrated
- 프론트엔드 상태관리 전면 교체
  - 서버 상태: React Query v5 (`@tanstack/react-query`)
  - 클라이언트 상태: Zustand + persist middleware (`src/stores/authStore.ts`)
  - 스타일: Tailwind CSS v4 (`@tailwindcss/vite` 플러그인)

### Added
- Query 훅: `src/hooks/` 디렉토리
  - `useMe`, `usePublicGroups`, `useMyGroups`, `useGroupDetail`
  - `useContests`, `useContest`, `useContestGameRecords`
- Mutation 훅: `src/hooks/mutations/` 디렉토리
  - `useCreateGroup`, `useUpdateGroup`
  - `useCreateContest`, `useUpdateContest`, `useDeleteContest`
  - `useCreateGameRecord`, `useUpdateMemberRole`, `useRemoveMember`

### Added
- Contest 기능 구현
  - ContestRankingPage: 랭킹 계산 프론트엔드에서 수행
  - ContestManagePage: 컨테스트 CRUD
  - 점수 공식: `(점수 - 25000) / 1000 + 우마` (게임당 누적)
  - 동점 처리: 자리 순서 (동>남>서>북)

### Added
- 그룹 관리 기능
  - GroupManagePage: 그룹 설정, 멤버 관리 (역할 변경, 강퇴)
  - GroupRankingPage: 전체 랭킹 표시

---

## [2026-03-01] @agent-frontend ✅ DONE — 게임기록 삭제 UI

### Added
- `src/api/gameRecords.ts` — `deleteGameRecord(recordId)` 함수 추가
- `src/hooks/mutations/useDeleteGameRecord.ts` — 삭제 mutation 훅 (onSuccess: `['gameRecords', 'contest', contestId]` invalidate)
- `ContestDetailPage.tsx` — 랭킹 테이블 아래 게임 기록 목록 섹션 추가
  - 각 row: 날짜, 동/남/서/북 플레이어명+점수
  - `record.created_by_id === user?.id` 인 경우에만 삭제 버튼 표시
  - 삭제 버튼 클릭 → confirm 후 mutation 실행

---

## [2026-03-01] @agent-frontend ✅ DONE — 게임기록 수정 UI

### Added
- `src/api/gameRecords.ts` — `getGameRecord(recordId)`, `GameRecordUpdate` 인터페이스, `updateGameRecord(recordId, data)` 추가
- `src/hooks/useGameRecord.ts` — `GET /game-records/{id}` 쿼리 훅
- `src/hooks/mutations/useUpdateGameRecord.ts` — 수정 mutation 훅 (onSuccess: gameRecord + gameRecords invalidate)
- `src/pages/GameRecordEditPage.tsx` — 수정 페이지 (기존 값 pre-fill, 그룹 멤버 선택, PUT 제출)
- `App.tsx` — `/game-records/:recordId/edit` route 추가
- `ContestDetailPage.tsx` — 게임 기록 목록에 수정 버튼 추가 (삭제 버튼 옆)

**1. `src/api/gameRecords.ts`에 추가**
```ts
export async function deleteGameRecord(recordId: number): Promise<void>
```

**2. `src/hooks/mutations/useDeleteGameRecord.ts` 신규**
- onSuccess: `['gameRecords', 'contest', contestId]` invalidate

**3. `ContestDetailPage.tsx` — 랭킹 테이블 아래 게임 기록 목록 섹션 추가**
- 이미 `records` 데이터가 있으므로 추가 fetch 불필요
- 각 row: 날짜, 동/남/서/북 플레이어명+점수
- `record.created_by_id === user?.id` 인 경우에만 삭제 버튼 표시
- 삭제 버튼 클릭 → confirm 후 mutation 실행

---

### Step 2 — 수정 (@agent-backend PUT API 완성 후)

**1. `src/api/gameRecords.ts`에 추가**
```ts
export interface GameRecordUpdate { /* 모두 optional */ }
export async function updateGameRecord(recordId: number, data: GameRecordUpdate): Promise<GameRecordResponse>
```

**2. `src/hooks/mutations/useUpdateGameRecord.ts` 신규**
- onSuccess: `['gameRecords', 'contest', contestId]` invalidate

**3. `src/pages/GameRecordEditPage.tsx` 신규**
- route: `/game-records/:recordId/edit`
- 기존 `GameRecordCreatePage` 와 동일한 폼 구조 (플레이어 선택 + 점수 입력)
- 진입 시 `GET /game-records/{id}` 로 기존 값 fetch해서 pre-fill
- 그룹 멤버 목록: record의 `group_id` 사용
- 제출 → `PUT /game-records/{id}`

**4. `App.tsx`에 route 추가**
```tsx
<Route path="/game-records/:recordId/edit" element={<GameRecordEditPage />} />
```

**5. `ContestDetailPage.tsx`의 삭제 버튼 옆에 수정 버튼 추가**
- `navigate(`/game-records/${record.id}/edit`)`

---

## [2026-03-01] @agent-frontend ✅ DONE — 그룹 초대 링크 UI

### Added/Fixed
- `src/api/groups.ts` — `generateInviteLink` 반환 타입 `{ invite_token }` → `{ invite_url, expires_at }` 수정 (API 계약서 기준)
- `src/hooks/mutations/useGenerateInviteLink.ts` — mutation 훅 신규
- `GroupManagePage.tsx` — Invite Link 섹션 개선
  - "초대 링크 생성" / "Regenerate Link" 버튼
  - 생성된 링크 텍스트 표시 + "복사" 버튼 (`navigator.clipboard.writeText`)
  - 만료 시각 표시 (`expires_at`)

---

## [2026-03-01] @agent-frontend ✅ DONE — UX 개선 (토스트 알림 / 로딩 상태 / 점수 검증)

### 작업 요청 by @agent-manager

**승인된 외부 의존성 추가:** `sonner` (토스트 알림 라이브러리)

---

### A-1. 토스트 알림 (sonner)

**설치:**
```bash
npm install sonner
```

**`src/App.tsx`에 Toaster 추가:**
```tsx
import { Toaster } from 'sonner'
// JSX 최상단 (Router 내부)에 추가
<Toaster position="top-right" richColors />
```

**각 mutation 훅 onSuccess/onError에 토스트 추가:**

| 훅 | onSuccess 메시지 |
|----|----------------|
| useCreateGameRecord | "게임 기록이 등록됐습니다" |
| useUpdateGameRecord | "게임 기록이 수정됐습니다" |
| useDeleteGameRecord | "게임 기록이 삭제됐습니다" |
| useCreateContest | "랭킹전이 생성됐습니다" |
| useUpdateContest | "랭킹전이 수정됐습니다" |
| useDeleteContest | "랭킹전이 삭제됐습니다" |
| useCreateGroup | "그룹이 생성됐습니다" |
| useUpdateGroup | "그룹 설정이 저장됐습니다" |
| useUpdateMemberRole | "멤버 역할이 변경됐습니다" |
| useRemoveMember | "멤버가 강퇴됐습니다" |

onError 공통 (모든 훅):
```ts
onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요')
```

---

### A-2. 로딩 상태

**페이지 로딩 중 스피너:**
- `isLoading === true` 일 때 페이지 중앙에 스피너 표시
- `src/components/Spinner.tsx` 공용 컴포넌트로 만들어서 재사용

**mutation 진행 중 버튼 비활성화:**
- `isPending === true` 일 때 제출 버튼 `disabled` + 텍스트 "처리 중..." 으로 변경
- 적용 대상: 게임 기록 등록/수정, 랭킹전 생성/수정, 그룹 생성/수정 폼

---

### A-3. 점수 합계 검증

적용 파일: `GameRecordCreatePage`, `GameRecordEditPage`

- 동/남/서/북 4개 점수 입력 시 합계 실시간 계산
- 폼 하단에 합계 표시:
  - 정상: `합계: 100,000 ✅` (초록)
  - 오류: `합계: 98,000 ❌ (100,000이어야 합니다)` (빨강)
- 합계 !== 100,000 이면 제출 버튼 `disabled`

---

**완료 조건:**
- `npm run build` 에러 없음
- 모든 mutation에 성공/실패 토스트 표시
- 페이지 로딩 중 스피너 표시, mutation 중 버튼 비활성화
- 게임 기록 폼에서 합계 100,000 검증 동작
- `frontend/CHANGELOG.md` DONE 기록
- `docs/status.md` 항목 업데이트

---

## [2026-03-01] @agent-frontend ✅ DONE — 게임 기록 관리 페이지 신규 + ContestDetailPage 정리

### 작업 요청 by @agent-manager

**배경:**
- 게임 기록 수정/삭제 권한이 그룹 owner/admin 전용으로 변경됨
- 조회(ContestDetailPage)와 관리(신규 페이지)를 역할 분리

**추가 API 없음** — 기존 `GET /game-records?group_id=`, `PUT`, `DELETE` 재활용

---

### 1. `src/pages/GameRecordManagePage.tsx` 신규

**라우트:** `/groups/:groupId/records/manage`

**접근 제어:**
- `useGroupDetail(groupId)`로 현재 유저의 role 확인
- role이 `owner` 또는 `admin`이 아니면 접근 불가 메시지 표시 (또는 redirect)
- owner는 admin의 상위 존재 — `['owner', 'admin'].includes(myRole)` 로 체크

**화면 구성:**
- 상단: 그룹명 + "기록 관리" 제목
- 기록 목록 테이블:

| 날짜 | 컨테스트 | 동(점수) | 남(점수) | 서(점수) | 북(점수) | 수정 | 삭제 |
|------|---------|---------|---------|---------|---------|------|------|

- 데이터: `useContestGameRecords` 대신 `GET /game-records?group_id={id}` 사용
  → 기존 `useContestGameRecords` hook을 참고해 `useGroupGameRecords(groupId)` 신규 추가
- **수정 버튼**: `navigate('/game-records/:id/edit')` → 기존 `GameRecordEditPage` 재활용
- **삭제 버튼**: confirm 후 `useDeleteGameRecord` mutation 실행

---

### 2. `src/hooks/useGroupGameRecords.ts` 신규

```ts
// GET /game-records?group_id={groupId}&size=100
// queryKey: ['gameRecords', 'group', groupId]
```

---

### 3. `App.tsx` — 라우트 추가

```tsx
<Route path="/groups/:groupId/records/manage" element={<GameRecordManagePage />} />
```

---

### 4. `GroupManagePage.tsx` — 기록 관리 링크 추가

- "기록 관리" 버튼/링크 추가 (owner/admin에게만 표시)
- `navigate('/groups/:groupId/records/manage')`

---

### 5. `ContestDetailPage.tsx` — 수정/삭제 버튼 제거

- 게임 기록 목록의 수정 버튼, 삭제 버튼 모두 제거
- 이 페이지는 순수 조회 전용으로 역할 고정

---

**완료 조건:**
- `npm run build` 에러 없음
- owner/admin만 `/groups/:groupId/records/manage` 접근 가능
- 수정 버튼 → `GameRecordEditPage` 정상 이동
- 삭제 버튼 → confirm 후 정상 삭제 + 목록 갱신
- ContestDetailPage에서 수정/삭제 버튼 제거 확인
- `frontend/CHANGELOG.md` DONE 기록
- `docs/status.md` 항목 업데이트

---

---

## [2026-03-01] @agent-frontend ✅ DONE — Contest 타입 UI 반영 + Group uma 제거

**선행 조건**: `infra/CHANGELOG.md`의 migration TODO가 DONE으로 완료된 후 실행

### 1. `src/api/contests.ts`
- `ContestResponse` 인터페이스에 `contest_type: 'overall' | 'regular' | 'independent'` 추가
- `ContestCreate` 인터페이스에 `contest_type?: 'regular' | 'independent'` 추가 (overall은 API 직접 생성 불가)

### 2. `src/api/groups.ts`
- `GroupResponse`에서 `uma_1st`, `uma_2nd`, `uma_3rd`, `uma_4th` 필드 제거
- `GroupCreate`의 uma 필드는 유지 (overall 생성 용도로 서버에 그대로 전달)

### 3. `src/pages/GameRecordCreatePage.tsx`
- Contest 선택 드롭다운에서 `contest_type === 'overall'` 항목 제외
- "없음 (전체에 포함)" 옵션 명확히 표시 → `contest_id = null` 전송

### 4. `src/pages/ContestManagePage.tsx`
- Contest 생성 폼에 `contest_type` 선택 추가: "일반 랭킹전 (regular)" / "독립 랭킹전 (independent)"
- overall 타입은 UI에 노출하지 않음 (생성 불가)
- 목록에서 overall contest: 삭제 버튼 숨김, 수정은 가능

### 5. `src/pages/ContestDetailPage.tsx`
- contest_type 배지 표시:
  - `overall` → "전체 랭킹" (또는 뱃지 색 구분)
  - `regular` → "일반"
  - `independent` → "독립"
- overall contest 조회 시 기존 `useContestGameRecords` 그대로 사용 (백엔드에서 special query 처리)

### 6. `src/pages/GameRecordManagePage.tsx`
- Contest 컬럼: `contest_id === null` 게임은 "전체 (미지정)" 으로 표시

### 7. 그룹 관련 페이지 (GroupManagePage 등)
- `GroupResponse`에서 uma 제거됨 — uma를 직접 표시하는 곳이 있으면 제거
- 그룹 랭킹 계산 시 overall contest의 uma 사용 (`useContests`로 overall contest fetch 후 uma 추출)

### 완료 조건
- [ ] `npm run build` 에러 없음
- [ ] 게임 등록 시 overall contest 선택 불가, "없음" 선택 시 null 전송 확인
- [ ] ContestManagePage에서 contest_type 선택 가능
- [ ] overall contest 삭제 버튼 숨김 확인
- [ ] `frontend/CHANGELOG.md` DONE 기록
- [ ] `docs/status.md` 업데이트

---

## [2026-03-01] @agent-frontend ✅ DONE — 버그 수정 3건

### 버그 1: 초대 링크 응답 타입 확인
- `src/api/groups.ts`의 `generateInviteLink` 반환 타입이 이미 `{ invite_url: string; expires_at: string }`로 일치 — 변경 불필요

### 버그 2: GroupRankingPage — overall contest를 타입으로 탐색
- `src/pages/GroupRankingPage.tsx`에서 `c.name === '전체 랭킹'` → `c.contest_type === 'overall'`로 변경

### 버그 3: ContestCreate/ManagePage — overall 타입 선택지 제거
- `src/pages/ContestCreatePage.tsx` — contest_type 드롭다운에서 overall 옵션 제거
- `src/pages/ContestManagePage.tsx` — overall 타입 contest일 때 타입 변경 셀렉트 숨김, 삭제 버튼 숨김

---

## [2026-03-01] @agent-frontend ✅ DONE — independent vs regular 차이 UI 반영

### Changed
- `src/pages/ContestCreatePage.tsx` — contest_type select 아래에 합산 여부 설명 문구 추가
- `src/pages/ContestManagePage.tsx` — 동일하게 설명 문구 추가
- `src/pages/ContestDetailPage.tsx` — independent 배지 옆에 "전체 랭킹 미합산" 텍스트 추가

---

## [2026-03-01] @agent-frontend ✅ DONE — Access Token 자동 갱신 (401 인터셉터)

### Changed
- `src/api/client.ts` — `apiFetch`에 401 인터셉터 추가
  - 401 응답 시 refreshToken으로 `POST /auth/refresh` 호출
  - refresh 성공 → 새 토큰 저장 + 원래 요청 재시도
  - refresh 실패 → `clearTokens()` + `/login` 페이지 이동
  - `refreshPromise` 패턴으로 동시 다발 401 시 refresh 한 번만 호출
  - `/auth/*` 경로는 인터셉터 건너뛰어 재귀 방지
- `src/stores/authStore.ts` — `clearTokens()` 이미 존재, 변경 불필요

---

## [2026-03-01] @agent-frontend ✅ DONE — 그룹 탈퇴 UX 개선

### Added
- `src/hooks/mutations/useLeaveGroup.ts` — 탈퇴 mutation 훅 (invalidate + 토스트 + 홈 이동)
- `src/pages/GroupDetailPage.tsx` — 멤버(owner 제외) 하단에 "그룹 탈퇴" 버튼 추가 (confirm 후 mutation)

### Changed
- `src/pages/GroupManagePage.tsx` — 직접 `leaveGroup()` 호출 → `useLeaveGroup` mutation 훅으로 교체

---

## [2026-03-01] @agent-frontend ✅ DONE — 멤버 목록 정렬 순서 통일 (owner → admin → member)

### Changed
- `src/pages/GroupManagePage.tsx` — 멤버 목록에 역할 우선순위 정렬 추가 (owner → admin → member)
- `src/pages/GroupDetailPage.tsx` — 이미 정렬 적용됨, 변경 없음

---

## [2026-03-01] @agent-frontend ✅ DONE — 유저 프로필 페이지

### Added
- `src/api/users.ts` — `getUserProfile(userId)` API 함수 (`GET /users/{userId}`)
- `src/hooks/useUserProfile.ts` — 쿼리 훅 (queryKey: `['user', userId]`)
- `src/pages/UserProfilePage.tsx` — 유저 프로필 페이지 (유저명, 가입일, 공통 소속 그룹 목록, 본인이면 마이페이지 링크)
- `App.tsx` — `/users/:userId` 라우트 추가

### Changed
- `GroupDetailPage.tsx` — 멤버 목록 유저명에 `/users/{id}` 링크 추가
- `GroupManagePage.tsx` — 멤버 목록 유저명에 링크 추가
- `ContestDetailPage.tsx` — 랭킹 테이블 + 게임 기록 플레이어명에 링크 추가

---

## [2026-03-01] @agent-frontend ✅ DONE — 공개 그룹 가입 버튼

### Added
- `src/api/groups.ts` — `joinGroup(groupId)` 함수 추가 (`POST /groups/{id}/join`)
- `src/hooks/mutations/useJoinGroup.ts` — 가입 mutation 훅 (invalidate + 토스트 + 그룹 상세 이동)
- `src/pages/MainPage.tsx` — 공개 그룹 목록에 가입 버튼 추가
  - 로그인 상태에서만 표시
  - 이미 가입한 그룹은 "가입됨" 텍스트 표시
  - 미가입 그룹에 "가입" 버튼 → 클릭 시 mutation 실행

---

## [2026-03-01] @agent-frontend ✅ DONE — aggregate 타입 리네이밍 + 기간 프리셋 UI

### Changed
- `src/api/contests.ts` — `ContestType` overall → aggregate, `period_start`/`period_end`/`is_default` 필드 추가 (Response, Create, Update)
- 코드베이스 전체 `overall` → `aggregate` 치환 (GroupRankingPage, ContestDetailPage, ContestCreatePage, ContestManagePage, GameRecordCreatePage)
- `src/pages/GroupRankingPage.tsx` — default aggregate 탐색: `c.contest_type === 'aggregate' && c.is_default`
- `src/pages/ContestCreatePage.tsx` — aggregate 옵션 추가 + 기간 프리셋 UI (일간/주간/월간/연간/전체/직접 설정)
- `src/pages/ContestManagePage.tsx` — aggregate 기간 수정 UI + `is_default` 기반 삭제 로직 (is_default=true 삭제 불가)
- `src/pages/ContestDetailPage.tsx` — 배지 "집계" 표시 + aggregate 기간 정보 표시

---

## [2026-03-01] @agent-frontend ✅ DONE — AGENTS.md 거버넌스 규칙 확인

### 확인 결과
- **파일 소유권 매트릭스**: FE는 `frontend/` RW, `app/`·`infra/` R — `frontend/CLAUDE.md`의 "소유 영역만 수정" 규칙과 일치
- **CHANGELOG 프로토콜**: TODO/DONE 형식 일치 (TODO는 Manager만 작성, DONE은 FE가 업데이트)
- **교차 영역 규칙**: "남의 코드를 직접 수정하지 않는다" — `frontend/CLAUDE.md`의 "범위 외 요청" 규칙과 일치
- **충돌 없음**: `AGENTS.md`와 `frontend/CLAUDE.md` 간 규칙 충돌 발견되지 않음

---

## [2026-03-01] @agent-frontend ✅ DONE — 그룹 삭제 UI (MVP)

### Added
- `src/api/groups.ts` — `deleteGroup(groupId)` 함수 추가
- `src/hooks/mutations/useDeleteGroup.ts` — 삭제 mutation 훅 (invalidate + 토스트 + 홈 이동)
- `src/pages/GroupManagePage.tsx` — 위험 구역 섹션 추가 (owner만 삭제 버튼 표시, confirm 후 mutation)

---

## [2026-03-01] @agent-frontend ✅ DONE — 에러 페이지 (MVP)

### Added
- `src/pages/NotFoundPage.tsx` — 404 페이지 (홈 이동 링크)
- `src/pages/ForbiddenPage.tsx` — 403 페이지 (홈 이동 링크)
- `App.tsx` — catch-all `<Route path="*">` → NotFoundPage로 변경 (기존 Navigate to "/" 제거)

---

## 참고

- API 클라이언트: `src/api/client.ts` → Zustand store에서 accessToken 읽음
- 랭킹 계산: 백엔드 API 없음, 전체 레코드 fetch 후 프론트에서 계산
