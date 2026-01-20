#!/bin/bash

# Script de restauration de la base de données MySQL
# Usage: ./restore-database.sh <backup-file>

set -e

# Vérifier les arguments
if [ $# -eq 0 ]; then
  echo "Usage: ./restore-database.sh <backup-file>"
  echo "Example: ./restore-database.sh /var/backups/clubmanager/clubmanager_production_20250115_120000.sql.gz"
  exit 1
fi

BACKUP_FILE=$1

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Charger les variables d'environnement
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "=== Database Restore ==="
echo "Backup file: ${BACKUP_FILE}"
echo "Target database: ${DB_NAME:-clubmanager_saas}"
echo ""

# Confirmation
read -p "⚠️  WARNING: This will REPLACE all data in the database. Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Décompresser si nécessaire
if [[ $BACKUP_FILE == *.gz ]]; then
  echo "Decompressing backup..."
  TEMP_FILE="/tmp/clubmanager_restore_$(date +%s).sql"
  gunzip -c $BACKUP_FILE > $TEMP_FILE
  RESTORE_FILE=$TEMP_FILE
else
  RESTORE_FILE=$BACKUP_FILE
fi

# Créer un backup de sécurité avant restauration
echo "Creating safety backup..."
SAFETY_BACKUP="/tmp/clubmanager_before_restore_$(date +%s).sql"
mysqldump \
  --host=${DB_HOST:-localhost} \
  --user=${DB_USER:-root} \
  --password=${DB_PASSWORD} \
  --single-transaction \
  ${DB_NAME:-clubmanager_saas} \
  > ${SAFETY_BACKUP}

if [ $? -eq 0 ]; then
  echo "✓ Safety backup created: ${SAFETY_BACKUP}"
else
  echo "✗ Safety backup failed"
  exit 1
fi

# Restaurer la base de données
echo "Restoring database..."
mysql \
  --host=${DB_HOST:-localhost} \
  --user=${DB_USER:-root} \
  --password=${DB_PASSWORD} \
  ${DB_NAME:-clubmanager_saas} \
  < ${RESTORE_FILE}

if [ $? -eq 0 ]; then
  echo "✓ Database restored successfully"
  
  # Nettoyer le fichier temporaire
  if [ -f "$TEMP_FILE" ]; then
    rm $TEMP_FILE
  fi
  
  echo ""
  echo "=== Restore completed ==="
  echo "Safety backup kept at: ${SAFETY_BACKUP}"
  echo "You can delete it manually if everything works correctly."
else
  echo "✗ Database restore failed"
  echo ""
  echo "Rolling back to safety backup..."
  
  mysql \
    --host=${DB_HOST:-localhost} \
    --user=${DB_USER:-root} \
    --password=${DB_PASSWORD} \
    ${DB_NAME:-clubmanager_saas} \
    < ${SAFETY_BACKUP}
  
  if [ $? -eq 0 ]; then
    echo "✓ Rollback successful"
  else
    echo "✗ Rollback failed - DATABASE MAY BE CORRUPTED"
  fi
  
  exit 1
fi
