#!/usr/bin/env bash
# restore_db.sh: PostgreSQL 복원 스크립트 (프로덕션용)
#
# 사용법:
#   bash scripts/restore_db.sh backups/mahjong_20260303_120000.sql.gz
#   SKIP_BACKUP=1 bash scripts/restore_db.sh backup.sql.gz   # 복원 전 백업 생략
#   SKIP_CONFIRM=1 bash scripts/restore_db.sh backup.sql.gz  # 확인 프롬프트 생략

set -euo pipefail

COMPOSE_FILE="infra/docker/docker-compose.prod.yml"
SKIP_BACKUP="${SKIP_BACKUP:-0}"
SKIP_CONFIRM="${SKIP_CONFIRM:-0}"

if [ $# -lt 1 ]; then
  echo "사용법: bash scripts/restore_db.sh <backup_file.sql.gz>"
  echo "  예시: bash scripts/restore_db.sh backups/mahjong_20260303_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

cd "$(dirname "$0")/.."

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: 파일을 찾을 수 없습니다: $BACKUP_FILE"
  exit 1
fi

DB_USER=$(docker compose -f "$COMPOSE_FILE" exec -T db printenv POSTGRES_USER)
DB_NAME=$(docker compose -f "$COMPOSE_FILE" exec -T db printenv POSTGRES_DB)

echo "=== DB 복원 정보 ==="
echo "  백업 파일: $BACKUP_FILE"
echo "  대상 DB:   $DB_NAME (user: $DB_USER)"
echo "  크기:      $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""
echo "  기존 데이터가 모두 덮어쓰기됩니다!"

if [ "$SKIP_CONFIRM" != "1" ]; then
  read -rp "계속하시겠습니까? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "복원이 취소되었습니다."
    exit 0
  fi
fi

if [ "$SKIP_BACKUP" != "1" ]; then
  echo ""
  echo "=== 복원 전 안전 백업 ==="
  bash scripts/backup_db.sh "backups/pre-restore"
fi

echo ""
echo "=== DB 스키마 초기화 ==="
docker compose -f "$COMPOSE_FILE" exec -T db \
  psql -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "=== DB 복원 시작 ==="
gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T db \
  psql -U "$DB_USER" -d "$DB_NAME" --single-transaction -q

echo "=== DB 복원 완료 ==="
