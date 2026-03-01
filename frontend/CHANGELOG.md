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

## TODO(@agent-frontend) — 게임 기록 관리 페이지 신규 + ContestDetailPage 정리

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

## 참고

- API 클라이언트: `src/api/client.ts` → Zustand store에서 accessToken 읽음
- 랭킹 계산: 백엔드 API 없음, 전체 레코드 fetch 후 프론트에서 계산
