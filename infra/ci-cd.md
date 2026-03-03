# CI/CD 설정 가이드

## 워크플로우 개요

| 워크플로우 | 트리거 | 내용 |
|-----------|--------|------|
| CI (`ci.yml`) | PR → main | ruff lint + pytest |
| Deploy (`deploy.yml`) | push → main, 수동 dispatch | SSH → deploy.sh |

## GitHub Secrets 설정

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | 값 | 예시 |
|--------|---|------|
| `SSH_HOST` | 서버 호스트명 | `mjgroup.duckdns.org` |
| `SSH_USER` | SSH 접속 유저 | `ubuntu` |
| `SSH_PRIVATE_KEY` | SSH 개인키 전체 내용 (PEM) | `-----BEGIN RSA PRIVATE KEY-----\n...` |
| `DEPLOY_PATH` | 서버의 프로젝트 절대 경로 | `/home/ubuntu/mahjong-group-project` |

### SSH_PRIVATE_KEY 등록 방법

```bash
# 로컬에서 키 내용 복사
cat ~/.ssh/mahjong-group-server-key.pem | pbcopy   # macOS
cat ~/.ssh/mahjong-group-server-key.pem | xclip    # Linux
```

GitHub Secret 값에 **키 전체 텍스트** (-----BEGIN ... -----END 포함)를 붙여넣기.

## 검증

### Secrets 등록 후 수동 배포 테스트

1. GitHub → **Actions** 탭
2. 좌측에서 **Deploy** 워크플로우 선택
3. **Run workflow** → **Run workflow** 클릭
4. 로그에서 SSH 접속 + deploy.sh 실행 성공 확인

### CI 테스트

1. 아무 브랜치에서 main으로 PR 생성
2. **CI** 워크플로우가 자동 실행되어 lint + test 통과 확인
