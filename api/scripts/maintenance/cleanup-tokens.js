/**
 * Script de nettoyage automatique des tokens expirés
 * À exécuter via cron job (quotidien recommandé)
 *
 * Usage:
 *   node scripts/cleanup-tokens.js
 *   node scripts/cleanup-tokens.js --dry-run
 *   node scripts/cleanup-tokens.js --retention-days=60
 */

import { authService } from '../src/services/auth/auth.service.js';
import {
  nettoyerAnciennesTentatives,
  obtenirEmailsBloques
} from '../src/middleware/rate-limit.js';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

/**
 * Parse les arguments de la ligne de commande
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    retentionDays: 30,
    verbose: false,
  };

  args.forEach(arg => {
    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg.startsWith('--retention-days=')) {
      options.retentionDays = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node scripts/cleanup-tokens.js [options]

Options:
  --dry-run, -d              Mode simulation (ne supprime rien)
  --retention-days=N         Nombre de jours de rétention (défaut: 30)
  --verbose, -v              Mode verbeux
  --help, -h                 Afficher cette aide

Exemples:
  node scripts/cleanup-tokens.js
  node scripts/cleanup-tokens.js --dry-run
  node scripts/cleanup-tokens.js --retention-days=60
  node scripts/cleanup-tokens.js --dry-run --verbose
      `);
      process.exit(0);
    }
  });

  return options;
}

/**
 * Nettoie les password reset tokens expirés
 */
async function cleanupPasswordResetTokens(options) {
  try {
    log('🔍 Nettoyage des password reset tokens expirés...', 'blue');

    if (options.dryRun) {
      log('⚠️  Mode DRY-RUN activé - Aucune suppression réelle', 'yellow');
      return { count: 0, dryRun: true };
    }

    const result = await authService.nettoyerTokensExpires();

    if (result.count > 0) {
      log(`✅ ${result.count} password reset token(s) supprimé(s)`, 'green');
    } else {
      log('ℹ️  Aucun password reset token à supprimer', 'blue');
    }

    return result;
  } catch (error) {
    log(`❌ Erreur lors du nettoyage des password reset tokens: ${error.message}`, 'red');
    if (options.verbose) {
      console.error(error);
    }
    return { count: 0, error: error.message };
  }
}

/**
 * Nettoie les refresh tokens expirés/révoqués
 */
async function cleanupRefreshTokens(options) {
  try {
    log(`🔍 Nettoyage des refresh tokens (rétention: ${options.retentionDays} jours)...`, 'blue');

    if (options.dryRun) {
      log('⚠️  Mode DRY-RUN activé - Aucune suppression réelle', 'yellow');
      return { count: 0, dryRun: true };
    }

    const count = await authService.nettoyerRefreshTokens(options.retentionDays);

    if (count > 0) {
      log(`✅ ${count} refresh token(s) supprimé(s)`, 'green');
    } else {
      log('ℹ️  Aucun refresh token à supprimer', 'blue');
    }

    return { count };
  } catch (error) {
    log(`❌ Erreur lors du nettoyage des refresh tokens: ${error.message}`, 'red');
    if (options.verbose) {
      console.error(error);
    }
    return { count: 0, error: error.message };
  }
}

/**
 * Nettoie les anciennes tentatives d'authentification
 */
async function cleanupAuthAttempts(options) {
  try {
    log(`🔍 Nettoyage des auth attempts (rétention: ${options.retentionDays} jours)...`, 'blue');

    if (options.dryRun) {
      log('⚠️  Mode DRY-RUN activé - Aucune suppression réelle', 'yellow');
      return { count: 0, dryRun: true };
    }

    const count = await nettoyerAnciennesTentatives(options.retentionDays);

    if (count > 0) {
      log(`✅ ${count} auth attempt(s) supprimé(s)`, 'green');
    } else {
      log('ℹ️  Aucun auth attempt à supprimer', 'blue');
    }

    return { count };
  } catch (error) {
    log(`❌ Erreur lors du nettoyage des auth attempts: ${error.message}`, 'red');
    if (options.verbose) {
      console.error(error);
    }
    return { count: 0, error: error.message };
  }
}

/**
 * Affiche les statistiques des comptes bloqués
 */
async function showBlockedAccountsStats(options) {
  try {
    log('📊 Statistiques des comptes bloqués (dernière heure)...', 'blue');

    const bloques = await obtenirEmailsBloques(10, 60);

    if (bloques.length === 0) {
      log('ℹ️  Aucun compte bloqué actuellement', 'blue');
      return;
    }

    log(`⚠️  ${bloques.length} email(s) avec tentatives échouées:`, 'yellow');
    console.log('');
    console.table(bloques.map(b => ({
      Email: b.email,
      'Tentatives échouées': b.tentativesEchouees,
      'Dernière tentative': new Date(b.derniereTentative).toLocaleString('fr-FR'),
    })));

    if (bloques.length >= 10) {
      log('⚠️  Attention: Taux élevé de blocages détecté!', 'yellow');
      log('   Vérifiez s\'il s\'agit d\'une attaque en cours.', 'yellow');
    }
  } catch (error) {
    log(`❌ Erreur lors de la récupération des stats: ${error.message}`, 'red');
    if (options.verbose) {
      console.error(error);
    }
  }
}

