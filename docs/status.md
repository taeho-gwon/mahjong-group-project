# 전체 작업 현황 대시보드

> Manager 에이전트가 관리. 작업 지시 시 동시 업데이트.
> 마지막 업데이트: 2026-03-01

---

## 현재 진행 가능한 작업

현재 할당된 작업 없음.

---

## 완료된 작업

| 작업 | 담당 | 완료일 |
|------|------|--------|
| GameRecord 모델 + API (`POST /game-records`, `GET`, `DELETE`) | @agent-backend | 2026-03-01 |
| 게임기록 수정 API (`PUT /game-records/{id}`) | @agent-backend | 2026-03-01 |
| 게임기록 삭제 UI | @agent-frontend | 2026-03-01 |
| 게임기록 수정 UI (`/game-records/:id/edit`) | @agent-frontend | 2026-03-01 |
| Contest 모델 + API CRUD | @agent-backend | 2026-03-01 |
| Contest 랭킹/관리 페이지 | @agent-frontend | 2026-03-01 |
| Group 초대 링크 API (`POST /groups/{id}/invite-link`) | @agent-backend | 2026-03-01 |
| Group 초대 링크 UI | @agent-frontend | 2026-03-01 |
| UX 개선 (토스트 알림/로딩 스피너/점수 검증) | @agent-frontend | 2026-03-01 |
| 게임 기록 관리 페이지 신규 + ContestDetailPage 정리 | @agent-frontend | 2026-03-01 |
| Group 관리 페이지 (멤버 역할 변경, 강퇴) | @agent-frontend | 2026-03-01 |
| 마이그레이션 완료 (users, groups, contests, game_records 포함) | @agent-devops | 2026-03-01 |
| 백엔드 API 통합 테스트 작성 (31개 통과) | @agent-backend | 2026-03-01 |
| 게임기록 수정/삭제 권한 변경 (owner/admin 전용) | @agent-backend | 2026-03-01 |

---

## api-contract.md 동기화 상태

| 엔드포인트 | 문서 반영 | 최종 확인 |
|------------|----------|-----------|
| `PUT /game-records/{id}` | ✅ | 2026-03-01 |
| `DELETE /game-records/{id}` | ✅ | 2026-03-01 |
| `POST /game-records` | ✅ | 2026-03-01 |
| `POST /groups/{id}/invite-link` | ✅ | 2026-03-01 |
| Contest CRUD 전체 | ✅ | 2026-03-01 |
| Group CRUD 전체 | ✅ | 2026-03-01 |

---

## 아키텍처 결정 기록 (ADR)

| 파일 | 주제 | 날짜 |
|------|------|------|
| `docs/decisions/` 확인 필요 | — | — |

---

## 상태 기호

| 기호 | 의미 |
|------|------|
| ✅ DONE | 완료 |
| 🔄 진행 가능 | 선행 의존성 없음, 즉시 착수 가능 |
| ⏳ 대기 중 | 선행 작업 완료 필요 |
| 🚧 진행 중 | 에이전트 작업 중 |
