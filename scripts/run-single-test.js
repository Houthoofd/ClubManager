import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Exécute un fichier de test spécifique avec la configuration Jest appropriée
 * @param {string} testFilePath - Chemin relatif du fichier de test
 */
function runSingleTest(testFilePath) {
  // Vérifier si le fichier existe avec l'extension fournie
  const fullPath = path.join(projectRoot, testFilePath);
  
  if (!fs.existsSync(fullPath)) {
    // Si le fichier n'existe pas, essayer de trouver une variante avec une autre extension
    const dir = path.dirname(fullPath);
    const baseName = path.basename(fullPath, path.extname(fullPath));
    
    // Extensions possibles à essayer
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    let foundPath = null;
    for (const ext of extensions) {
      const testPath = path.join(dir, baseName + ext);
      if (fs.existsSync(testPath)) {
        foundPath = testPath;
        // Recalculer le testFilePath relatif avec la bonne extension
        testFilePath = path.relative(projectRoot, foundPath).replace(/\\/g, '/');
        console.log(`📋 Fichier trouvé avec l'extension ${ext}: ${testFilePath}`);
        break;
      }
    }
    
    if (!foundPath) {
      console.error(`❌ Fichier de test introuvable: ${testFilePath}`);
      process.exit(1);
    }
  }
  
  // Déterminer le projet (api ou front-end) en fonction du chemin du test
  const isApi = testFilePath.includes('api/');
  const isFrontEnd = testFilePath.includes('front-end/');
  
  const projectName = isApi ? 'api' : (isFrontEnd ? 'front-end' : null);
  
  if (!projectName) {
    console.error(`❌ Impossible de déterminer le projet pour le fichier: ${testFilePath}`);
    process.exit(1);
  }
  
  // Correction : utilisez le bon fichier de config Jest selon le mode ESM/CJS
  // Préférez jest.config.cjs si présent pour le projet api
  let configPath = path.join(projectRoot, projectName, 'jest.config.cjs');
  if (!fs.existsSync(configPath)) {
    configPath = path.join(projectRoot, projectName, 'jest.config.js');
  }
  
  // Options pour l'exécution de Jest
  const options = [];
  
  // Ajouter les options spécifiques au projet
  if (isApi) {
    options.push('--experimental-vm-modules');
    options.push(`NODE_ENV=test`);
  }
  
  // Commande d'exécution
  const command = `npx jest --config=${configPath} ${testFilePath} --runInBand --detectOpenHandles`;
  
  console.log(`📋 Exécution du test: ${testFilePath}`);
  console.log(`🔧 Utilisation de la configuration: ${configPath}`);
  console.log(`🚀 Commande: ${command}\n`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: isApi ? '--experimental-vm-modules' : process.env.NODE_OPTIONS,
        NODE_ENV: 'test'
      }
    });
  } catch (error) {
    console.error(`❌ Échec de l'exécution du test: ${error.message}`);
    process.exit(1);
  }
}

// Récupérer le chemin du test à partir des arguments de la ligne de commande
const testPath = process.argv[2];

if (!testPath) {
  console.error('❌ Veuillez spécifier un chemin de fichier de test.');
  console.log('📝 Exemple: node scripts/run-single-test.js api/src/__tests__/db/clients/magasin/magasin.test.ts');
  process.exit(1);
}

runSingleTest(testPath);
