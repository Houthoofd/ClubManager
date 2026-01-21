#!/bin/bash

# Script pour mettre à jour les imports après la restructuration des services
# Date: 21 Janvier 2025

echo "=========================================="
echo "Mise à jour des imports - Services"
echo "=========================================="

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_FILES=0
UPDATED_FILES=0

echo ""
echo "Recherche des fichiers à mettre à jour..."
echo ""

# Fonction pour remplacer les imports
update_imports() {
    local file=$1
    local changed=0

    # Créer une copie de backup
    cp "$file" "${file}.bak"

    # Liste des remplacements à effectuer
    declare -A replacements=(
        ["from ['\"]\.*/services/userService\.js['\"]"]="from '../services/user/user.service.js'"
        ["from ['\"]\.*/services/paymentService\.js['\"]"]="from '../services/payment/payment.service.js'"
        ["from ['\"]\.*/services/courseService\.js['\"]"]="from '../services/course/course.service.js'"
        ["from ['\"]\.*/services/emailService\.js['\"]"]="from '../services/email/email.service.js'"
        ["from ['\"]\.*/services/prismaService\.js['\"]"]="from '../services/prisma/prisma.service.js'"
        ["from ['\"]\.*/services/auditService\.js['\"]"]="from '../services/audit/audit.service.js'"
        ["from ['\"]\.*/services/tenantService\.js['\"]"]="from '../services/tenant/tenant.service.js'"
        ["from ['\"]\.*/services/articleService\.js['\"]"]="from '../services/article/article.service.js'"
        ["from ['\"]\.*/services/informationService\.js['\"]"]="from '../services/information/information.service.js'"
        ["from ['\"]\.*/services/statisticsService\.js['\"]"]="from '../services/statistics/statistics.service.js'"
        ["from ['\"]\.*/services/verificationService\.js['\"]"]="from '../services/verification/verification.service.js'"
        ["from ['\"]\.*/services/healthCheckService\.js['\"]"]="from '../services/health-check/health-check.service.js'"
        ["from ['\"]\.*/services/rateLimitService\.js['\"]"]="from '../services/rate-limit/rate-limit.service.js'"
        ["from ['\"]\.*/services/inventory\.service\.js['\"]"]="from '../services/inventory/inventory.service.js'"
        ["from ['\"]\.*/services/product\.service\.js['\"]"]="from '../services/product/product.service.js'"
        ["from ['\"]\.*/services/order\.service\.js['\"]"]="from '../services/order/order.service.js'"
        ["from ['\"]\.*/services/message\.service\.js['\"]"]="from '../services/message/message.service.js'"
    )

    # Appliquer les remplacements
    for pattern in "${!replacements[@]}"; do
        if grep -q "$pattern" "$file"; then
            sed -i "s|$pattern|${replacements[$pattern]}|g" "$file"
            changed=1
        fi
    done

    if [ $changed -eq 1 ]; then
        echo -e "${GREEN}✓${NC} Mis à jour: $file"
        ((UPDATED_FILES++))
        rm "${file}.bak"
    else
        # Restaurer depuis le backup si aucun changement
        mv "${file}.bak" "$file"
    fi
}

# Rechercher et mettre à jour les fichiers
echo "Recherche dans src/controllers..."
for file in $(find src/controllers -name "*.ts" 2>/dev/null); do
    ((TOTAL_FILES++))
    update_imports "$file"
done

echo ""
echo "Recherche dans src/routes..."
for file in $(find src/routes -name "*.ts" 2>/dev/null); do
    ((TOTAL_FILES++))
    update_imports "$file"
done

echo ""
echo "Recherche dans src/middleware..."
for file in $(find src/middleware -name "*.ts" 2>/dev/null); do
    ((TOTAL_FILES++))
    update_imports "$file"
done

echo ""
echo "Recherche dans src/utils..."
for file in $(find src/utils -name "*.ts" 2>/dev/null); do
    ((TOTAL_FILES++))
    update_imports "$file"
done

echo ""
echo "=========================================="
echo "Résumé"
echo "=========================================="
echo "Fichiers analysés: $TOTAL_FILES"
echo "Fichiers mis à jour: $UPDATED_FILES"
echo ""

if [ $UPDATED_FILES -gt 0 ]; then
    echo -e "${GREEN}✓ Migration des imports terminée avec succès!${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Vérifier que l'application compile: npm run build"
    echo "2. Lancer les tests: npm test"
    echo "3. Vérifier manuellement les imports complexes"
else
    echo -e "${YELLOW}ℹ Aucun import à mettre à jour trouvé.${NC}"
fi

echo ""
echo "Note: Les fichiers de backup (.bak) ont été créés pour les fichiers modifiés"
echo "=========================================="
