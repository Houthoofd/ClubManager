#!/usr/bin/env node

/**
 * 🧹 Cleanup Routes - ClubManager API
 *
 * Ce script identifie et supprime les routes redondantes qui peuvent être
 * fusionnées dans les domaines principaux de @clubmanager/types
 *
 * Usage:
 *   node scripts/cleanup-routes.js [options]
 *
 * Options:
 *   --dry-run              Affiche ce qui serait supprimé sans supprimer
 *   --confirm              Supprime sans demander confirmation
 *   --backup               Crée une sauvegarde avant suppression
 *
 * Exemples:
 *   node scripts/cleanup-routes.js --dry-run
 *   node scripts/cleanup-routes.js --backup
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Routes à conserver (domaines principaux + utilitaires)
 */
const ROUTES_TO_KEEP = [
  // Domaines principaux (@clubmanager/types)
  "utilisateurs",      // users
  "cours",            // activities + sessions
  "inscription",      // memberships
  "magasin",          // shop
  "messages",         // communications
  "evenements",       // events
  "documents",        // documents
  "gdpr",            // gdpr
  "parametres",      // settings
  "statistiques",    // statistics
  "audit",           // audit

  // Routes système/utilitaires essentielles
  "auth",            // Authentification (essentiel)
  "stripe",          // Paiements Stripe (critique business)
  "upload",          // Upload de fichiers (utilitaire)
  "health",          // Monitoring (utilitaire)
  "email",           // Emails (utilitaire)
];

/**
 * Routes à supprimer avec leurs raisons et suggestions de migration
 */
const ROUTES_TO_DELETE = {
  "alertes": {
    reason: "Peut être fusionné avec messages/communications",
    migrateInto: "messages",
    priority: "low",
  },
  "commandes": {
    reason: "Peut être fusionné avec magasin (shop)",
    migrateInto: "magasin",
    priority: "medium",
  },
  "compte": {
    reason: "Peut être fusionné avec utilisateurs",
    migrateInto: "utilisateurs",
    priority: "low",
  },
  "confirmation": {
    reason: "Peut être fusionné avec inscription",
    migrateInto: "inscription",
    priority: "low",
  },
  "echeances": {
    reason: "Peut être fusionné avec magasin/paiements",
    migrateInto: "magasin",
    priority: "medium",
  },
  "informations": {
    reason: "Peut être fusionné avec parametres ou utilisateurs",
    migrateInto: "parametres",
    priority: "low",
  },
  "paiements": {
    reason: "Peut être fusionné avec stripe",
    migrateInto: "stripe",
    priority: "high",
  },
  "professeurs": {
    reason: "Peut être fusionné avec utilisateurs (type de user)",
    migrateInto: "utilisateurs",
    priority: "medium",
  },
  "stocks": {
    reason: "Peut être fusionné avec magasin",
    migrateInto: "magasin",
    priority: "medium",
  },
  "verification": {
    reason: "Peut être fusionné avec auth",
    migrateInto: "auth",
    priority: "low",
  },
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// ============================================================================
// UTILITAIRES
// ============================================================================

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function banner(title, subtitle = '') {
  console.log('');
  log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log(`║  ${title.padEnd(57)}║`, 'cyan');
  if (subtitle) {
    log(`║  ${subtitle.padEnd(57)}║`, 'cyan');
  }
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');
}

function section(title) {
  console.log('');
  log('='.repeat(60), 'bright');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'bright');
  console.log('');
}

function resolveRoutesPath(...segments) {
  return path.join(__dirname, '..', 'src', 'routes', ...segments);
}

function routeExists(routeName) {
  const routePath = resolveRoutesPath(routeName);
  return fs.existsSync(routePath);
}

async function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (oui/non): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o');
    });
  });
}

function createBackup(routeName) {
  const routePath = resolveRoutesPath(routeName);
  const backupPath = resolveRoutesPath(`_backup_${routeName}_${Date.now()}`);

  try {
    fs.cpSync(routePath, backupPath, { recursive: true });
    success(`Sauvegarde créée: ${backupPath}`);
    return backupPath;
  } catch (err) {
    error(`Erreur lors de la sauvegarde: ${err.message}`);
    return null;
  }
}

function deleteRoute(routeName) {
  const routePath = resolveRoutesPath(routeName);

  try {
    fs.rmSync(routePath, { recursive: true, force: true });
    return true;
  } catch (err) {
    error(`Erreur lors de la suppression de ${routeName}: ${err.message}`);
    return false;
  }
}

// ============================================================================
// ANALYSE
// ============================================================================

function analyzeRoutes() {
  const routesPath = resolveRoutesPath();
  const existingRoutes = fs.readdirSync(routesPath).filter((item) => {
    const fullPath = path.join(routesPath, item);
    const stat = fs.statSync(fullPath);
    return stat.isDirectory() && !item.startsWith('.') && !item.startsWith('_');
  });

  const analysis = {
    total: existingRoutes.length,
    toKeep: [],
    toDelete: [],
    unknown: [],
  };

  for (const route of existingRoutes) {
    if (ROUTES_TO_KEEP.includes(route)) {
      analysis.toKeep.push(route);
    } else if (ROUTES_TO_DELETE[route]) {
      analysis.toDelete.push({
        name: route,
        ...ROUTES_TO_DELETE[route],
      });
    } else {
      analysis.unknown.push(route);
    }
  }

  // Trier par priorité
  analysis.toDelete.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return analysis;
}

