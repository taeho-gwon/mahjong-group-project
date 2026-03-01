#!/usr/bin/env bash
# dev_reset.sh: DB 초기화 + 마이그레이션 + 시드 데이터 투입 (개발용)
#
# 사용법:
#   bash scripts/dev_reset.sh           # DB 컨테이너 재시작 + 전체 초기화
#   bash scripts/dev_reset.sh --no-seed # 마이그레이션만 (시드 데이터 없이)

set -euo pipefail

COMPOSE_FILE="infra/docker/docker-compose.yml"
SEED=true

for arg in "$@"; do
  case $arg in
    --no-seed) SEED=false ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

cd "$(dirname "$0")/.."

echo "=== [1/4] Docker DB 재시작 ==="
docker compose -f "$COMPOSE_FILE" down
docker compose -f "$COMPOSE_FILE" up -d

echo "=== [2/4] DB healthy 대기 ==="
until docker compose -f "$COMPOSE_FILE" exec db pg_isready -U mahjong -q; do
  printf '.'
  sleep 1
done
echo " ready"

echo "=== [3/4] Alembic 마이그레이션 ==="
uv run alembic upgrade head

if [ "$SEED" = true ]; then
  echo "=== [4/4] 시드 데이터 투입 ==="
  PYTHONPATH=. uv run python scripts/seed.py
else
  echo "=== [4/4] 시드 스킵 (--no-seed) ==="
fi

echo ""
echo "완료! 개발 서버를 시작하려면:"
echo "  uv run uvicorn app.main:app --reload"
