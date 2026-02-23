#!/bin/bash

# ====================================================================
# PATTERNFLY ICONS MIGRATION SCRIPT
# ====================================================================
#
# Ce script remplace automatiquement les imports d'icônes PatternFly
# pour utiliser le barrel export centralisé optimisé.
#
# Usage:
#   chmod +x scripts/migrate-icons.sh
#   ./scripts/migrate-icons.sh
#
# ====================================================================

echo "🎨 Migration des imports d'icônes PatternFly..."
echo ""

# Compteurs
total_files=0
migrated_files=0

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Trouver tous les fichiers TypeScript/React
files=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -not -path "*/dist/*")

for file in $files; do
  # Vérifier si le fichier contient des imports PatternFly icons
  if grep -q "from '@patternfly/react-icons'" "$file"; then
    total_files=$((total_files + 1))

    echo -e "${BLUE}📝 Migration: ${file}${NC}"

    # Créer une copie de sauvegarde
    cp "$file" "${file}.backup"

    # Remplacer les imports
    # Pattern 1: Single line import
    sed -i "s|from '@patternfly/react-icons'|from '@/shared/icons'|g" "$file"

    # Pattern 2: Multi-line imports (plus complexe, nécessite perl)
    perl -i -pe 's/from\s+["\x27]@patternfly\/react-icons["\x27]/from \x27@\/shared\/icons\x27/g' "$file"

    # Vérifier si le fichier a changé
    if ! cmp -s "$file" "${file}.backup"; then
      migrated_files=$((migrated_files + 1))
      echo -e "${GREEN}  ✅ Migré avec succès${NC}"
      # Supprimer le backup si succès
      rm "${file}.backup"
    else
      echo -e "${YELLOW}  ⚠️  Aucun changement${NC}"
      # Restaurer depuis le backup
      mv "${file}.backup" "$file"
    fi

    echo ""
  fi
done

echo "======================================================================"
echo -e "${GREEN}✅ Migration terminée !${NC}"
echo ""
echo "📊 Statistiques:"
echo "   - Fichiers analysés: $(echo "$files" | wc -l)"
echo "   - Fichiers avec imports PatternFly: $total_files"
echo "   - Fichiers migrés: $migrated_files"
echo ""
echo "💡 Prochaines étapes:"
echo "   1. Vérifier les changements: git diff"
echo "   2. Tester l'application: npm run dev"
echo "   3. Vérifier les tests: npm run test"
echo "   4. Analyser le bundle: npm run analyze"
echo ""
echo "🎯 Gain estimé: -50 à -100KB sur le bundle"
echo "======================================================================"
