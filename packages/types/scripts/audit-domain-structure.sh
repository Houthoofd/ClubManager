#!/bin/bash

# Audit de la structure des domaines dans packages/types
# Vérifie que les schémas Zod sont dans validators.ts et non dans types.ts

echo "==================================================================="
echo "  Audit de la structure des domaines @clubmanager/types"
echo "==================================================================="
echo ""

DOMAINS_DIR="src/domains"
TOTAL_DOMAINS=0
CONFORMING_DOMAINS=0
NON_CONFORMING=()

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Vérification des domaines..."
echo ""

for domain_dir in "$DOMAINS_DIR"/*; do
    if [ -d "$domain_dir" ]; then
        domain=$(basename "$domain_dir")
        TOTAL_DOMAINS=$((TOTAL_DOMAINS + 1))
        
        types_file="$domain_dir/types.ts"
        validators_file="$domain_dir/validators.ts"
        
        has_zod_in_types=0
        has_validators_file=0
        
        # Vérifier si types.ts contient des schémas Zod
        if [ -f "$types_file" ]; then
            if grep -q "z\.object\|z\.string\|z\.number\|z\.array\|z\.enum\|z\.infer" "$types_file" 2>/dev/null; then
                has_zod_in_types=1
            fi
            
            # Vérifier import de Zod
            if grep -q "^import.*zod" "$types_file" 2>/dev/null; then
                has_zod_in_types=1
            fi
        fi
        
        # Vérifier si validators.ts existe
        if [ -f "$validators_file" ]; then
            has_validators_file=1
        fi
        
        # Déterminer si le domaine est conforme
        if [ $has_zod_in_types -eq 0 ] && [ $has_validators_file -eq 1 ]; then
            echo -e "  ${GREEN}✓${NC} $domain - Conforme"
            CONFORMING_DOMAINS=$((CONFORMING_DOMAINS + 1))
        elif [ $has_zod_in_types -eq 1 ]; then
            echo -e "  ${RED}✗${NC} $domain - Schémas Zod détectés dans types.ts"
            NON_CONFORMING+=("$domain: Schémas Zod dans types.ts")
        elif [ $has_validators_file -eq 0 ]; then
            echo -e "  ${YELLOW}⚠${NC} $domain - Pas de validators.ts"
            NON_CONFORMING+=("$domain: Pas de validators.ts")
        else
            echo -e "  ${RED}✗${NC} $domain - État inconnu"
            NON_CONFORMING+=("$domain: État inconnu")
        fi
    fi
done

echo ""
echo "==================================================================="
echo "  Résumé"
echo "==================================================================="
echo ""
echo "Total de domaines analysés: $TOTAL_DOMAINS"
echo -e "Domaines conformes: ${GREEN}$CONFORMING_DOMAINS${NC}"
echo -e "Domaines non-conformes: ${RED}$((TOTAL_DOMAINS - CONFORMING_DOMAINS))${NC}"

if [ $CONFORMING_DOMAINS -eq $TOTAL_DOMAINS ]; then
    echo ""
    echo -e "${GREEN}✓ Tous les domaines sont conformes !${NC}"
    echo ""
    exit 0
else
    CONFORMITY_PERCENT=$(( 100 * CONFORMING_DOMAINS / TOTAL_DOMAINS ))
    echo ""
    echo -e "Taux de conformité: ${YELLOW}${CONFORMITY_PERCENT}%${NC}"
    echo ""
    echo "Problèmes détectés:"
    for issue in "${NON_CONFORMING[@]}"; do
        echo -e "  ${RED}•${NC} $issue"
    done
    echo ""
    exit 1
fi
