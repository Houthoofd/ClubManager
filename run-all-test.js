const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testsRoot = path.join(__dirname, 'front-end/src/__tests__');
// Vérifie si jest.config.cjs existe, sinon utilise jest.config.js
const jestConfigCjs = path.join(__dirname, 'front-end/jest.config.cjs');
const jestConfigJs = path.join(__dirname, 'front-end/jest.config.js');
const jestConfigPath = fs.existsSync(jestConfigCjs) ? jestConfigCjs : jestConfigJs;

console.log(testsRoot)

function findTestFiles(dir) {
  console.log(`Searching for test files in: ${dir}`);
  let results = [];
  const list = fs.readdirSync(dir);
  console.log(`Searching for test files in: ${dir}`);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    console.log(`Checking file: ${filePath}`);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findTestFiles(filePath));
    } else if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

if (!fs.existsSync(testsRoot)) {
  console.log('No __tests__ directory found. Skipping tests.');
  process.exit(0);
}

console.log(testsRoot);
const testFiles = findTestFiles(testsRoot);

if (testFiles.length === 0) {
  console.log('No test files found in __tests__. Skipping tests.');
  process.exit(0);
}

let allPassed = true;

// Vérifiez que le fichier de configuration Jest existe
if (!fs.existsSync(jestConfigPath)) {
  console.log(`Jest configuration file not found at ${jestConfigPath}`);
  process.exit(1);
}

// Exécuter Jest depuis le dossier front-end avec sa propre configuration
const frontEndDir = path.join(__dirname, 'front-end');
process.chdir(frontEndDir); // Change le répertoire de travail

// Utiliser le nom de fichier correct pour la configuration
const configFileName = path.basename(jestConfigPath);
console.log(`Using Jest config: ${configFileName}`);

testFiles.forEach(file => {
  try {
    // Utilisez le chemin relatif depuis front-end
    const relativeFilePath = path.relative(frontEndDir, file);
    console.log(`\n--- Running test: ${file} ---`);
    execSync(`npx jest --config="./${configFileName}" "${relativeFilePath}"`, { stdio: 'inherit' });
  } catch (e) {
    allPassed = false;
  }
});

if (allPassed) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.');
  process.exit(1);
}
