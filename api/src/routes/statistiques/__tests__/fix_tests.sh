#!/bin/bash
for file in statistiques.*.test.ts; do
  if [ "$file" != "statistiques.test.ts" ] && [ "$file" != "statistiques.handlers.test.ts" ]; then
    # Remplacer l'import de Statistiques par l'import des services
    sed -i "s/import { Statistiques } from '..\/..\/..\/db\/clients\/statistiques\/statistiques.js';/import * as statistiquesService from '..\/core\/services\/statistiques.service.js';/" "$file"
    
    # Remplacer le mock de Statistiques par le mock des services
    sed -i "s/jest.mock('..\/..\/..\/db\/clients\/statistiques\/statistiques.js');/jest.mock('..\/core\/services\/statistiques.service.js');/" "$file"
    
    # Supprimer les lignes mockStatistiques
    sed -i '/let mockStatistiques/d' "$file"
    sed -i '/mockStatistiques = Statistiques/d' "$file"
    
    echo "✅ Fixed: $file"
  fi
done
