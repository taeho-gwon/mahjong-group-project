# ADR: 랭킹 집계를 이벤트에서 분리

- **날짜**: 2026-03-03
- **상태**: 승인
- **영향**: BE, DevOps, FE 전체

## 배경

현재 aggregate event가 기간별 랭킹(일간/주간/월간/전체)을 담당하고 있으나, 본질적으로 "이벤트"가 아니라 "게임 기록의 기간별 집계 뷰"에 해당. event_type에 aggregate를 넣음으로써 is_default, preset_type, period_start/end, auto-rolling 등 복잡성이 증가.

## 결정

**랭킹 집계를 Event에서 완전히 분리한다.**

### Event 변경
- `event_type`: `regular`, `independent`만 유지 (aggregate 제거)
- 제거 필드: `is_default`, `preset_type`, `period_start`, `period_end`
- `is_closed`, `uma_*` 필드는 유지
- 각 이벤트 내부에서 자체 순위 표시

### Group에 랭킹 설정 추가
- `weekly_start_day`: int (0=월 ~ 6=일, default 0)
- `monthly_start_day`: int (1~28, default 1)

### 랭킹 계산 (FE)
- **그룹 랭킹**: regular 이벤트의 게임 기록을 기간별 필터링 후 계산
- **이벤트 랭킹**: 해당 이벤트의 게임 기록으로 계산
- 일간: 오늘 날짜 필터
- 주간: weekly_start_day 기준 주 시작~끝
- 월간: monthly_start_day 기준 월 시작~끝
- 전체: 필터 없음

### 제거되는 것
- aggregate event_type 및 관련 CRUD
- is_default (그룹 생성 시 자동 aggregate 생성)
- auto-rolling 로직
- preset_type enum

## 마이그레이션
- Breaking migration — 데이터 초기화 OK 승인됨
- Event 테이블에서 aggregate 관련 컬럼 제거
- Group 테이블에 ranking 설정 컬럼 추가

## 향후 확장
- 시간 단위 기간 설정 (별도 일감으로 진행 예정)
