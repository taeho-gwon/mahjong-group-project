# ADR: ContestType.overall → aggregate 리네이밍 + 기간 필드 추가

**일자:** 2026-03-01
**상태:** 승인됨 (Manager)
**영향:** Breaking (DB 스키마 변경, API 응답 변경)

## 배경

- `overall`은 원래 그룹 전체 랭킹(all-time) 용도로 만들어졌으나, 실제 의도는 일간/주간/월간/연간/전체 등 **기간별 집계 랭킹**을 지원하는 것
- "overall"이라는 이름은 "전체"라는 뉘앙스가 강해서 기간 변형을 포함하기 어려움
- 현재 그룹당 overall 1개만 자동 생성되며, 직접 생성 불가

## 결정

### 1. ContestType 리네이밍
- `overall` → `aggregate`
- `regular`, `independent`는 그대로 유지

### 2. Contest 모델에 기간 필드 추가
```
period_start: datetime | None  (nullable, null = 제한 없음)
period_end:   datetime | None  (nullable, null = 제한 없음)
is_default:   bool             (default=False)
```
- 둘 다 null = 전체 기간 (all-time)
- period_start만 설정 = 해당 날짜부터
- 둘 다 설정 = 특정 기간

### 3. is_default 플래그
- 그룹 생성 시 자동 생성되는 all-time aggregate에 `is_default=True`
- `is_default=True`인 contest는 삭제 불가
- 사용자가 직접 만든 aggregate는 `is_default=False` → 삭제 가능

### 4. 비즈니스 로직 변경
- **create_contest**: aggregate 타입 직접 생성 허용 (기존 400 제한 제거)
  - 단, `is_default=True`는 API로 설정 불가 (서버에서 무시)
- **delete_contest**: `is_default=True`인 contest만 삭제 차단
- **aggregate 쿼리**: 기존 overall 로직 + period_start/period_end 기간 필터 추가
  - `played_at >= period_start AND played_at < period_end` 조건 추가

### 5. 프론트엔드 프리셋
- 백엔드는 임의 기간을 받고, 프론트에서 프리셋 제공:
  - 일간 (오늘), 주간 (이번 주), 월간 (이번 달), 연간 (올해), 전체 (기간 없음), 직접 설정

## 영향
- @agent-backend: 모델/스키마/서비스/테스트 변경
- @agent-devops: migration 필요 (contest_type enum 변경 + 컬럼 3개 추가)
- @agent-frontend: contest_type 값 변경 + aggregate 생성 UI + 기간 프리셋 UI
