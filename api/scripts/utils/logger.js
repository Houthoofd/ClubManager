/**
 * 🎨 Logger Utilities - ClubManager API
 *
 * Utilitaires de logging avec couleurs pour les scripts de génération
 */

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgCyan: '\x1b[46m',
};

/**
 * Log un message avec une couleur spécifique
 */
export function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

/**
 * Log une erreur et termine le processus
 */
export function error(message) {
  log(`❌ ERREUR: ${message}`, 'red');
  process.exit(1);
}

/**
 * Log un message de succès
 */
export function success(message) {
  log(`✅ ${message}`, 'green');
}

/**
 * Log une information
 */
export function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

/**
 * Log un avertissement
 */
export function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Log un titre de section
 */
export function section(message) {
  console.log('');
  log(`${'='.repeat(60)}`, 'bright');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'bright');
  console.log('');
}

/**
 * Log un sous-titre
 */
export function subsection(message) {
  console.log('');
  log(`  ${message}`, 'cyan');
  log(`  ${'-'.repeat(message.length)}`, 'dim');
}

/**
 * Log une étape numérotée
 */
export function step(number, message) {
  log(`  ${number}. ${message}`, 'blue');
}

/**
 * Log une création de fichier
 */
export function fileCreated(path) {
  log(`  ✓ Créé: ${path}`, 'green');
}

/**
 * Log une mise à jour de fichier
 */
export function fileUpdated(path) {
  log(`  ↻ Mis à jour: ${path}`, 'yellow');
}

/**
 * Log un fichier ignoré (déjà existant)
 */
export function fileSkipped(path) {
  log(`  ⊘ Ignoré: ${path}`, 'dim');
}

/**
 * Log un mode dry-run
 */
export function dryRun(message) {
  log(`  [DRY-RUN] ${message}`, 'magenta');
}

/**
 * Affiche un banner de bienvenue
 */
export function banner(title, subtitle = '') {
  console.log('');
  log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log(`║  ${title.padEnd(57)}║`, 'cyan');
  if (subtitle) {
    log(`║  ${subtitle.padEnd(57)}║`, 'dim');
  }
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
  console.log('');
}

/**
 * Affiche un résumé des opérations
 */
export function summary(stats) {
  console.log('');
  log('📊 Résumé des opérations:', 'bright');
  console.log('');

  if (stats.created) {
    log(`  ✅ Fichiers créés:      ${stats.created}`, 'green');
  }
  if (stats.updated) {
    log(`  ↻  Fichiers mis à jour: ${stats.updated}`, 'yellow');
  }
  if (stats.skipped) {
    log(`  ⊘  Fichiers ignorés:    ${stats.skipped}`, 'dim');
  }
  if (stats.errors) {
    log(`  ❌ Erreurs:             ${stats.errors}`, 'red');
  }

  console.log('');
}

/**
 * Affiche la liste des options disponibles
 */
export function options(optionsList) {
  log('Options disponibles:', 'bright');
  console.log('');

  optionsList.forEach(opt => {
    log(`  ${opt.flag.padEnd(25)} ${opt.description}`, opt.enabled ? 'green' : 'dim');
  });

  console.log('');
}

/**
 * Affiche des exemples d'utilisation
 */
export function examples(examplesList) {
  log('Exemples:', 'bright');
  console.log('');

  examplesList.forEach((example, index) => {
    log(`  ${index + 1}. ${example.description}`, 'cyan');
    log(`     ${example.command}`, 'dim');
    console.log('');
  });
}

/**
 * Progress bar simple
 */
export function progress(current, total, label = '') {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 2);
  const empty = 50 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  process.stdout.write(`\r  ${label} [${bar}] ${percentage}%`);

  if (current === total) {
    console.log('');
  }
}

export default {
  log,
  error,
  success,
  info,
  warning,
  section,
  subsection,
  step,
  fileCreated,
  fileUpdated,
  fileSkipped,
  dryRun,
  banner,
  summary,
  options,
  examples,
  progress,
  COLORS
};
