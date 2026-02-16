#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║              ANALYSE DÉTAILLÉE - Plan de standardisation GraphQL            ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

DOMAINS_DIR="packages/types/src/domains"

echo "📋 Pattern A (ont typedefs.ts, BESOIN de types.ts) :"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for domain in alertes informations magasin upload verification; do
    if [ -f "$DOMAINS_DIR/$domain/graphql.typedefs.ts" ] && [ ! -f "$DOMAINS_DIR/$domain/graphql.types.ts" ]; then
        size=$(wc -l < "$DOMAINS_DIR/$domain/graphql.typedefs.ts" | tr -d ' ')
        echo "  📁 $domain (${size} lignes typedefs) → Créer graphql.types.ts"
    fi
done

echo ""
echo "📋 Pattern B (ont types.ts, BESOIN de typedefs.ts) :"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for domain in commandes compte cours inscription messages paiements professeurs statistiques; do
    if [ -f "$DOMAINS_DIR/$domain/graphql.types.ts" ] && [ ! -f "$DOMAINS_DIR/$domain/graphql.typedefs.ts" ]; then
        size=$(wc -l < "$DOMAINS_DIR/$domain/graphql.types.ts" | tr -d ' ')
        echo "  📁 $domain (${size} lignes types) → Créer graphql.typedefs.ts"
    fi
done

echo ""
echo "✅ Pattern C (déjà complets) :"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for domain in auth utilisateurs; do
    if [ -f "$DOMAINS_DIR/$domain/graphql.typedefs.ts" ] && [ -f "$DOMAINS_DIR/$domain/graphql.types.ts" ]; then
        echo "  ✓ $domain (déjà conforme)"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📊 RÉSUMÉ :"
echo "  • Pattern A : 5 domaines → Créer graphql.types.ts"
echo "  • Pattern B : 8 domaines → Créer graphql.typedefs.ts"
echo "  • Pattern C : 2 domaines → ✅ Déjà conformes"
echo ""
echo "🎯 STRATÉGIE :"
echo "  1. Commencer par Pattern A (plus simple : types depuis typedefs)"
echo "  2. Continuer avec Pattern B (plus créatif : typedefs depuis types)"
echo ""