function displayAnalysis(analysis) {
  section('Analyse des routes');

  log(`  Total routes:             ${analysis.total}`, 'bright');
  log(`  À conserver:              ${analysis.toKeep.length}`, 'green');
  log(`  À supprimer:              ${analysis.toDelete.length}`, 'red');
  log(`  Non référencées:          ${analysis.unknown.length}`, 'yellow');
  console.log('');

  if (analysis.toKeep.length > 0) {
    log('Routes à CONSERVER:', 'green');
    analysis.toKeep.forEach((route) => {
      console.log(`  ✓ ${route}`);
    });
    console.log('');
  }

  if (analysis.toDelete.length > 0) {
    log('Routes à SUPPRIMER:', 'red');
    analysis.toDelete.forEach((route) => {
      const priorityColor = route.priority === 'high' ? 'red' :
                           route.priority === 'medium' ? 'yellow' : 'reset';
      console.log(`  ✗ ${route.name.padEnd(20)} [${route.priority.toUpperCase()}]`);
      log(`    → ${route.reason}`, 'dim');
      log(`    → Migrer vers: ${route.migrateInto}`, 'cyan');
      console.log('');
    });
  }

  if (analysis.unknown.length > 0) {
    log('Routes NON RÉFÉRENCÉES:', 'yellow');
    analysis.unknown.forEach((route) => {
      console.log(`  ? ${route} (à vérifier manuellement)`);
    });
    console.log('');
  }
}

// ============================================================================
// SUPPRESSION
// ============================================================================

async function cleanupRoutes(options) {
  const { dryRun = false, confirm = false, backup = false } = options;

  const analysis = analyzeRoutes();
  displayAnalysis(analysis);

  if (analysis.toDelete.length === 0) {
    success('Aucune route à supprimer');
    return;
  }

  if (dryRun) {
    info('Mode DRY-RUN - Aucune suppression effectuée');
    return;
  }

  // Demander confirmation
  if (!confirm) {
    warning(`Vous allez supprimer ${analysis.toDelete.length} route(s)`);
    const confirmed = await askConfirmation('Voulez-vous continuer?');
    if (!confirmed) {
      info('Annulé par l\'utilisateur');
      return;
    }
  }

  section('Suppression des routes');

  const stats = {
    deleted: 0,
    failed: 0,
    backedUp: 0,
  };

  for (const route of analysis.toDelete) {
    info(`Traitement de: ${route.name}`);

    // Créer une sauvegarde si demandé
    if (backup) {
      const backupPath = createBackup(route.name);
      if (backupPath) {
        stats.backedUp++;
      }
    }

    // Supprimer la route
    const deleted = deleteRoute(route.name);
    if (deleted) {
      success(`Supprimé: ${route.name}`);
      stats.deleted++;
    } else {
      stats.failed++;
    }
  }

  console.log('');
  section('Résumé');
  log(`  Routes supprimées:        ${stats.deleted}`, 'green');
  if (stats.backedUp > 0) {
    log(`  Sauvegardes créées:       ${stats.backedUp}`, 'cyan');
  }
  if (stats.failed > 0) {
    log(`  Échecs:                   ${stats.failed}`, 'red');
  }
  console.log('');

  if (stats.deleted > 0) {
    section('Prochaines étapes');
    console.log('  1. Vérifiez que l\'application fonctionne toujours');
    console.log('  2. Migrez les fonctionnalités vers les routes cibles:');
    analysis.toDelete.forEach((route) => {
      if (stats.deleted > 0) {
        console.log(`     - ${route.name} → ${route.migrateInto}`);
      }
    });
    console.log('  3. Mettez à jour les imports dans le code');
    console.log('  4. Mettez à jour le schéma GraphQL principal');
    if (backup) {
      console.log('  5. Supprimez les sauvegardes _backup_* si tout fonctionne');
    }
    console.log('');
  }
}

// ============================================================================
// MAIN
// ============================================================================

function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    confirm: false,
    backup: false,
  };

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--dry-run')) options.dryRun = true;
  if (args.includes('--confirm')) options.confirm = true;
  if (args.includes('--backup')) options.backup = true;

  return options;
}

function showHelp() {
  banner('🧹 Cleanup Routes', 'Nettoyage des routes redondantes');

  info('Usage:');
  console.log('  node scripts/cleanup-routes.js [options]\n');

  info('Options:');
  console.log('  --dry-run    Affiche ce qui serait supprimé sans supprimer');
  console.log('  --confirm    Supprime sans demander confirmation');
  console.log('  --backup     Crée une sauvegarde avant suppression');
  console.log('');

  info('Exemples:');
  console.log('  node scripts/cleanup-routes.js --dry-run');
  console.log('  node scripts/cleanup-routes.js --backup');
  console.log('  node scripts/cleanup-routes.js --confirm --backup');
  console.log('');
}

async function main() {
  banner('🧹 Cleanup Routes', 'Nettoyage et organisation des routes');

  const options = parseArguments();
  await cleanupRoutes(options);

  success('Nettoyage terminé ! 🎉');
}

main().catch((err) => {
  error(`Erreur fatale: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
