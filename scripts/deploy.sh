#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

git pull origin main

# SECRET_KEY 재생성 → 기존 JWT 토큰 전부 무효화 (모든 유저 재로그인)
NEW_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
sed -i "s/^SECRET_KEY=.*/SECRET_KEY=$NEW_KEY/" .env.prod

docker compose -f infra/docker/docker-compose.prod.yml build

docker compose -f infra/docker/docker-compose.prod.yml up -d
# entrypoint.sh가 alembic upgrade head를 실행하므로 별도 migration 불필요

echo "Deploy complete."
