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
