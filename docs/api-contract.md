# BE-FE API 계약서

Base URL: `http://localhost:8000` (dev)

> **이 파일은 단일 진실 공급원(Single Source of Truth)입니다.**
> API 변경 시 Backend 에이전트가 이 파일을 먼저 업데이트합니다.

---

## 인증 (`/auth`)

### POST /auth/register
```json
Request:  { "username": "string", "password": "string" }
Response: { "id": 1, "username": "string" }
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
Response: { "id": 1, "username": "string" }
Status:   200
```

---

## 그룹 (`/groups`)

### POST /groups
```json
Request:  {
  "name": "string",
  "description": "string|null",
  "join_policy": "public|private",
  "uma_1st": 30, "uma_2nd": 10, "uma_3rd": -10, "uma_4th": -30
}
Response: GroupResponse
Status:   201
Auth:     Required
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
Request:  { "name"?, "description"?, "join_policy"?, "uma_*"? }
Response: GroupResponse
Status:   200
Auth:     Required (owner/admin)
```

### DELETE /groups/{id}
```
Status:   204
Auth:     Required (owner)
```

### POST /groups/join-by-invite
```json
Request:  { "invite_token": "string" }
Response: GroupResponse
Status:   200
Auth:     Required
```

### POST /groups/{id}/invite-link
```
Response: { "invite_url": "string", "expires_at": "datetime" }
Status:   200
Auth:     Required (owner/admin)
```

### POST /groups/{id}/join
```
Status:   200
Auth:     Required
Note:     public 그룹만 가능
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

### PUT /groups/{id}/members/{user_id}/role
```json
Request:  { "role": "admin|member" }
Response: MemberInfo
Status:   200
Auth:     Required (owner)
```

---

## 컨테스트 (`/contests`)

### POST /contests
```json
Request:  {
  "group_id": 1,
  "name": "string",
  "description": "string|null",
  "ranking_type": "score|match_point",
  "uma_1st": 30, "uma_2nd": 10, "uma_3rd": -10, "uma_4th": -30,
  "scoring_1st": 4, "scoring_2nd": 2, "scoring_3rd": 1, "scoring_4th": 0
}
Response: ContestResponse
Status:   201
Auth:     Required
```

### GET /contests?group_id={id}
```
Response: [ContestResponse]
Status:   200
```

### GET /contests/{id}
```
Response: ContestResponse
Status:   200
```

### PUT /contests/{id}
```json
Request:  { "name"?, "description"?, "ranking_type"?, "uma_1st", "uma_2nd", "uma_3rd", "uma_4th"? }
Response: ContestResponse
Status:   200
Auth:     Required (생성자)
Note:     uma 4개는 일괄 업데이트
```

### DELETE /contests/{id}
```
Status:   204
Auth:     Required (생성자)
```

---

## 게임 기록 (`/game-records`)

> 세부 API는 기능 구현 시 업데이트 예정

---

## 공통 응답 스키마

### GroupResponse
```json
{
  "id": 1,
  "name": "string",
  "description": "string|null",
  "join_policy": "public|private",
  "uma_1st": 30, "uma_2nd": 10, "uma_3rd": -10, "uma_4th": -30,
  "created_at": "datetime",
  "updated_at": "datetime"
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
  "role": "owner|admin|member"
}
```

### ContestResponse
```json
{
  "id": 1,
  "group_id": 1,
  "created_by_id": 1,
  "name": "string",
  "description": "string|null",
  "ranking_type": "score|match_point",
  "uma_1st": 30, "uma_2nd": 10, "uma_3rd": -10, "uma_4th": -30,
  "scoring_1st": 4, "scoring_2nd": 2, "scoring_3rd": 1, "scoring_4th": 0,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

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
