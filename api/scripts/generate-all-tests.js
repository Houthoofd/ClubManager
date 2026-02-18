#!/usr/bin/env node

/**
 * 🧪 Générateur de Tests pour toutes les Routes - ClubManager API
 *
 * Ce script génère les tests manquants pour toutes les routes existantes
 * dans src/routes/
 *
 * Usage:
 *   node scripts/generate-all-tests.js [options]
 *
 * Options:
 *   --overwrite            Écrase les tests existants
 *   --test-type <type>     Type de test à générer (unit, integration, security, advanced, e2e, all)
 *   --domain <name>        Ne générer que pour un domaine spécifique
 *   --dry-run              Affiche ce qui serait généré sans créer les fichiers
 *   --skip-existing        Ne génère pas les tests pour les routes qui ont déjà des tests
 *
 * Exemples:
 *   node scripts/generate-all-tests.js
 *   node scripts/generate-all-tests.js --test-type unit
 *   node scripts/generate-all-tests.js --domain utilisateurs --overwrite
 *   node scripts/generate-all-tests.js --dry-run
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  banner,
  section,
  subsection,
  success,
  error,
  info,
  warning,
  summary,
  progress,
} from "./utils/logger.js";
import { generateTests, TEST_TYPES } from "./generators/test-generator.js";
import { resolveRoutesPath } from "./utils/file-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_OPTIONS = {
  overwrite: false,
  testTypes: [TEST_TYPES.ALL],
  domain: null,
  dryRun: false,
  skipExisting: false,
};

// Routes à ignorer (non GraphQL ou spéciales)
const IGNORED_ROUTES = [
  "health",      // Route de santé, pas besoin de tests complets
  "email",       // Utilitaire interne
  "verification", // Partie de auth
];

// ============================================================================
// PARSING DES ARGUMENTS
// ============================================================================

/**
 * Parse les arguments de ligne de commande
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = { ...DEFAULT_OPTIONS };

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  // Parse les flags
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--overwrite":
        options.overwrite = true;
        break;
      case "--test-type":
        if (i + 1 < args.length) {
          const testType = args[++i].toLowerCase();
          if (Object.values(TEST_TYPES).includes(testType)) {
            options.testTypes = [testType];
          } else {
            error(`Type de test invalide: ${testType}`);
          }
        }
        break;
      case "--domain":
        if (i + 1 < args.length) {
          options.domain = args[++i];
        }
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--skip-existing":
        options.skipExisting = true;
        break;
      default:
        if (arg.startsWith("--")) {
          warning(`Option inconnue: ${arg}`);
        }
    }
  }

  return options;
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Liste toutes les routes disponibles
 */
function listAllRoutes() {
  const routesPath = resolveRoutesPath();

  try {
    const items = fs.readdirSync(routesPath);
    return items.filter((item) => {
      const fullPath = path.join(routesPath, item);
      const stat = fs.statSync(fullPath);
      // Exclure les fichiers et les dossiers commençant par . ou _
      return (
        stat.isDirectory() &&
        !item.startsWith(".") &&
        !item.startsWith("_") &&
        !IGNORED_ROUTES.includes(item)
      );
    });
  } catch (err) {
    error(`Erreur lors de la lecture des routes: ${err.message}`);
    return [];
  }
}

/**
 * Vérifie si une route a déjà des tests
 */
function hasTests(domainName) {
  const testsPath = path.join(resolveRoutesPath(domainName), "__tests__");
  return fs.existsSync(testsPath);
}

/**
 * Fusionne deux objets de statistiques
 */
function mergeStats(target, source) {
  target.created += source.created || 0;
  target.updated += source.updated || 0;
  target.skipped += source.skipped || 0;
  target.errors += source.errors || 0;
}

// ============================================================================
// GÉNÉRATION
// ============================================================================

/**
 * Génère les tests pour toutes les routes
 */
async function generateAllTests(options) {
  const totalStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  // Liste des routes à traiter
  let routes = [];
  if (options.domain) {
    // Un seul domaine spécifié
    routes = [options.domain];
  } else {
    // Tous les domaines
    routes = listAllRoutes();
  }

  if (routes.length === 0) {
    warning("Aucune route trouvée");
    return totalStats;
  }

  info(`${routes.length} route(s) à traiter`);
  console.log("");

  // Statistiques par route
  const routeResults = [];

  // Générer les tests pour chaque route
  for (let i = 0; i < routes.length; i++) {
    const domainName = routes[i];

    // Vérifier si la route existe
    const routePath = resolveRoutesPath(domainName);
    if (!fs.existsSync(routePath)) {
      warning(`Route "${domainName}" non trouvée, ignorée`);
      continue;
    }

    // Vérifier si on doit ignorer les routes avec tests existants
    if (options.skipExisting && hasTests(domainName)) {
      info(`Route "${domainName}" a déjà des tests, ignorée`);
      routeResults.push({
        domain: domainName,
        status: "skipped",
        reason: "Tests existants",
      });
      continue;
    }

    // Afficher la progression
    progress(i + 1, routes.length, `Génération pour ${domainName}`);

    subsection(`Génération des tests pour ${domainName}`);

    try {
      const stats = await generateTests(domainName, {
        dryRun: options.dryRun,
        overwrite: options.overwrite,
        testTypes: options.testTypes,
      });

      mergeStats(totalStats, stats);

      if (stats.errors > 0) {
        routeResults.push({
          domain: domainName,
          status: "error",
          stats,
        });
        warning(`Erreurs lors de la génération pour ${domainName}`);
      } else {
        routeResults.push({
          domain: domainName,
          status: "success",
          stats,
        });
        success(`Tests générés pour ${domainName}`);
      }
    } catch (err) {
      error(`Erreur pour ${domainName}: ${err.message}`);
      totalStats.errors++;
      routeResults.push({
        domain: domainName,
        status: "error",
        error: err.message,
      });
    }

    console.log("");
  }

  return { totalStats, routeResults };
}

