import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemins des dossiers de test
const API_DIR = path.join(__dirname, 'api');
const FRONT_DIR = path.join(__dirname, 'front-end');

// Récupérer le pattern de test spécifique s'il est fourni
const testPattern = process.argv[2] || '';

// Configuration pour les tests API
const runApiTests = async () => {
  console.log('\n=== Running API Tests ===\n');
  
  // Vérifier si le dossier API existe
  if (!fs.existsSync(API_DIR)) {
    console.error(`API directory not found at: ${API_DIR}`);
    return;
  }
  
  // Trouver tous les fichiers de test dans l'API
  const apiTestsDir = path.join(API_DIR, 'src', '__tests__');
  
  if (!fs.existsSync(apiTestsDir)) {
    console.error(`API tests directory not found at: ${apiTestsDir}`);
    return;
  }
  
  // Arguments pour Jest
  const jestArgs = [
    '--experimental-vm-modules',
    path.join(API_DIR, 'node_modules', 'jest', 'bin', 'jest.js'),
    '--config',
    path.join(API_DIR, 'jest.config.js'),
    '--runInBand', // Exécuter les tests en série
    '--passWithNoTests', // Ne pas échouer s'il n'y a pas de tests
    '--verbose'
  ];
  
  // Ajouter le pattern de test spécifique s'il existe
  if (testPattern) {
    jestArgs.push(testPattern);
  }
  
  // Exécuter Jest avec des options spécifiques pour l'API
  const jestProcess = spawn('node', jestArgs, {
    cwd: API_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--experimental-vm-modules'
    }
  });
  
  return new Promise((resolve, reject) => {
    jestProcess.on('close', (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`Jest exited with code ${code}`));
      }
    });
  });
};

// Configuration pour les tests Front-end
const runFrontEndTests = async () => {
  console.log('\n=== Running Front-end Tests ===\n');
  
  // Vérifier si le dossier Front-end existe
  if (!fs.existsSync(FRONT_DIR)) {
    console.error(`Front-end directory not found at: ${FRONT_DIR}`);
    return;
  }
  
  // Exécuter Jest pour le front-end
  const jestProcess = spawn('npx', [
    'jest',
    '--config',
    path.join(FRONT_DIR, 'jest.config.js'),
    '--passWithNoTests'
  ], {
    cwd: FRONT_DIR,
    stdio: 'inherit'
  });
  
  return new Promise((resolve, reject) => {
    jestProcess.on('close', (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        reject(new Error(`Jest exited with code ${code}`));
      }
    });
  });
};

// Fonction principale pour exécuter tous les tests
const runAllTests = async () => {
  try {
    // Exécuter les tests de l'API
    await runApiTests();
    
    // Exécuter les tests du front-end
    await runFrontEndTests();
    
    console.log('\n=== All Tests Completed Successfully ===\n');
    process.exit(0);
  } catch (error) {
    console.error('\n=== Test Execution Failed ===');
    console.error(error);
    process.exit(1);
  }
};

// Démarrer l'exécution des tests
runAllTests();
