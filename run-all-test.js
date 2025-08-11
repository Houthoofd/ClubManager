const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runTests(projectDir) {
  const testsRoot = path.join(projectDir, 'src/__tests__');
  if (!fs.existsSync(testsRoot)) {
    console.log(`No __tests__ directory found in ${projectDir}. Skipping tests.`);
    return true; // Pas d'erreur, juste pas de tests
  }

  // Recherche config jest
  const jestConfigCjs = path.join(projectDir, 'jest.config.cjs');
  const jestConfigJs = path.join(projectDir, 'jest.config.js');
  const jestConfigPath = fs.existsSync(jestConfigCjs) ? jestConfigCjs : (fs.existsSync(jestConfigJs) ? jestConfigJs : null);

  if (!jestConfigPath) {
    console.log(`Jest configuration file not found in ${projectDir}`);
    return false;
  }

  // Trouve tous les fichiers de test
  function findTestFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        results = results.concat(findTestFiles(filePath));
      } else if (file.endsWith('.test.tsx') || file.endsWith('.test.ts') || file.endsWith('.test.js') || file.endsWith('.test.jsx')) {
        results.push(filePath);
      }
    });
    return results;
  }

  const testFiles = findTestFiles(testsRoot);

  if (testFiles.length === 0) {
    console.log(`No test files found in ${testsRoot}. Skipping tests.`);
    return true;
  }

  const configFileName = path.basename(jestConfigPath);
  process.chdir(projectDir);

  let allPassed = true;

  for (const file of testFiles) {
    try {
      const relativeFilePath = path.relative(projectDir, file);
      console.log(`\n--- Running test: ${file} ---`);
      execSync(`npx jest --config="./${configFileName}" "${relativeFilePath}"`, { stdio: 'inherit' });
    } catch (e) {
      allPassed = false;
    }
  }

  return allPassed;
}

// Exécute les tests front-end
const frontEndDir = path.join(__dirname, 'front-end');
console.log('\n=== Running Front-End Tests ===');
const frontEndResult = runTests(frontEndDir);

// Exécute les tests API
const apiDir = path.join(__dirname, 'api');
console.log('\n=== Running API Tests ===');
const apiResult = runTests(apiDir);

// Statut global
if (frontEndResult && apiResult) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.');
  process.exit(1);
}
