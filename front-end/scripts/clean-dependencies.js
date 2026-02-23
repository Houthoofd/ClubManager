#!/usr/bin/env node

/**
 * ====================================================================
 * CLEAN DEPENDENCIES SCRIPT
 * ====================================================================
 *
 * Script pour supprimer les dépendances non utilisées du projet.
 * Basé sur l'analyse depcheck.
 *
 * USAGE:
 *   node scripts/clean-dependencies.js           # Dry-run (affichage seulement)
 *   node scripts/clean-dependencies.js --apply   # Suppression effective
 *
 * DÉPENDANCES À SUPPRIMER:
 * - @tanstack/react-table (non utilisé, remplacé par PatternFly Table)
 * - react-icons (non utilisé, on utilise @patternfly/react-icons)
 * - js-cookie (non utilisé, gestion manuelle des cookies)
 * - Storybook (non utilisé dans ce projet)
 * - msw (Mock Service Worker - non utilisé)
 * - change-case-all (non utilisé dans les scripts)
 *
 * GAIN ESTIMÉ:
 * - @tanstack/react-table: ~50KB
 * - react-icons: ~30KB
 * - js-cookie: ~3KB
 * - Storybook suite complète: ~15MB (devDependencies)
 * - msw: ~5MB (devDependencies)
 * - TOTAL: ~83KB production + 20MB dev
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ====================================================================
// CONFIGURATION
// ====================================================================

const DEPENDENCIES_TO_REMOVE = [
  '@tanstack/react-table',
  'react-icons',
  'js-cookie',
];

const DEV_DEPENDENCIES_TO_REMOVE = [
  '@storybook/addon-essentials',
  '@storybook/addon-interactions',
  '@storybook/addon-links',
  '@storybook/blocks',
  '@storybook/react',
  '@storybook/react-vite',
  '@storybook/test',
  'storybook',
  'eslint-plugin-storybook',
  'msw',
  'change-case-all',
  '@types/js-cookie',
];

const PACKAGE_JSON_PATH = resolve(__dirname, '../package.json');

// ====================================================================
// HELPERS
// ====================================================================

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  title: (msg) => {
    console.log('');
    console.log('='.repeat(70));
    console.log(`  ${msg}`);
    console.log('='.repeat(70));
    console.log('');
  },
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ====================================================================
// MAIN LOGIC
// ====================================================================

function cleanDependencies(apply = false) {
  log.title('NETTOYAGE DES DÉPENDANCES INUTILISÉES');

  // Read package.json
  let packageJson;
  try {
    const content = readFileSync(PACKAGE_JSON_PATH, 'utf-8');
    packageJson = JSON.parse(content);
  } catch (error) {
    log.error(`Impossible de lire package.json: ${error.message}`);
    process.exit(1);
  }

  const stats = {
    dependencies: {
      before: Object.keys(packageJson.dependencies || {}).length,
      removed: 0,
      kept: 0,
    },
    devDependencies: {
      before: Object.keys(packageJson.devDependencies || {}).length,
      removed: 0,
      kept: 0,
    },
  };

  // ====================================================================
  // DEPENDENCIES (PRODUCTION)
  // ====================================================================

  log.info('Analyse des dependencies (production)...');
  console.log('');

  const removedDeps = [];
  const keptDeps = {};

  for (const [name, version] of Object.entries(packageJson.dependencies || {})) {
    if (DEPENDENCIES_TO_REMOVE.includes(name)) {
      removedDeps.push({ name, version });
      stats.dependencies.removed++;
    } else {
      keptDeps[name] = version;
      stats.dependencies.kept++;
    }
  }

  if (removedDeps.length > 0) {
    log.warning(`${removedDeps.length} dépendance(s) à supprimer:`);
    removedDeps.forEach(({ name, version }) => {
      console.log(`  - ${name}@${version}`);
    });
  } else {
    log.success('Aucune dépendance à supprimer');
  }

  // ====================================================================
  // DEV DEPENDENCIES
  // ====================================================================

  console.log('');
  log.info('Analyse des devDependencies...');
  console.log('');

  const removedDevDeps = [];
  const keptDevDeps = {};

  for (const [name, version] of Object.entries(packageJson.devDependencies || {})) {
    if (DEV_DEPENDENCIES_TO_REMOVE.includes(name)) {
      removedDevDeps.push({ name, version });
      stats.devDependencies.removed++;
    } else {
      keptDevDeps[name] = version;
      stats.devDependencies.kept++;
    }
  }

  if (removedDevDeps.length > 0) {
    log.warning(`${removedDevDeps.length} devDependence(s) à supprimer:`);
    removedDevDeps.forEach(({ name, version }) => {
      console.log(`  - ${name}@${version}`);
    });
  } else {
    log.success('Aucune devDependency à supprimer');
  }

  // ====================================================================
  // SUMMARY
  // ====================================================================

  console.log('');
  log.title('RÉSUMÉ');

  console.log('📦 DEPENDENCIES (production):');
  console.log(`  Avant:     ${stats.dependencies.before}`);
  console.log(`  Supprimées: ${stats.dependencies.removed}`);
  console.log(`  Conservées: ${stats.dependencies.kept}`);
  console.log('');

  console.log('🛠️  DEV DEPENDENCIES:');
  console.log(`  Avant:     ${stats.devDependencies.before}`);
  console.log(`  Supprimées: ${stats.devDependencies.removed}`);
  console.log(`  Conservées: ${stats.devDependencies.kept}`);
  console.log('');

  const totalRemoved = stats.dependencies.removed + stats.devDependencies.removed;

  if (totalRemoved === 0) {
    log.success('Aucune dépendance à supprimer !');
    return;
  }

  console.log(`📊 TOTAL: ${totalRemoved} dépendance(s) à supprimer`);
  console.log('');

  // Estimation des gains
  const estimatedSavings = {
    production: 83, // KB
    dev: 20 * 1024, // 20 MB in KB
  };

  console.log('💾 GAINS ESTIMÉS:');
  console.log(`  Production bundle: ~${estimatedSavings.production} KB`);
  console.log(`  node_modules size: ~${formatBytes(estimatedSavings.dev * 1024)}`);
  console.log('');

  // ====================================================================
  // APPLY CHANGES
  // ====================================================================

  if (!apply) {
    console.log('');
    log.info('MODE DRY-RUN - Aucune modification appliquée');
    log.info('Pour appliquer les changements, exécutez:');
    console.log('');
    console.log('  node scripts/clean-dependencies.js --apply');
    console.log('');
    return;
  }

  // Apply changes
  log.info('Application des modifications...');

  const newPackageJson = {
    ...packageJson,
    dependencies: keptDeps,
    devDependencies: keptDevDeps,
  };

  try {
    writeFileSync(
      PACKAGE_JSON_PATH,
      JSON.stringify(newPackageJson, null, 2) + '\n',
      'utf-8'
    );
    log.success('package.json mis à jour !');
  } catch (error) {
    log.error(`Erreur lors de l'écriture de package.json: ${error.message}`);
    process.exit(1);
  }

  // ====================================================================
  // NEXT STEPS
  // ====================================================================

  console.log('');
  log.title('PROCHAINES ÉTAPES');
  console.log('');
  console.log('1️⃣  Supprimer les dépendances de node_modules:');
  console.log('');
  console.log('    npm install');
  console.log('');
  console.log('2️⃣  Vérifier que tout fonctionne:');
  console.log('');
  console.log('    npm run dev');
  console.log('    npm run build');
  console.log('    npm run test');
  console.log('');
  console.log('3️⃣  Supprimer les fichiers Storybook (si présents):');
  console.log('');
  console.log('    rm -rf .storybook');
  console.log('    rm -f storybook-static');
  console.log('');

  log.success('Nettoyage terminé avec succès ! 🎉');
}

// ====================================================================
// RUN
// ====================================================================

const args = process.argv.slice(2);
const apply = args.includes('--apply') || args.includes('-a');

cleanDependencies(apply);
