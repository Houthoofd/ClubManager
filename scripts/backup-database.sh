#!/bin/bash

# Script de backup automatique de la base de données MySQL
# Usage: ./backup-database.sh [environment]

set -e

# Variables d'environnement
ENV=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/clubmanager"
S3_BUCKET="clubmanager-backups"
RETENTION_DAYS=30

# Charger les variables d'environnement
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Créer le dossier de backup s'il n'existe pas
mkdir -p $BACKUP_DIR

# Nom du fichier de backup
BACKUP_FILE="clubmanager_${ENV}_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo "=== Starting database backup ==="
echo "Environment: ${ENV}"
echo "Timestamp: ${TIMESTAMP}"
echo "Output: ${BACKUP_PATH}"

# Backup MySQL avec mysqldump
echo "Dumping database..."
mysqldump \
  --host=${DB_HOST:-localhost} \
  --user=${DB_USER:-root} \
  --password=${DB_PASSWORD} \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  ${DB_NAME:-clubmanager_saas} \
  > ${BACKUP_PATH}

# Vérifier que le backup a réussi
if [ $? -eq 0 ]; then
  echo "✓ Database dump successful"
else
  echo "✗ Database dump failed"
  exit 1
fi

# Compresser le backup
echo "Compressing backup..."
gzip ${BACKUP_PATH}
BACKUP_PATH="${BACKUP_PATH}.gz"

if [ $? -eq 0 ]; then
  echo "✓ Compression successful"
  BACKUP_SIZE=$(du -h ${BACKUP_PATH} | cut -f1)
  echo "Backup size: ${BACKUP_SIZE}"
else
  echo "✗ Compression failed"
  exit 1
fi

# Upload vers S3 (optionnel)
if command -v aws &> /dev/null; then
  echo "Uploading to S3..."
  aws s3 cp ${BACKUP_PATH} s3://${S3_BUCKET}/${ENV}/${BACKUP_FILE}.gz
  
  if [ $? -eq 0 ]; then
    echo "✓ S3 upload successful"
  else
    echo "✗ S3 upload failed (continuing anyway)"
  fi
fi

# Nettoyer les vieux backups locaux
echo "Cleaning old backups..."
find ${BACKUP_DIR} -name "clubmanager_${ENV}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

if [ $? -eq 0 ]; then
  echo "✓ Old backups cleaned"
fi

# Nettoyer les vieux backups S3
if command -v aws &> /dev/null; then
  CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
  aws s3 ls s3://${S3_BUCKET}/${ENV}/ | while read -r line; do
    FILE_DATE=$(echo $line | awk '{print $1}')
    FILE_NAME=$(echo $line | awk '{print $4}')
    
    if [[ "$FILE_DATE" < "$CUTOFF_DATE" ]]; then
      aws s3 rm s3://${S3_BUCKET}/${ENV}/${FILE_NAME}
      echo "Deleted old S3 backup: ${FILE_NAME}"
    fi
  done
fi

echo "=== Backup completed successfully ==="
echo "Local backup: ${BACKUP_PATH}"
echo "S3 backup: s3://${S3_BUCKET}/${ENV}/${BACKUP_FILE}.gz"
