#!/usr/bin/env bash
# Dump diário do Postgres com rotação de 14 dias.
# Instalado no cron do host pelo setup (ver deploy/README.md).
set -euo pipefail

BACKUP_DIR=/opt/casa-backups
COMPOSE="docker compose -f /opt/casa/deploy/docker-compose.yml --env-file /opt/casa/deploy/.env"

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)

$COMPOSE exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  | gzip > "$BACKUP_DIR/casa-$STAMP.sql.gz"

# rotação: mantém os últimos 14 dumps
ls -1t "$BACKUP_DIR"/casa-*.sql.gz | tail -n +15 | xargs -r rm --

echo "backup ok: casa-$STAMP.sql.gz ($(du -h "$BACKUP_DIR/casa-$STAMP.sql.gz" | cut -f1))"
