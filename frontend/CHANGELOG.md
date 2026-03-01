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

## [2026-03-01] TODO(@agent-frontend) — 게임기록 삭제/수정 UI

### 작업 요청 by @agent-manager

**배경:**
- 삭제: 백엔드 `DELETE /game-records/{id}` 이미 완성. 프론트 연동만 하면 됨.
- 수정: 백엔드 `PUT /game-records/{id}` 구현 대기 중 (@agent-backend 먼저). API 완성 후 진행.

**의존성:** 수정 UI는 @agent-backend 작업 완료 후 진행

---

### Step 1 — 삭제 (백엔드 대기 불필요, 바로 구현)

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

## 참고

- API 클라이언트: `src/api/client.ts` → Zustand store에서 accessToken 읽음
- 랭킹 계산: 백엔드 API 없음, 전체 레코드 fetch 후 프론트에서 계산
