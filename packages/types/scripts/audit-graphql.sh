#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    AUDIT GRAPHQL - @clubmanager/types                        ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

DOMAINS_DIR="packages/types/src/domains"

echo "📊 Analyse des fichiers GraphQL par domaine :"
echo ""

for domain_dir in "$DOMAINS_DIR"/*; do
    if [ -d "$domain_dir" ]; then
        domain=$(basename "$domain_dir")
        
        has_typedefs=0
        has_types=0
        
        if [ -f "$domain_dir/graphql.typedefs.ts" ]; then
            has_typedefs=1
        fi
        
        if [ -f "$domain_dir/graphql.types.ts" ]; then
            has_types=1
        fi
        
        if [ $has_typedefs -eq 1 ] || [ $has_types -eq 1 ]; then
            printf "  📁 %-20s" "$domain"
            
            if [ $has_typedefs -eq 1 ]; then
                printf "✓ typedefs.ts  "
            else
                printf "✗ typedefs.ts  "
            fi
            
            if [ $has_types -eq 1 ]; then
                printf "✓ types.ts"
            else
                printf "✗ types.ts"
            fi
            
            echo ""
        fi
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
