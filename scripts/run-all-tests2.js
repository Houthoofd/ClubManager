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

async function runProjectTests(project, command) {
  console.log(`\n=== Exécution des tests ${project.toUpperCase()} ===\n`);
  
  return new Promise((resolve) => {
    console.log(`Exécution de la commande: ${command} dans ${projectPaths[project]}\n`);
    
    const child = exec(command, {
      cwd: projectPaths[project],
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on('exit', (code) => {
      console.log(`\n=== Fin des tests ${project.toUpperCase()} avec code ${code || 0} ===\n`);
      resolve(code || 0);
    });
  });
}

const args = process.argv.slice(2);
const runApi = args.includes('--api') || (!args.includes('--api') && !args.includes('--frontend'));
const runFrontend = args.includes('--frontend') || (!args.includes('--api') && !args.includes('--frontend'));

(async () => {
  let apiExit = 0, feExit = 0;

  console.log('=== Vérification des projets ===');
  console.log(`API: ${projectExists.api ? 'Trouvé' : 'Non trouvé'}`);
  console.log(`Front-End: ${projectExists.frontend ? 'Trouvé' : 'Non trouvé'}`);
  console.log('===========================\n');

  if (runApi && projectExists.api) {
    apiExit = await runProjectTests('api', testCommands.api);
  } else if (runApi) {
    console.log('Le projet API n\'est pas disponible.');
  }

  if (runFrontend && projectExists.frontend) {
    feExit = await runProjectTests('frontend', testCommands.frontend);
  } else if (runFrontend) {
    console.log('Le projet Front-End n\'est pas disponible.');
  }

  const exitCode = apiExit !== 0 || feExit !== 0 ? 1 : 0;
  console.log(`\n=== Résumé des tests ===`);
  if (runApi) console.log(`API: ${apiExit === 0 ? 'Succès' : 'Échec'}`);
  if (runFrontend) console.log(`Front-End: ${feExit === 0 ? 'Succès' : 'Échec'}`);
  console.log('===========================\n');
  
  process.exit(exitCode);
})();
