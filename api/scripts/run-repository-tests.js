#!/usr/bin/env node

/**
 * Script pour exécuter les tests des repositories
 * Usage: node scripts/run-repository-tests.js [module]
 *
 * Exemples:
 *   node scripts/run-repository-tests.js           # Tous les tests
 *   node scripts/run-repository-tests.js alertes   # Tests alertes uniquement
 *   node scripts/run-repository-tests.js --coverage # Avec couverture
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Modules disponibles
const availableModules = {
  alertes: 'src/__tests__/db/clients/alertes',
  auth: 'src/__tests__/db/clients/auth',
  commandes: 'src/__tests__/db/clients/commandes',
  cours: 'src/__tests__/db/clients/cours',
  compte: 'src/__tests__/db/clients/compte',
  informations: 'src/__tests__/db/clients/informations',
  all: 'src/__tests__/db/clients'
};

// Afficher le logo
function displayBanner() {
  console.log(colors.cyan + colors.bright);
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   ClubManager - Repository Tests Runner       ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

// Afficher l'aide
function displayHelp() {
  console.log(colors.blue + '\n📚 Usage:' + colors.reset);
  console.log('  node scripts/run-repository-tests.js [module] [options]\n');

  console.log(colors.blue + '🎯 Modules disponibles:' + colors.reset);
  Object.keys(availableModules).forEach(module => {
    const icon = module === 'all' ? '📦' : '📁';
    console.log(`  ${icon} ${colors.green}${module}${colors.reset}`);
  });

  console.log(colors.blue + '\n⚙️  Options:' + colors.reset);
  console.log(`  ${colors.green}--coverage${colors.reset}     Générer le rapport de couverture`);
  console.log(`  ${colors.green}--watch${colors.reset}        Mode watch (auto-reload)`);
  console.log(`  ${colors.green}--verbose${colors.reset}      Mode verbeux`);
  console.log(`  ${colors.green}--help${colors.reset}         Afficher cette aide\n`);

  console.log(colors.blue + '💡 Exemples:' + colors.reset);
  console.log(`  ${colors.cyan}node scripts/run-repository-tests.js${colors.reset}`);
  console.log(`  ${colors.cyan}node scripts/run-repository-tests.js alertes${colors.reset}`);
  console.log(`  ${colors.cyan}node scripts/run-repository-tests.js commandes --coverage${colors.reset}`);
  console.log(`  ${colors.cyan}node scripts/run-repository-tests.js all --watch${colors.reset}\n`);
}

// Exécuter Jest
function runJest(testPath, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(colors.yellow + `\n🚀 Exécution des tests: ${testPath}` + colors.reset);
    console.log(colors.yellow + '━'.repeat(50) + colors.reset + '\n');

    const jestArgs = [
      '--config', 'jest.config.cjs',
      testPath
    ];

    // Ajouter les options
    if (options.coverage) {
      jestArgs.push('--coverage');
      jestArgs.push('--coverageDirectory=coverage/repositories');
    }

    if (options.watch) {
      jestArgs.push('--watch');
    }

    if (options.verbose) {
      jestArgs.push('--verbose');
    }

    // Variables d'environnement
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      NODE_OPTIONS: '--experimental-vm-modules'
    };

    // Exécuter Jest
    const jest = spawn('npx', ['jest', ...jestArgs], {
      cwd: join(__dirname, '..'),
      env,
      stdio: 'inherit',
      shell: true
    });

    jest.on('close', (code) => {
      if (code === 0) {
        console.log(colors.green + '\n✅ Tests terminés avec succès!' + colors.reset);
        resolve();
      } else {
        console.log(colors.red + '\n❌ Certains tests ont échoué.' + colors.reset);
        reject(new Error(`Jest a terminé avec le code ${code}`));
      }
    });

    jest.on('error', (error) => {
      console.error(colors.red + '\n❌ Erreur lors de l\'exécution de Jest:' + colors.reset);
      console.error(error);
      reject(error);
    });
  });
}

// Afficher un résumé des tests disponibles
function displayTestsSummary() {
  console.log(colors.blue + '\n📊 Tests disponibles:' + colors.reset);
  console.log('┌─────────────────┬──────────────────────────────────────┐');
  console.log('│ Module          │ Tests                                │');
  console.log('├─────────────────┼──────────────────────────────────────┤');
  console.log('│ Alertes         │ 23 tests - Dashboard, actives, stats │');
  console.log('│ Auth            │ 47 tests - Login, tokens, security   │');
  console.log('│ Commandes       │ 68 tests - CRUD, stats, validation   │');
  console.log('│ Cours           │ 69 tests - Gestion complète          │');
  console.log('│ Compte          │ Existants - À améliorer              │');
  console.log('│ Informations    │ Existants - À améliorer              │');
  console.log('└─────────────────┴──────────────────────────────────────┘');
  console.log(colors.yellow + '\n💡 Total: 207+ tests unitaires' + colors.reset + '\n');
}

// Point d'entrée principal
async function main() {
  const args = process.argv.slice(2);

  // Afficher la bannière
  displayBanner();

  // Vérifier si --help est demandé
  if (args.includes('--help') || args.includes('-h')) {
    displayHelp();
    displayTestsSummary();
    process.exit(0);
  }

  // Si aucun argument, afficher l'aide
  if (args.length === 0) {
    console.log(colors.yellow + '⚠️  Aucun module spécifié, exécution de tous les tests...' + colors.reset);
    args.push('all');
  }

  // Extraire le module et les options
  const moduleArg = args.find(arg => !arg.startsWith('--'));
  const module = moduleArg || 'all';

  const options = {
    coverage: args.includes('--coverage'),
    watch: args.includes('--watch'),
    verbose: args.includes('--verbose')
  };

  // Vérifier si le module existe
  if (!availableModules[module]) {
    console.error(colors.red + `\n❌ Module inconnu: ${module}` + colors.reset);
    console.log(colors.yellow + '\n📝 Modules disponibles:' + colors.reset);
    Object.keys(availableModules).forEach(m => {
      console.log(`  - ${colors.green}${m}${colors.reset}`);
    });
    process.exit(1);
  }

  // Afficher les informations
  console.log(colors.blue + '📋 Configuration:' + colors.reset);
  console.log(`  Module:     ${colors.green}${module}${colors.reset}`);
  console.log(`  Couverture: ${options.coverage ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`  Watch:      ${options.watch ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`  Verbose:    ${options.verbose ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);

  // Exécuter les tests
  try {
    await runJest(availableModules[module], options);

    if (options.coverage) {
      console.log(colors.cyan + '\n📊 Rapport de couverture généré dans: coverage/repositories' + colors.reset);
    }

    console.log(colors.green + '\n🎉 Tous les tests sont passés!' + colors.reset);
    process.exit(0);
  } catch (error) {
    console.error(colors.red + '\n💥 Erreur lors de l\'exécution des tests' + colors.reset);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error(colors.red + '\n💥 Erreur non gérée:' + colors.reset);
  console.error(error);
  process.exit(1);
});

// Gestion de CTRL+C
process.on('SIGINT', () => {
  console.log(colors.yellow + '\n\n⚠️  Tests interrompus par l\'utilisateur' + colors.reset);
  process.exit(0);
});

// Exécuter
main();
