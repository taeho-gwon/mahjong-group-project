#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

git pull origin main

docker compose -f infra/docker/docker-compose.prod.yml build

docker compose -f infra/docker/docker-compose.prod.yml up -d
# entrypoint.sh가 alembic upgrade head를 실행하므로 별도 migration 불필요

echo "Deploy complete."