/**
 * Génère un rapport de nettoyage
 */
function generateReport(results, startTime) {
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  logSection('📋 RAPPORT DE NETTOYAGE');

  const totalDeleted =
    (results.passwordTokens?.count || 0) +
    (results.refreshTokens?.count || 0) +
    (results.authAttempts?.count || 0);

  log(`Durée totale: ${duration}s`, 'bright');
  log(`Total supprimé: ${totalDeleted} enregistrement(s)`, 'bright');
  console.log('');

  console.table({
    'Password Reset Tokens': results.passwordTokens?.count || 0,
    'Refresh Tokens': results.refreshTokens?.count || 0,
    'Auth Attempts': results.authAttempts?.count || 0,
  });

  // Vérifier les erreurs
  const errors = [];
  if (results.passwordTokens?.error) errors.push('Password Reset Tokens');
  if (results.refreshTokens?.error) errors.push('Refresh Tokens');
  if (results.authAttempts?.error) errors.push('Auth Attempts');

  if (errors.length > 0) {
    log(`⚠️  Erreurs détectées pour: ${errors.join(', ')}`, 'yellow');
  } else {
    log('✅ Nettoyage terminé avec succès', 'green');
  }

  console.log('');
}

/**
 * Fonction principale
 */
async function main() {
  const startTime = Date.now();
  const options = parseArgs();

  logSection('🧹 NETTOYAGE AUTOMATIQUE DES TOKENS - ClubManager');

  log(`Environnement: ${process.env.NODE_ENV || 'development'}`, 'blue');
  log(`Rétention: ${options.retentionDays} jours`, 'blue');

  if (options.dryRun) {
    log('Mode: DRY-RUN (simulation)', 'yellow');
  } else {
    log('Mode: PRODUCTION (suppressions réelles)', 'green');
  }

  console.log('');

  // Vérifier la connexion DB
  try {
    log('🔌 Vérification de la connexion à la base de données...', 'blue');
    const dbCheck = await authService.obtenirStatistiques();
    log('✅ Connexion DB OK', 'green');
    if (options.verbose) {
      log(`   Utilisateurs actifs: ${dbCheck.activeUsers}`, 'blue');
    }
    console.log('');
  } catch (error) {
    log('❌ Impossible de se connecter à la base de données', 'red');
    log(`   Erreur: ${error.message}`, 'red');
    process.exit(1);
  }

  // Exécuter les nettoyages
  const results = {};

  // 1. Password reset tokens
  logSection('1️⃣  PASSWORD RESET TOKENS');
  results.passwordTokens = await cleanupPasswordResetTokens(options);
  console.log('');

  // 2. Refresh tokens
  logSection('2️⃣  REFRESH TOKENS');
  results.refreshTokens = await cleanupRefreshTokens(options);
  console.log('');

  // 3. Auth attempts
  logSection('3️⃣  AUTH ATTEMPTS');
  results.authAttempts = await cleanupAuthAttempts(options);
  console.log('');

  // 4. Statistiques des comptes bloqués
  logSection('4️⃣  COMPTES BLOQUÉS');
  await showBlockedAccountsStats(options);
  console.log('');

  // Générer le rapport final
  generateReport(results, startTime);

  // Recommandations
  if (!options.dryRun) {
    logSection('💡 RECOMMANDATIONS');

    const totalDeleted =
      (results.passwordTokens?.count || 0) +
      (results.refreshTokens?.count || 0) +
      (results.authAttempts?.count || 0);

    if (totalDeleted > 1000) {
      log('⚠️  Plus de 1000 enregistrements supprimés', 'yellow');
      log('   Envisagez d\'augmenter la fréquence de nettoyage', 'yellow');
    }

    if (totalDeleted === 0) {
      log('ℹ️  Aucun enregistrement à supprimer', 'blue');
      log('   Le nettoyage fonctionne correctement', 'blue');
    }

    log('✅ Planifiez ce script en cron job quotidien', 'green');
    log('   Exemple: 0 3 * * * node /path/to/cleanup-tokens.js', 'blue');
    console.log('');
  }

  process.exit(0);
}

// Gestion des erreurs non catchées
process.on('unhandledRejection', (error) => {
  log('❌ Erreur non gérée:', 'red');
  console.error(error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log('❌ Exception non catchée:', 'red');
  console.error(error);
  process.exit(1);
});

// Exécuter le script
main();
