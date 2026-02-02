#!/bin/bash

# =====================================================
# Script de recréation de la base de données ClubManager
# =====================================================
#
# Usage:
#   ./recreate-db.sh [nom_base]
#
# Exemples:
#   ./recreate-db.sh                    # Crée 'clubmanager'
#   ./recreate-db.sh clubmanager_test   # Crée 'clubmanager_test'
#
# =====================================================

MYSQL_BIN="/c/xampp/mysql/bin/mysql.exe"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/recreate-database.sql"
DB_NAME="${1:-clubmanager}"
DB_USER="root"
DB_PASS=""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Recréation de la base de données${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Vérifier que MySQL est démarré
echo -e "${YELLOW}[1/4]${NC} Vérification de MySQL..."
$MYSQL_BIN -u$DB_USER -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ MySQL n'est pas démarré${NC}"
    echo -e "${YELLOW}Veuillez démarrer MySQL via XAMPP Control Panel${NC}"
    exit 1
fi
echo -e "${GREEN}✓ MySQL est opérationnel${NC}"

# Vérifier que le fichier SQL existe
echo ""
echo -e "${YELLOW}[2/4]${NC} Vérification du script SQL..."
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}✗ Fichier SQL introuvable: $SQL_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Script SQL trouvé${NC}"

# Demander confirmation si la base existe déjà
echo ""
echo -e "${YELLOW}[3/4]${NC} Vérification de la base existante..."
DB_EXISTS=$($MYSQL_BIN -u$DB_USER -sNe "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='$DB_NAME';" 2>&1)

if [ ! -z "$DB_EXISTS" ]; then
    echo -e "${YELLOW}⚠ La base '$DB_NAME' existe déjà${NC}"

    # Compter les tables
    TABLE_COUNT=$($MYSQL_BIN -u$DB_USER -sNe "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';" 2>&1)
    echo -e "${YELLOW}  → $TABLE_COUNT tables présentes${NC}"

    # Demander confirmation
    echo ""
    read -p "Voulez-vous supprimer et recréer cette base? (o/N): " CONFIRM

    if [[ ! "$CONFIRM" =~ ^[oO]$ ]]; then
        echo -e "${YELLOW}✗ Opération annulée${NC}"
        exit 0
    fi
fi

# Exécuter le script SQL
echo ""
echo -e "${YELLOW}[4/4]${NC} Création de la base de données..."

if [ "$DB_NAME" = "clubmanager" ]; then
    # Exécuter directement le fichier SQL
    $MYSQL_BIN -u$DB_USER < "$SQL_FILE" 2>&1
else
    # Adapter le nom de la base dans le SQL
    sed "s/clubmanager/$DB_NAME/g" "$SQL_FILE" | $MYSQL_BIN -u$DB_USER 2>&1
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Erreur lors de la création de la base${NC}"
    exit 1
fi

# Vérifier le résultat
FINAL_TABLE_COUNT=$($MYSQL_BIN -u$DB_USER -sNe "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';" 2>&1)

echo ""
echo -e "${GREEN}✓ Base '$DB_NAME' créée avec succès!${NC}"
echo -e "${GREEN}  → $FINAL_TABLE_COUNT tables créées${NC}"

# Afficher les prochaines étapes
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Prochaines étapes${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if [ "$DB_NAME" = "clubmanager" ]; then
    echo -e "Pour créer la base de test:"
    echo -e "  ${YELLOW}./recreate-db.sh clubmanager_test${NC}"
    echo ""
fi

echo -e "Pour vérifier la base:"
echo -e "  ${YELLOW}mysql -u root $DB_NAME -e \"SHOW TABLES;\"${NC}"
echo ""

echo -e "Pour lancer les tests:"
echo -e "  ${YELLOW}npm run test:confirmation:unit${NC}"
echo ""

echo -e "${GREEN}✓ Terminé!${NC}"
echo ""
