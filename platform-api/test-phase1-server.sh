#!/bin/bash
echo "🧪 Démarrage du serveur de test Phase 1..."
cd "$(dirname "$0")"
npx tsx src/server-test-phase1.ts
