# Changelog

## [0.1.0] - 2026-03-03

첫 릴리스. MVP 기능 완성.

### Features
- **인증**: 회원가입, 로그인, JWT 토큰 갱신, 401 자동 갱신
- **그룹(모임)**: CRUD, 공개/비공개, 초대 링크, 멤버 관리 (역할 변경/강퇴/탈퇴/삭제)
- **이벤트(랭킹전)**: CRUD, regular/independent 타입, 마감 기능
- **게임 기록**: CRUD, 권한 관리 (owner/admin만 수정/삭제)
- **랭킹**: 점수 방식 (우마) + 승점 방식, 기간별 조회 (일간/주간/월간/전체)
- **그룹 기본 설정**: 기본 랭킹 타입, 기본 우마/승점 값
- **닉네임**: 글로벌 닉네임 + 그룹별 닉네임 (그룹 내 유니크)
- **유저 프로필**: 프로필 조회, 공유 그룹 표시
- **공지사항**: 로그인/메인 페이지에 표시 (읽기 전용)
- **RBAC**: 역할 기반 접근 제어 (owner/admin/member)
- **NavBar**: 글로벌 네비게이션 바

### Security
- username 문자 제한 (영문/숫자/한글/_/- 허용, homograph 방지)
- 입력 검증 강화 (uma/scoring 정수 검증, 포인트 합계 검증)
- 비공개 그룹 비멤버 접근 차단 (403)
- 강퇴 시 확인 모달

### Infrastructure
- PostgreSQL + Docker Compose (dev/prod)
- Nginx (HTTPS, gzip, SPA fallback)
- Let's Encrypt SSL
- GitHub Actions CI/CD
