# BE-FE API 계약서

Base URL: `http://localhost:8000/api` (dev)

> **이 파일은 단일 진실 공급원(Single Source of Truth)입니다.**
> API 변경 시 Backend 에이전트가 이 파일을 먼저 업데이트합니다.

---

## 인증 (`/auth`)

### POST /auth/register
```json
Request:  { "username": "string", "password": "string" }
Response: UserResponse
Status:   201
```

### POST /auth/login
```json
Request:  { "username": "string", "password": "string" }
Response: { "access_token": "string", "refresh_token": "string", "token_type": "bearer" }
Status:   200
```

### POST /auth/refresh
```json
Request:  { "refresh_token": "string" }
Response: { "access_token": "string", "refresh_token": "string", "token_type": "bearer" }
Status:   200
```

### GET /auth/me
```
Headers:  Authorization: Bearer {access_token}
Response: UserResponse
Status:   200
```

### PUT /auth/me
```json
Request:  { "nickname": "string|null" }
Response: UserResponse
Status:   200
Auth:     Required
Note:     기본 닉네임 설정/변경
```

---

## 그룹 (`/groups`)

### POST /groups
```json
Request:  {
  "name": "string",
  "description": "string|null",
  "join_policy": "public|private",
  "weekly_start_day": 0,
  "monthly_start_day": 1,
  "default_ranking_type": "score|match_point",
  "default_uma_1st": 30, "default_uma_2nd": 10, "default_uma_3rd": -10, "default_uma_4th": -30,
  "default_scoring_1st": 4, "default_scoring_2nd": 2, "default_scoring_3rd": 1, "default_scoring_4th": 0
}
Response: GroupResponse
Status:   201
Auth:     Required
Note:     weekly_start_day: 0-6 (0=Mon, 6=Sun), monthly_start_day: 1-28. 우마 합계 = 0 필수
```

### GET /groups
```
Query:    page=1&size=20
Response: { "items": [GroupResponse], "total": 100 }
Status:   200
Note:     공개 그룹 목록
```

### GET /groups/{id}
```
Response: GroupDetailResponse (members 포함)
Status:   200
```

### PUT /groups/{id}
```json
Request:  {
  "name"?, "description"?, "join_policy"?, "weekly_start_day"?, "monthly_start_day"?,
  "default_ranking_type"?, "default_uma_1st"?, "default_uma_2nd"?, "default_uma_3rd"?, "default_uma_4th"?,
  "default_scoring_1st"?, "default_scoring_2nd"?, "default_scoring_3rd"?, "default_scoring_4th"?
}
Response: GroupResponse
Status:   200
Auth:     Required (owner/admin)
Note:     우마 변경 시 4개 순위 모두 함께 제공 필수, 합계 = 0
```

### DELETE /groups/{id}
```
Status:   204
Auth:     Required (owner)
```

### POST /groups/join-by-invite
```json
Request:  { "invite_token": "string", "nickname": "string|null" }
Response: GroupResponse
Status:   200
Auth:     Required
Note:     nickname은 그룹 내 유니크 (중복 시 409)
```

### POST /groups/{id}/invite-link
```
Response: { "invite_url": "string", "expires_at": "datetime" }
Status:   200
Auth:     Required (owner/admin)
```

### POST /groups/{id}/join
```json
Request:  { "nickname": "string|null" }  (body optional)
Response: GroupResponse
Status:   200
Auth:     Required
Note:     public 그룹만 가능. nickname은 그룹 내 유니크 (중복 시 409)
```

### DELETE /groups/{id}/leave
```
Status:   204
Auth:     Required
```

### DELETE /groups/{id}/members/{user_id}
```
Status:   204
Auth:     Required (owner/admin)
```

### PUT /groups/{id}/members/{user_id}/nickname
```json
Request:  { "nickname": "string|null" }
Response: MemberInfo
Status:   200
Auth:     Required (본인 또는 owner/admin)
Note:     그룹 내 유니크 (중복 시 409). null로 설정하면 닉네임 삭제
```

### PUT /groups/{id}/members/{user_id}/role
```json
Request:  { "role": "admin|member" }
Response: MemberInfo
Status:   200
Auth:     Required (owner)
```

---

## 안내문 (`/announcements`)

### GET /announcements
```
Query:    page=1&size=20
Response: [AnnouncementResponse]
Status:   200
Auth:     Not required
```

### GET /announcements/{id}
```
Response: AnnouncementResponse
Status:   200
Auth:     Not required
```

