import { exec } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectPaths = {
  api: join(__dirname, '../api'),
  frontend: join(__dirname, '../front-end'),
};

const projectExists = {
  api: existsSync(projectPaths.api),
  frontend: existsSync(projectPaths.frontend)
};

const testCommands = {
  api: 'npm run test:windows',
  frontend: 'npm test'
};

// === Logger centralisé ===
const Logger = {
  info: (message, project) => {
    const prefix = project ? `[INFO] [${project.toUpperCase()}]` : `[INFO]`;
    console.log(`${prefix} ${message}`);
  },
  success: (message, project) => {
    const prefix = project ? `[SUCCESS] [${project.toUpperCase()}]` : `[SUCCESS]`;
    console.log(`${prefix} ${message}`);
  },
  warn: (message, project) => {
    const prefix = project ? `[WARN] [${project.toUpperCase()}]` : `[WARN]`;
    console.warn(`${prefix} ${message}`);
  },
  error: (message, project, stack) => {
    const prefix = project ? `[ERROR] [${project.toUpperCase()}]` : `[ERROR]`;
    console.error(`${prefix} ${message}`);
    if (stack) console.error(stack);
  }
};

// === Fonction pour exécuter les tests ===
async function runProjectTests(project, command) {
  Logger.info(`Début des tests`, project);
  Logger.info(`Commande: ${command}`, project);

  return new Promise((resolve) => {
    try {
      const child = exec(command, {
        cwd: projectPaths[project],
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      child.stdout.on('data', (data) => process.stdout.write(data));
      child.stderr.on('data', (data) => process.stderr.write(data));

      child.on('exit', (code) => {
        if (code === 0) {
          Logger.success(`Tests terminés avec succès`, project);
        } else {
          Logger.error(`Tests terminés avec code ${code}`, project);
        }
        resolve(code || 0);
      });
    } catch (err) {
      Logger.error(err.message, project, err.stack);
      resolve(1);
    }
  });
}

// === Analyse des arguments ===
const args = process.argv.slice(2);
const runApi = args.includes('--api') || (!args.includes('--api') && !args.includes('--frontend'));
const runFrontend = args.includes('--frontend') || (!args.includes('--api') && !args.includes('--frontend'));

// === Exécution principale ===
(async () => {
  let apiExit = 0, feExit = 0;

  Logger.info('Vérification des projets');
  Logger.info(`API: ${projectExists.api ? 'Trouvé' : 'Non trouvé'}`);
  Logger.info(`Front-End: ${projectExists.frontend ? 'Trouvé' : 'Non trouvé'}`);

  if (runApi) {
    if (projectExists.api) apiExit = await runProjectTests('api', testCommands.api);
    else Logger.warn('Le projet API n\'est pas disponible.', 'api');
  }

  if (runFrontend) {
    if (projectExists.frontend) feExit = await runProjectTests('frontend', testCommands.frontend);
    else Logger.warn('Le projet Front-End n\'est pas disponible.', 'frontend');
  }

  const exitCode = apiExit !== 0 || feExit !== 0 ? 1 : 0;
  Logger.info('Résumé des tests');
  if (runApi) Logger.info(`API: ${apiExit === 0 ? 'Succès' : 'Échec'}`, 'api');
  if (runFrontend) Logger.info(`Front-End: ${feExit === 0 ? 'Succès' : 'Échec'}`, 'frontend');

  process.exit(exitCode);
})();
