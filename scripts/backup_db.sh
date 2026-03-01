#!/usr/bin/env bash
# backup_db.sh: PostgreSQL 백업 스크립트 (프로덕션용)
#
# 사용법:
#   bash scripts/backup_db.sh                # 기본 백업 (backups/ 디렉토리)
#   bash scripts/backup_db.sh /path/to/dir   # 지정 디렉토리에 백업
#   KEEP_DAYS=30 bash scripts/backup_db.sh   # 30일 이전 백업 삭제 (기본: 7일)

set -euo pipefail

COMPOSE_FILE="infra/docker/docker-compose.prod.yml"
BACKUP_DIR="${1:-backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="mahjong_${TIMESTAMP}.sql.gz"

cd "$(dirname "$0")/.."

mkdir -p "$BACKUP_DIR"

echo "=== DB 백업 시작: ${FILENAME} ==="

docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U "$( docker compose -f "$COMPOSE_FILE" exec -T db printenv POSTGRES_USER )" \
          -d "$( docker compose -f "$COMPOSE_FILE" exec -T db printenv POSTGRES_DB )" \
          --no-owner --no-acl \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "=== 백업 완료: ${BACKUP_DIR}/${FILENAME} (${SIZE}) ==="

# 오래된 백업 정리
DELETED=$(find "$BACKUP_DIR" -name "mahjong_*.sql.gz" -mtime +"$KEEP_DAYS" -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "=== ${KEEP_DAYS}일 이전 백업 ${DELETED}개 삭제 ==="
fi
