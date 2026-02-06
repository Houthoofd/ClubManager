#!/usr/bin/env node

/**
 * Script rapide pour ajouter mockProfesseursClient aux appels de handlers
 */

const fs = require('fs');
const path = require('path');

const files = [
  'src/routes/professeurs/__tests__/professeurs.validation.test.ts',
  'src/routes/professeurs/__tests__/professeurs.edge-cases.test.ts',
];

console.log('🔧 Correction rapide des tests professeurs...\n');

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    return;
  }

  console.log(`📝 Traitement: ${path.basename(filePath)}`);

  let content = fs.readFileSync(fullPath, 'utf8');
  let changes = 0;

  // Pattern 1: await handler(req, res);
  const pattern1 = /await (getProfesseurs|getProfesseurById|ajouterProfesseurHandler|modifierStatutProfesseurHandler|getPlanningProfesseur|healthCheck|getDiagnostic)\(\s*mockRequest as Request,\s*mockResponse as Response,?\s*\);/g;

  content = content.replace(pattern1, (match, handlerName) => {
    changes++;
    return `await ${handlerName}(\n        mockRequest as Request,\n        mockResponse as Response,\n        mockProfesseursClient as Professeurs,\n      );`;
  });

  // Pattern 2: multi-ligne déjà formaté
  const pattern2 = /await (getProfesseurs|getProfesseurById|ajouterProfesseurHandler|modifierStatutProfesseurHandler|getPlanningProfesseur|healthCheck|getDiagnostic)\(\s*\n\s*mockRequest as Request,\s*\n\s*mockResponse as Response,?\s*\n\s*\);/g;

  content = content.replace(pattern2, (match, handlerName) => {
    changes++;
    return `await ${handlerName}(\n        mockRequest as Request,\n        mockResponse as Response,\n        mockProfesseursClient as Professeurs,\n      );`;
  });

  if (changes > 0) {
    // Backup
    fs.writeFileSync(fullPath + '.bak', fs.readFileSync(fullPath));

    // Save
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`   ✅ ${changes} corrections effectuées`);
  } else {
    console.log(`   ⏭️  Déjà à jour`);
  }
});

console.log('\n🎉 Correction terminée!');
console.log('💾 Sauvegardes créées en .bak');
