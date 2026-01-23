#!/usr/bin/env node

/**
 * Script de migration automatique Vitest → Jest
 *
 * Ce script convertit automatiquement les fichiers de tests Vitest vers Jest
 * en remplaçant les imports, les mocks et les assertions.
 */

const fs = require('fs');
const path = require('path');

// Compteurs pour les statistiques
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  filesSkipped: 0,
  errors: 0,
  changes: {
    imports: 0,
    mocks: 0,
    assertions: 0,
    beforeEach: 0,
    afterEach: 0,
  }
};

/**
 * Migre un fichier de test Vitest vers Jest
 */
function migrateFile(filePath) {
  console.log(`\n📝 Traitement: ${filePath}`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;

    // 1. Remplacer les imports Vitest par Jest
    if (content.includes('from "vitest"') || content.includes("from 'vitest'")) {
      console.log('  ✓ Remplacement des imports Vitest → Jest');

      // Import standard Vitest → Jest
      content = content.replace(
        /import\s*{\s*([^}]+)\s*}\s*from\s*['"]vitest['"]/g,
        (match, imports) => {
          // Remplacer vi par jest dans les imports
          const jestImports = imports
            .split(',')
            .map(imp => imp.trim())
            .filter(imp => imp !== 'vi') // Retirer vi
            .concat(['jest']) // Ajouter jest
            .filter((v, i, a) => a.indexOf(v) === i) // Dédupliquer
            .join(', ');

          stats.changes.imports++;
          return `import { ${jestImports} } from '@jest/globals'`;
        }
      );

      modified = true;
    }

    // 2. Remplacer vi. par jest.
    if (content.includes('vi.')) {
      console.log('  ✓ Remplacement vi. → jest.');

      // Remplacer toutes les occurrences de vi.
      content = content.replace(/\bvi\./g, 'jest.');

      // Remplacer vi.mocked par jest.mocked (si présent)
      content = content.replace(/jest\.mocked/g, 'jest.fn');

      stats.changes.mocks++;
      modified = true;
    }

    // 3. Corriger les imports de modules (ajouter .js si manquant pour ESM)
    if (content.match(/from\s+['"](\.\.?\/[^'"]+)(?<!\.js)['"]/)) {
      console.log('  ✓ Ajout des extensions .js pour ESM');

      content = content.replace(
        /from\s+(['"])(\.\.?\/[^'"]+?)(?<!\.js)\1/g,
        (match, quote, importPath) => {
          // Ne pas ajouter .js aux imports de node_modules
          if (importPath.startsWith('./') || importPath.startsWith('../')) {
            return `from ${quote}${importPath}.js${quote}`;
          }
          return match;
        }
      );

      modified = true;
    }

    // 4. Remplacer les assertions Vitest spécifiques
    if (content.includes('toMatchObject') || content.includes('toHaveBeenCalledWith')) {
      // Ces assertions sont déjà compatibles, mais on vérifie
      stats.changes.assertions++;
    }

    // 5. Ajouter l'import des helpers si des mocks sont utilisés
    if ((content.includes('jest.fn()') || content.includes('jest.mock(')) &&
        !content.includes('from "../__tests__/helpers/mock-helpers.js"') &&
        !content.includes('from "../../__tests__/helpers/mock-helpers.js"') &&
        !content.includes('from "../../../__tests__/helpers/mock-helpers.js"')) {

      console.log('  ℹ️  Ajout recommandé: import des mock-helpers');
      // On ne l'ajoute pas automatiquement car le chemin dépend de l'emplacement
    }

    // 6. Corriger les beforeEach/afterEach si nécessaire
    if (content.includes('beforeEach(') && !content.includes('jest.clearAllMocks()')) {
      console.log('  ℹ️  Recommandation: ajouter jest.clearAllMocks() dans beforeEach');
      stats.changes.beforeEach++;
    }

    // 7. Remplacer TokenExpiredError si présent
    if (content.includes('jwt.TokenExpiredError')) {
      console.log('  ✓ Correction de TokenExpiredError');
      content = content.replace(
        /throw new jwt\.TokenExpiredError\([^)]+\)/g,
        'throw Object.assign(new Error("jwt expired"), { name: "TokenExpiredError" })'
      );
      modified = true;
    }

    // 8. Corriger les types "as never" pour Jest
    if (content.includes('as never')) {
      console.log('  ✓ Suppression des types "as never"');
      content = content.replace(/\s+as never/g, '');
      modified = true;
    }

    // Si le fichier a été modifié, on le sauvegarde
    if (modified || content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('  ✅ Fichier migré avec succès');
      stats.filesModified++;
      return true;
    } else {
      console.log('  ⊘ Aucune modification nécessaire');
      stats.filesSkipped++;
      return false;
    }

  } catch (error) {
    console.error(`  ❌ Erreur: ${error.message}`);
    stats.errors++;
    return false;
  }
}

/**
 * Trouve tous les fichiers de test récursivement
 */
function findTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorer node_modules et dist
      if (file !== 'node_modules' && file !== 'dist' && file !== 'build' && file !== 'coverage') {
        findTestFiles(filePath, fileList);
      }
    } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
      // Exclure les fichiers d'exemple
      if (!filePath.includes('examples')) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Affiche les statistiques
 */
