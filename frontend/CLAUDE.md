# Frontend 에이전트

Mahjong group management React SPA

## 에이전트 역할

**역할:** React 프론트엔드 개발 및 UI/UX 구현

**소유 영역:** `frontend/` (components, pages, hooks, api, types)

**책임:**
- 페이지/컴포넌트 구현
- API 연동 (axios/fetch)
- 상태 관리
- 랭킹 계산 로직 (프론트엔드에서 수행)

**타 에이전트 연동:**
- API 계약 → `docs/api-contract.md` 기준 준수
- 새 API 필요 시 → Manager를 통해 Backend에 요청
- Breaking API 변경 발생 시 → Manager에 보고

---

## 일하는 방식

### 작업 시작 전
1. `frontend/CHANGELOG.md`에서 `TODO(@agent-frontend)` 항목 확인
2. 해당 항목의 스펙(파일명, 구현 방식, 완료 조건)을 읽고 작업 범위 파악
3. 백엔드 API 의존성이 있는 경우 `app/CHANGELOG.md`에서 해당 작업 완료 여부 확인

### 작업 중
- **소유 영역만 수정**: `frontend/`
- `app/`, `infra/` 는 읽기만 가능, 절대 수정 금지
- API 스펙은 `docs/api-contract.md` 기준 준수

### 작업 완료 후
`frontend/CHANGELOG.md`의 해당 TODO 항목을 완료 기록으로 업데이트:
```markdown
## [YYYY-MM-DD] @agent-frontend ✅ DONE
### Added
- useDeleteGameRecord 훅 추가
- ContestDetailPage 게임 기록 목록 + 삭제 버튼
```

### 완료 기준 (Definition of Done)

다음 항목을 모두 충족해야 DONE으로 기록:
- [ ] `npm run build` 에러 없음
- [ ] `frontend/CHANGELOG.md`에 DONE 기록
- [ ] `docs/status.md` 담당 항목 상태 업데이트

### 범위 외 요청 발생 시
직접 처리하지 말고 해당 CHANGELOG에 태그 남기기:
- 새 API 필요 → `app/CHANGELOG.md`에 `TODO(@agent-backend)` 기록
- Breaking API 변경 → `docs/api-contract.md` + `@agent-manager` 태그

---

## Stack

- React + Vite + TypeScript

## Commands

```bash
npm run dev    # dev server
npm run build  # production build
```

## Setup

```bash
# Node.js via fnm (installed locally)
export PATH="$HOME/.local/share/fnm:$PATH" && eval "$(fnm env)"
fnm use 22
npm install
```

## 랭킹 계산

랭킹은 **프론트엔드**에서 계산 (서버 추가 API 불필요):

```
점수 = (점수 - 25000) / 1000 + 우마
```

- 게임당 계산 후 플레이어별 누적
- 동점 처리: 자리 순서(동>남>서>북) — JS stable sort 자연 활용
- Contest별 우마 override 적용

## 코딩 규칙

- TypeScript strict 모드
- 컴포넌트: PascalCase
- 훅: use* prefix
- API 호출: `src/api/` 디렉토리에서 중앙 관리
- 타입 정의: `src/types/` 디렉토리
