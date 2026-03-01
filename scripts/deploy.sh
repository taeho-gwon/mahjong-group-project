#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

git pull origin main

docker compose -f infra/docker/docker-compose.prod.yml build

docker compose -f infra/docker/docker-compose.prod.yml up -d

docker compose -f infra/docker/docker-compose.prod.yml exec backend \
  uv run alembic upgrade head

echo "Deploy complete."
