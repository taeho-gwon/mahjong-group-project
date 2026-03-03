# ADR: 닉네임 기능

- **날짜**: 2026-03-03
- **상태**: 승인
- **영향**: BE, DevOps, FE 전체

## 배경

유저 식별을 username(로그인 ID)으로만 하고 있어 표시 이름이 없음. 게임 기록 시 플레이어 구분을 위해 그룹 내 유니크한 닉네임이 필요.

## 결정

### 모델

**User 테이블:**
- `nickname`: VARCHAR, nullable, 유니크 아님
- 기본 닉네임. 그룹 가입 시 자동 채움용.

**GroupMember 테이블:**
- `nickname`: VARCHAR, nullable, 그룹 내 유니크 제약
- 그룹별 표시 이름.

### 표시 우선순위

```
GroupMember.nickname → User.nickname → username
```

### 주요 흐름

**기본 닉네임 설정 (MyPage):**
- PUT /api/auth/me 에 nickname 필드 추가
- MyPage에서 설정/변경

**그룹 가입:**
1. 기본 닉네임이 입력 필드에 미리 채워짐
2. 제출 시 그룹 내 중복 체크
3. 중복이면 → "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요" 안내
4. 중복 아니면 → 가입 완료

**그룹 닉네임 변경:**
- MyPage에서 그룹별 닉네임 목록 표시 + 수정
- 변경 시 그룹 내 중복 체크

### API 변경

| 엔드포인트 | 변경 |
|-----------|------|
| PUT /api/auth/me (신규) | 기본 닉네임 설정 |
| POST /api/groups/{id}/join | nickname 파라미터 추가 |
| POST /api/groups/join-by-invite | nickname 파라미터 추가 |
| PUT /api/groups/{id}/members/{user_id}/nickname (신규) | 그룹 닉네임 변경 |
| GET /api/groups/{id} | 멤버 응답에 nickname 포함 |

### 제약

- 그룹 내 닉네임 유니크 (DB 레벨 unique constraint: group_id + nickname)
- 변경 제한 없음 (추후 nickname_changed_at 추가로 기간 제한 가능)
- 닉네임 미설정 시 fallback 체인으로 표시

## 향후 확장

- 닉네임 변경 기간 제한 (nickname_changed_at 컬럼 추가)
- 닉네임 길이/문자 제한 강화