function printStats() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 STATISTIQUES DE MIGRATION');
  console.log('='.repeat(60));
  console.log(`Fichiers traités:    ${stats.filesProcessed}`);
  console.log(`Fichiers modifiés:   ${stats.filesModified}`);
  console.log(`Fichiers ignorés:    ${stats.filesSkipped}`);
  console.log(`Erreurs:             ${stats.errors}`);
  console.log('\nChangements appliqués:');
  console.log(`  - Imports:         ${stats.changes.imports}`);
  console.log(`  - Mocks:           ${stats.changes.mocks}`);
  console.log(`  - Assertions:      ${stats.changes.assertions}`);
  console.log(`  - beforeEach:      ${stats.changes.beforeEach}`);
  console.log('='.repeat(60));
}

/**
 * Crée un backup des fichiers
 */
function createBackup(files) {
  const backupDir = path.join(process.cwd(), '.test-migration-backup');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`\n💾 Création du backup dans: ${backupDir}`);

  let backupCount = 0;
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);
      const backupPath = path.join(backupDir, relativePath);
      const backupDirPath = path.dirname(backupPath);

      if (!fs.existsSync(backupDirPath)) {
        fs.mkdirSync(backupDirPath, { recursive: true });
      }

      fs.writeFileSync(backupPath, content, 'utf8');
      backupCount++;
    } catch (error) {
      console.error(`  ❌ Erreur backup ${file}: ${error.message}`);
    }
  });

  console.log(`  ✅ ${backupCount} fichiers sauvegardés`);
}

/**
 * Programme principal
 */
function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║       MIGRATION AUTOMATIQUE VITEST → JEST                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const srcDir = path.join(process.cwd(), 'src');

  if (!fs.existsSync(srcDir)) {
    console.error('❌ Répertoire src/ non trouvé');
    process.exit(1);
  }

  // Trouver tous les fichiers de test
  console.log('\n🔍 Recherche des fichiers de test...');
  const testFiles = findTestFiles(srcDir);
  console.log(`\n✓ ${testFiles.length} fichiers de test trouvés`);

  if (testFiles.length === 0) {
    console.log('Aucun fichier de test à migrer.');
    process.exit(0);
  }

  // Afficher les fichiers trouvés
  console.log('\nFichiers à traiter:');
  testFiles.slice(0, 10).forEach(file => {
    console.log(`  - ${path.relative(process.cwd(), file)}`);
  });
  if (testFiles.length > 10) {
    console.log(`  ... et ${testFiles.length - 10} autres`);
  }

  // Demander confirmation (sauf si --yes est passé)
  const shouldBackup = !process.argv.includes('--no-backup');

  if (shouldBackup) {
    createBackup(testFiles);
  }

  // Migration
  console.log('\n🚀 Début de la migration...');

  testFiles.forEach(file => {
    stats.filesProcessed++;
    migrateFile(file);
  });

  // Afficher les statistiques
  printStats();

  // Message final
  console.log('\n✅ Migration terminée !');
  console.log('\n📋 Prochaines étapes:');
  console.log('  1. Vérifier les changements: git diff');
  console.log('  2. Exécuter les tests: npm test');
  console.log('  3. Si problème, restaurer: cp -r .test-migration-backup/* .');
  console.log('\n💡 Consultez JEST_ESM_MIGRATION_GUIDE.md pour plus de détails');
}

// Exécuter le script
main();
