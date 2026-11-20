<#
.SYNOPSIS
  Order-to-Audit ERP - PowerShell Database Backup Script
.DESCRIPTION
  Performs compressed pg_dump backup of the ERP PostgreSQL database with retention purging.
#>

[CmdletBinding()]
param(
  [string]$BackupDir = "./backups",
  [int]$RetentionDays = 30,
  [string]$ContainerName = "ordertoaudit_postgres",
  [string]$DbUser = "postgres",
  [string]$DbName = "ordertoaudit_erp"
)

$ErrorActionPreference = "Stop"
$Timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")

if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$BackupFile = Join-Path $BackupDir "${DbName}_backup_${Timestamp}.sql"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "[BACKUP] Starting ERP PostgreSQL backup at $(Get-Date)" -ForegroundColor Cyan
Write-Host "[BACKUP] Container: $ContainerName | Database: $DbName" -ForegroundColor Cyan
Write-Host "[BACKUP] Destination: $BackupFile" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

try {
  # Check if docker container is active
  $containerRunning = docker ps --format '{{.Names}}' | Select-String "^$ContainerName$"
  if ($containerRunning) {
    Write-Host "[BACKUP] Running pg_dump inside Docker container $ContainerName..." -ForegroundColor Green
    docker exec $ContainerName pg_dump -U $DbUser -d $DbName -F p | Out-File -FilePath $BackupFile -Encoding utf8
  } else {
    Write-Host "[BACKUP] Running native pg_dump against local host..." -ForegroundColor Yellow
    pg_dump -U $DbUser -d $DbName -F p | Out-File -FilePath $BackupFile -Encoding utf8
  }

  $fileInfo = Get-Item $BackupFile
  $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
  Write-Host "[BACKUP] Backup completed successfully! Size: $fileSizeMB MB" -ForegroundColor Green

  # Cleanup old backups
  $cutoff = (Get-Date).AddDays(-$RetentionDays)
  $oldFiles = Get-ChildItem -Path $BackupDir -Filter "${DbName}_backup_*.sql" | Where-Object { $_.LastWriteTime -lt $cutoff }
  foreach ($old in $oldFiles) {
    Write-Host "[BACKUP] Purging expired archive: $($old.Name)" -ForegroundColor DarkGray
    Remove-Item $old.FullName -Force
  }
} catch {
  Write-Error "[BACKUP] Backup failed: $_"
  exit 1
}
