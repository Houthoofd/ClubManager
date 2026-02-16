#!/bin/bash
# Script de validation de la structure d'un domaine

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
  echo "Usage: ./validate-domain.sh <nom-domaine>"
  exit 1
fi

DOMAIN_PATH="packages/types/src/domains/$DOMAIN"

if [ ! -d "$DOMAIN_PATH" ]; then
  echo "❌ Domaine '$DOMAIN' n'existe pas"
  exit 1
fi

echo "🔍 Validation du domaine: $DOMAIN"
echo ""

SCORE=0
MAX_SCORE=0

# Fichiers obligatoires
echo "📁 Fichiers Obligatoires:"
((MAX_SCORE+=3))

if [ -f "$DOMAIN_PATH/index.ts" ]; then
  echo "  ✅ index.ts"
  ((SCORE++))
else
  echo "  ❌ index.ts MANQUANT"
fi

if [ -f "$DOMAIN_PATH/types.ts" ]; then
  echo "  ✅ types.ts"
  ((SCORE++))
else
  echo "  ❌ types.ts MANQUANT"
fi

if [ -f "$DOMAIN_PATH/validators.ts" ]; then
  echo "  ✅ validators.ts"
  ((SCORE++))
else
  echo "  ❌ validators.ts MANQUANT"
fi

echo ""
echo "📝 Qualité du Code:"

# Vérifier JSDoc dans types.ts
((MAX_SCORE++))
if [ -f "$DOMAIN_PATH/types.ts" ]; then
  JSDOC_COUNT=$(grep -c "^ \* " "$DOMAIN_PATH/types.ts" 2>/dev/null || echo "0")
  if [ "$JSDOC_COUNT" -gt "10" ]; then
    echo "  ✅ JSDoc présent ($JSDOC_COUNT lignes)"
    ((SCORE++))
  else
    echo "  ⚠️  JSDoc insuffisant ($JSDOC_COUNT lignes)"
  fi
fi

# Vérifier schémas Zod dans validators.ts
((MAX_SCORE++))
if [ -f "$DOMAIN_PATH/validators.ts" ]; then
  ZOD_COUNT=$(grep -c "z\.object\|z\.string" "$DOMAIN_PATH/validators.ts" 2>/dev/null || echo "0")
  if [ "$ZOD_COUNT" -gt "0" ]; then
    echo "  ✅ Schémas Zod présents ($ZOD_COUNT)"
    ((SCORE++))
  else
    echo "  ⚠️  Aucun schéma Zod trouvé"
  fi
fi

# Vérifier que types.ts n'a pas de Zod
((MAX_SCORE++))
if [ -f "$DOMAIN_PATH/types.ts" ]; then
  ZOD_IN_TYPES=$(grep -c "z\.object\|z\.string" "$DOMAIN_PATH/types.ts" 2>/dev/null || echo "0")
  if [ "$ZOD_IN_TYPES" -eq "0" ]; then
    echo "  ✅ Pas de Zod dans types.ts"
    ((SCORE++))
  else
    echo "  ❌ Zod trouvé dans types.ts ($ZOD_IN_TYPES occurences)"
  fi
fi

echo ""
PERCENTAGE=$((SCORE * 100 / MAX_SCORE))
echo "📊 Score: $SCORE/$MAX_SCORE ($PERCENTAGE%)"

if [ "$PERCENTAGE" -ge "80" ]; then
  echo "✅ Domaine conforme au standard"
  exit 0
else
  echo "⚠️  Domaine nécessite des améliorations"
  exit 1
fi
