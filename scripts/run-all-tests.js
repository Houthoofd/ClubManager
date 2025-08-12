import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Remonter d'un niveau pour atteindre ClubManager
const ROOT_DIR = path.join(__dirname, '..');

// Chemins absolus vers api et front-end
const API_DIR = path.join(ROOT_DIR, 'api');
const FRONT_DIR = path.join(ROOT_DIR, 'front-end');

// Chemins rapport
const REPORT_DIR = path.join(ROOT_DIR, 'rapport');
const REPORT_API_DIR = path.join(REPORT_DIR, 'api');
const REPORT_FRONT_DIR = path.join(REPORT_DIR, 'front-end');

console.log(__filename)

const testPattern = process.argv[2] || '';

function ensureReportDirs() {
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR);
  if (!fs.existsSync(REPORT_API_DIR)) fs.mkdirSync(REPORT_API_DIR);
  if (!fs.existsSync(REPORT_FRONT_DIR)) fs.mkdirSync(REPORT_FRONT_DIR);
}

/**
 * Nettoie le stdout pour tenter d’isoler les logs console.log (optionnel)
 * Ici on retire les lignes vides et les lignes Jest standard, tu peux ajuster.
 */
function filterConsoleLogs(stdout) {
  const lines = stdout.split('\n');
  return lines
    .filter(line => {
      if (!line.trim()) return false; // ignore empty lines
      // filtre simple sur Jest ou autres logs non pertinents
      if (line.includes('PASS') || line.includes('FAIL') || line.match(/^\s*●/)) return false;
      if (line.startsWith('  at ')) return false; // stack traces
      return true;
    })
    .join('\n');
}

function writeErrorLog(reportPath, stderrData, stdoutData) {
  const timeStamp = new Date().toISOString();

  const filteredLogs = filterConsoleLogs(stdoutData);
  const errorSection = stderrData.trim() || 'Aucune erreur détectée.';
  const logSection = filteredLogs.trim() || 'Aucun log console détecté.';

  const header = `\n\n=== Test Run at ${timeStamp} ===\n`;
  const content = `${header}` +
                  `\n----- ERRORS (stderr) -----\n${errorSection}\n` +
                  `\n----- CONSOLE LOGS (stdout) -----\n${logSection}\n`;

  fs.appendFileSync(reportPath, content);

  // Ajouter un résumé simple à la fin
  const hasErrors = !!stderrData.trim();
  const summary = `\n>>> Résumé: ${hasErrors ? 'Des erreurs ont été détectées.' : 'Aucune erreur détectée.'} <<<\n\n`;
  fs.appendFileSync(reportPath, summary);
}

function runJestTest(cwdDir, jestArgs, reportPath) {
  return new Promise((resolve, reject) => {
    const jestProcess = spawn('node', jestArgs, {
      cwd: cwdDir,
      env: {
        ...process.env,
        NODE_OPTIONS: '--experimental-vm-modules',
      },
    });

    let errorLogs = '';
    let outputLogs = '';

    jestProcess.stderr.on('data', (data) => {
      errorLogs += data.toString();
    });

    jestProcess.stdout.on('data', (data) => {
      outputLogs += data.toString();
    });

    jestProcess.stdout.pipe(process.stdout);

    jestProcess.on('close', (code) => {
      writeErrorLog(reportPath, errorLogs, outputLogs);

      if (code !== 0) {
        reject(new Error(`Jest exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function runApiTests() {
  console.log('\n=== Running API Tests ===\n');

  if (!fs.existsSync(API_DIR)) {
    console.error(`API directory not found at: ${API_DIR}`);
    return;
  }

  const apiTestsDir = path.join(API_DIR, 'src', '__tests__');
  if (!fs.existsSync(apiTestsDir)) {
    console.error(`API tests directory not found at: ${apiTestsDir}`);
    return;
  }

  const jestArgs = [
    '--experimental-vm-modules',
    path.join(API_DIR, 'node_modules', 'jest', 'bin', 'jest.js'),
    '--config',
    path.join(API_DIR, 'jest.config.js'),
    '--runInBand',
    '--passWithNoTests',
    '--verbose',
  ];

  if (testPattern) {
    jestArgs.push(testPattern);
  }

  const reportPath = path.join(REPORT_API_DIR, 'tests-errors.txt');

  await runJestTest(API_DIR, jestArgs, reportPath);
}

async function runFrontEndTests() {
  console.log('\n=== Running Front-end Tests ===\n');

  if (!fs.existsSync(FRONT_DIR)) {
    console.error(`Front-end directory not found at: ${FRONT_DIR}`);
    return;
  }

  const jestArgs = [
    'jest',
    '--config',
    path.join(FRONT_DIR, 'jest.config.js'),
    '--passWithNoTests',
  ];

  if (testPattern) {
    jestArgs.push(testPattern);
  }

  const reportPath = path.join(REPORT_FRONT_DIR, 'tests-errors.txt');

  return new Promise((resolve, reject) => {
    const jestProcess = spawn('npx', jestArgs, {
      cwd: FRONT_DIR,
      env: process.env,
    });

    let errorLogs = '';
    let outputLogs = '';

    jestProcess.stderr.on('data', (data) => {
      errorLogs += data.toString();
    });

    jestProcess.stdout.on('data', (data) => {
      outputLogs += data.toString();
    });

    jestProcess.stdout.pipe(process.stdout);

    jestProcess.on('close', (code) => {
      writeErrorLog(reportPath, errorLogs, outputLogs);

      if (code !== 0) {
        reject(new Error(`Jest exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function runAllTests() {
  ensureReportDirs();

  try {
    await runApiTests();
    await runFrontEndTests();
    console.log('\n=== All Tests Completed Successfully ===\n');
    process.exit(0);
  } catch (error) {
    console.error('\n=== Test Execution Failed ===');
    console.error(error);
    process.exit(1);
  }
}

runAllTests();
