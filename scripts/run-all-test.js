import { exec } from 'child_process';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Obtenir l'équivalent de __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dossiers à scanner
const testDirs = [
  join(__dirname, '../api/src/__tests__'),
  join(__dirname, '../front-end/src/__tests__')
];

const testFiles = [];

// Fonction récursive pour récupérer tous les fichiers .test.ts / .test.tsx / .spec.ts / .spec.tsx
function findTestFiles(dir) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        findTestFiles(fullPath);
      } else if (
        entry.name.endsWith('.test.ts') ||
        entry.name.endsWith('.test.tsx') ||
        entry.name.endsWith('.spec.ts') ||
        entry.name.endsWith('.spec.tsx')
      ) {
        testFiles.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Avertissement: Impossible d'accéder au répertoire ${dir}. ${error.message}`);
  }
}

// Parcours tous les dossiers
console.log('Recherche des fichiers de test dans:');
for (const dir of testDirs) {
  console.log(`- ${dir}`);
  findTestFiles(dir);
}

if (testFiles.length === 0) {
  console.log('Aucun fichier de test trouvé.');
  process.exit(0);
}

console.log(`\n${testFiles.length} fichiers de test trouvés.`);
console.log('Exécution des tests...\n');

// Exécute Jest pour l'API et le front-end séparément
const apiTests = testFiles.filter(file => file.includes('/api/'));
const frontEndTests = testFiles.filter(file => file.includes('/front-end'));

// Fonction pour exécuter des commandes Jest
async function runTests(title, dir, tests) {
  if (tests.length === 0) {
    console.log(`Aucun test à exécuter pour ${title}`);
    return;
  }
  
  console.log(`\n=== Exécution des tests ${title} (${tests.length} fichiers) ===\n`);
  
  return new Promise((resolve) => {
    // Nous utilisons une commande spécifique pour chaque type de projet
    let command;
    if (title === 'API') {
      // Pour l'API, utiliser la commande test:windows existante
      command = `cd ${join(__dirname, '../api')} && npm run test:windows`;
    } else {
      // Pour le front-end, utiliser la commande de test standard
      command = `cd ${join(__dirname, '../front-end')} && npm test`;
    }
    
    console.log(`Commande: ${command}\n`);
    
    const child = exec(command);

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on('exit', (code) => {
      console.log(`\n=== Fin des tests ${title} avec code ${code} ===\n`);
      resolve(code);
    });
  });
}

// Exécuter les tests séquentiellement
async function runAllTests() {
  let apiExitCode = 0;
  let frontEndExitCode = 0;
  
  if (apiTests.length > 0) {
    apiExitCode = await runTests('API', '../api', apiTests);
  }
  
  if (frontEndTests.length > 0) {
    frontEndExitCode = await runTests('Front-End', '../front-end', frontEndTests);
  }
  
  // Exit avec un code d'erreur si l'un des ensembles de tests a échoué
  const exitCode = apiExitCode !== 0 || frontEndExitCode !== 0 ? 1 : 0;
  console.log(`\n=== Résumé des tests ===`);
  console.log(`API: ${apiExitCode === 0 ? 'Succès' : 'Échec'}`);
  console.log(`Front-End: ${frontEndExitCode === 0 ? 'Succès' : 'Échec'}`);
  console.log(`===========================\n`);
  process.exit(exitCode);
}

runAllTests().catch(error => {
  console.error('Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});