// ============================================================================
// AFFICHAGE
// ============================================================================

/**
 * Affiche l'aide
 */
function showHelp() {
  banner(
    "🧪 Générateur de Tests pour toutes les Routes",
    "ClubManager API - Génération en masse",
  );

  info("Usage:");
  console.log("  node scripts/generate-all-tests.js [options]\n");

  info("Options:");
  console.log("  --overwrite           Écrase les tests existants");
  console.log("  --test-type <type>    Type de test (unit, integration, security, advanced, e2e, all)");
  console.log("  --domain <name>       Ne générer que pour un domaine spécifique");
  console.log("  --dry-run             Affiche ce qui serait généré");
  console.log("  --skip-existing       Ignore les routes ayant déjà des tests");
  console.log("");

  info("Exemples:");
  console.log("  node scripts/generate-all-tests.js");
  console.log("  node scripts/generate-all-tests.js --test-type unit");
  console.log("  node scripts/generate-all-tests.js --domain utilisateurs --overwrite");
  console.log("  node scripts/generate-all-tests.js --dry-run");
  console.log("  node scripts/generate-all-tests.js --skip-existing");
  console.log("");
}

/**
 * Affiche le résumé détaillé
 */
function displayDetailedSummary(routeResults) {
  section("Résumé détaillé par route");

  const successful = routeResults.filter((r) => r.status === "success");
  const withErrors = routeResults.filter((r) => r.status === "error");
  const skipped = routeResults.filter((r) => r.status === "skipped");

  if (successful.length > 0) {
    console.log("");
    success(`${successful.length} route(s) traitée(s) avec succès:`);
    successful.forEach((r) => {
      const { created = 0, updated = 0 } = r.stats || {};
      console.log(
        `  ✓ ${r.domain.padEnd(20)} (${created} créés, ${updated} mis à jour)`,
      );
    });
  }

  if (withErrors.length > 0) {
    console.log("");
    error(`${withErrors.length} route(s) avec erreurs:`);
    withErrors.forEach((r) => {
      console.log(`  ✗ ${r.domain.padEnd(20)} ${r.error || ""}`);
    });
  }

  if (skipped.length > 0) {
    console.log("");
    info(`${skipped.length} route(s) ignorée(s):`);
    skipped.forEach((r) => {
      console.log(`  ⊘ ${r.domain.padEnd(20)} (${r.reason})`);
    });
  }

  console.log("");
}

/**
 * Affiche les prochaines étapes
 */
function displayNextSteps() {
  section("Prochaines étapes");

  console.log("  1. Vérifiez les tests générés dans chaque route:");
  console.log("     src/routes/{domaine}/__tests__/");
  console.log("");
  console.log("  2. Personnalisez les tests selon vos besoins métier");
  console.log("");
  console.log("  3. Lancez les tests pour vérifier:");
  console.log("     npm run test:all");
  console.log("");
  console.log("  4. Ajoutez les scripts npm manquants dans package.json");
  console.log("");
}

// ============================================================================
// MAIN
// ============================================================================

/**
 * Fonction principale
 */
async function main() {
  // Afficher le banner
  banner(
    "🧪 Générateur de Tests pour toutes les Routes",
    "ClubManager API - Génération automatique en masse",
  );

  // Parser les arguments
  const options = parseArguments();

  if (options.dryRun) {
    info("Mode DRY-RUN activé - Aucun fichier ne sera créé");
    console.log("");
  }

  if (options.overwrite) {
    warning("Mode OVERWRITE activé - Les fichiers existants seront écrasés");
    console.log("");
  }

  // Configuration
  section("Configuration");
  if (options.domain) {
    info(`Domaine ciblé: ${options.domain}`);
  } else {
    info("Mode: Tous les domaines");
  }

  if (options.testTypes.includes(TEST_TYPES.ALL)) {
    info("Types de tests: Tous");
  } else {
    info(`Types de tests: ${options.testTypes.join(", ")}`);
  }

  if (options.skipExisting) {
    info("Ignore les routes avec tests existants");
  }
  console.log("");

  // Générer les tests
  section("Génération des tests");
  const { totalStats, routeResults } = await generateAllTests(options);

  // Afficher le résumé global
  summary(totalStats);

  // Afficher le résumé détaillé
  displayDetailedSummary(routeResults);

  // Afficher les prochaines étapes
  if (!options.dryRun && totalStats.created > 0) {
    displayNextSteps();
    success("Génération terminée avec succès ! 🎉");
  } else if (totalStats.errors > 0) {
    error("La génération s'est terminée avec des erreurs");
    process.exit(1);
  } else if (options.dryRun) {
    info("Mode dry-run - Aucun fichier n'a été créé");
  }
}

// Exécuter le script
main().catch((err) => {
  error(`Erreur fatale: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
