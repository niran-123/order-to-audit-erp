#!/bin/bash
# ==============================================================================
# Order-to-Audit ERP - Database Restore Script
# Usage: ./scripts/restore-database.sh ./backups/ordertoaudit_erp_backup_YYYYMMDD_HHMMSS.sql.gz
# ==============================================================================

set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Error: No backup archive specified."
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-ordertoaudit_erp}"
CONTAINER_NAME="${CONTAINER_NAME:-ordertoaudit_postgres}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: File '${BACKUP_FILE}' does not exist."
  exit 1
fi

echo "=================================================================="
echo "[RESTORE] Restoring database '${POSTGRES_DB}' from '${BACKUP_FILE}'"
echo "[RESTORE] Target Container: ${CONTAINER_NAME}"
echo "WARNING: This will overwrite existing data in '${POSTGRES_DB}'!"
echo "=================================================================="

echo "Starting restore..."
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"
else
  docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${BACKUP_FILE}"
fi

echo "[RESTORE] Database restored successfully!"
