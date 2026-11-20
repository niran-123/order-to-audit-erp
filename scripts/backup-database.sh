#!/bin/bash
# ==============================================================================
# Order-to-Audit ERP - Automated PostgreSQL Database Backup Script
# Usage: ./scripts/backup-database.sh
# Can be scheduled via crontab: 0 2 * * * /path/to/backup-database.sh
# ==============================================================================

set -euo pipefail

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Database credentials (from environment or defaults)
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-ordertoaudit_erp}"
CONTAINER_NAME="${CONTAINER_NAME:-ordertoaudit_postgres}"

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/${POSTGRES_DB}_backup_${TIMESTAMP}.sql.gz"

echo "=================================================================="
echo "[BACKUP] Starting automated database backup at $(date)"
echo "[BACKUP] Target container: ${CONTAINER_NAME}"
echo "[BACKUP] Target database:  ${POSTGRES_DB}"
echo "[BACKUP] Backup archive:   ${BACKUP_FILE}"
echo "=================================================================="

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[BACKUP] Streaming pg_dump from container: ${CONTAINER_NAME}..."
  docker exec -t "${CONTAINER_NAME}" pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -F c | gzip > "${BACKUP_FILE}"
else
  echo "[BACKUP] Container not found; attempting local pg_dump..."
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -F c | gzip > "${BACKUP_FILE}"
fi

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[BACKUP] Backup completed successfully! File size: ${BACKUP_SIZE}"

# Optional AWS S3 upload
if [ -n "${S3_BACKUP_BUCKET:-}" ]; then
  echo "[BACKUP] Syncing backup to AWS S3: ${S3_BACKUP_BUCKET}..."
  aws s3 cp "${BACKUP_FILE}" "${S3_BACKUP_BUCKET}/" --storage-class STANDARD_IA
  echo "[BACKUP] S3 sync completed."
fi

# Retention Cleanup: remove archives older than RETENTION_DAYS
echo "[BACKUP] Purging backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${POSTGRES_DB}_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
echo "[BACKUP] Cleanup complete. Ready for operation."