### AnnouncementResponse
```json
{
  "id": 1,
  "title": "string",
  "content": "string",
  "is_active": true,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

> **주의**: 조회 전용 API. 안내문 생성/수정/삭제는 DB에서 직접 관리.

---

## 유저 (`/users`)

### GET /users/{id}
```
Response: UserProfileResponse
Status:   200
Auth:     Required
```

### UserResponse
```json
{
  "id": 1,
  "username": "string",
  "nickname": "string|null",
  "is_active": true,
  "created_at": "datetime"
}
```

### UserProfileResponse
```json
{
  "id": 1,
  "username": "string",
  "nickname": "string|null",
  "created_at": "datetime",
  "shared_groups": [{ "id": 1, "name": "string" }]
}
```

> `shared_groups`: 조회자와 대상 유저가 모두 소속된 그룹 목록

---

## 이벤트 (`/events`)

### POST /events
```json
Request:  {
  "group_id": 1,
  "name": "string",
  "ranking_type": "score|match_point",
  "event_type": "regular|independent",
  "uma_1st": 30, "uma_2nd": 10, "uma_3rd": -10, "uma_4th": -30,
  "scoring_1st": 4, "scoring_2nd": 2, "scoring_3rd": 1, "scoring_4th": 0
}
Response: EventResponse
Status:   201
Auth:     Required
```

### GET /events?group_id={id}
```
Query:    group_id={id}&page=1&size=100
Response: { "items": [EventResponse], "total": 100, "page": 1, "size": 100 }
Status:   200
Auth:     Required (그룹 멤버)
Note:     기본 size=100 (max 200). FE에서 전체 로드하는 패턴에 맞춰 크게 설정
```

### GET /events/{id}
```
Response: EventResponse
Status:   200
Auth:     Required (그룹 멤버)
```

### PUT /events/{id}
```json
Request:  { "name"?, "ranking_type"?, "uma_1st", "uma_2nd", "uma_3rd", "uma_4th"? }
Response: EventResponse
Status:   200
Auth:     Required (생성자)
Note:     uma 4개는 일괄 업데이트
```

### POST /events/{id}/close
```
Response: EventResponse
Status:   200
Auth:     Required (그룹 owner/admin)
Note:     이미 마감된 event → 400, 그룹 없는 event → 403
```

### DELETE /events/{id}
```
Status:   204
Auth:     Required (생성자)
```

---

## 게임 기록 (`/game-records`)

### POST /game-records
```json
Request:  {
  "east_player_id": 1, "south_player_id": 2, "west_player_id": 3, "north_player_id": 4,
  "east_point": 35000, "south_point": 25000, "west_point": 20000, "north_point": 20000,
  "group_id": 1,
  "event_id": 1,
  "game_link": "string|null",
  "played_at": "datetime|null"
}
Response: GameRecordResponse
Status:   201
Auth:     Required
```

### GET /game-records
```
Query:    page=1&size=20&group_id={id}&event_id={id}
Response: { "items": [GameRecordResponse], "total": 100, "page": 1, "size": 20 }
Status:   200
Auth:     Required (그룹 멤버)
Note:     group_id, event_id 중 하나 이상 지정 권장
```

### GET /game-records/{id}
```
Response: GameRecordResponse
Status:   200
Auth:     Required (그룹 멤버)
```

### PUT /game-records/{id}
```json
Request:  {
  "east_player_id"?: 1, "south_player_id"?: 2, "west_player_id"?: 3, "north_player_id"?: 4,
  "east_point"?: 35000, "south_point"?: 25000, "west_point"?: 20000, "north_point"?: 20000,
  "game_link"?: "string|null",
  "played_at"?: "datetime|null"
}
Response: GameRecordResponse
Status:   200
Auth:     Required (해당 그룹의 owner/admin만 가능)
```

### DELETE /game-records/{id}
```
Status:   204
Auth:     Required (해당 그룹의 owner/admin만 가능)
```

---

### GameRecordResponse
```json
{
  "id": 1,
  "group_id": 1,
  "event_id": 1,
  "created_by_id": 1,
  "east_player":  { "id": 1, "username": "string" },
  "south_player": { "id": 2, "username": "string" },
  "west_player":  { "id": 3, "username": "string" },
  "north_player": { "id": 4, "username": "string" },
  "east_point": 35000, "south_point": 25000, "west_point": 20000, "north_point": 20000,
  "game_link": "string|null",
  "played_at": "datetime",
  "created_at": "datetime"
}

---

## 공통 응답 스키마

### GroupResponse
```json
{
  "id": 1,
  "name": "string",
  "description": "string|null",
  "owner_id": 1,
  "join_policy": "public|private",
  "weekly_start_day": 0,
  "monthly_start_day": 1,
  "default_ranking_type": "score|match_point",
  "default_uma_1st": 30, "default_uma_2nd": 10, "default_uma_3rd": -10, "default_uma_4th": -30,
  "default_scoring_1st": 4, "default_scoring_2nd": 2, "default_scoring_3rd": 1, "default_scoring_4th": 0,
  "is_active": true,
  "created_at": "datetime"
}
```

### GroupDetailResponse
```json
{
  ...GroupResponse,
  "members": [MemberInfo]
}
```

### MemberInfo
```json
{
  "id": 1,
  "username": "string",
  "role": "owner|admin|member",
  "nickname": "string|null",
  "user_nickname": "string|null"
}
```

> 표시 우선순위: `nickname` → `user_nickname` → `username`

### EventResponse
```json
{
  "id": 1,
  "group_id": 1,
  "created_by_id": 1,
  "name": "string",
  "ranking_type": "score|match_point",
  "event_type": "regular|independent",
  "uma_1st": 30, "uma_2nd": 10, "uma_3rd": -10, "uma_4th": -30,
  "scoring_1st": 4, "scoring_2nd": 2, "scoring_3rd": 1, "scoring_4th": 0,
  "is_closed": false,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

> **주의**:
> - `is_closed=true`인 Event는 수정(`PUT /events/{id}`) 불가 (400 반환). 마감된 Event에 게임 기록 추가도 불가 (400 반환)
> - 기간별 랭킹 집계는 FE에서 Group의 `weekly_start_day`/`monthly_start_day` 설정과 게임 기록의 `played_at`을 기반으로 계산

---

## 에러 응답

```json
{ "detail": "에러 메시지" }
```

| 코드 | 의미 |
|------|------|
| 400 | Bad request, 비즈니스 규칙 위반 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 등) |
