#!/usr/bin/env node

/**
 * 🚀 Générateur de Routes GraphQL - ClubManager API
 *
 * Script principal pour générer automatiquement la structure complète
 * d'une route GraphQL avec tous les tests associés.
 *
 * Usage:
 *   node scripts/generate-graphql-route.js <nom-domaine> [options]
 *
 * Options:
 *   --with-handlers        Génère le fichier handlers.ts
 *   --with-types           Génère le fichier types.ts personnalisé
 *   --skip-service         Ne génère pas le service (utilise un existant)
 *   --skip-tests           Ne génère pas les tests
 *   --tests-only           Génère uniquement les tests (route doit exister)
 *   --test-type <type>     Type de test à générer (unit, integration, security, advanced, e2e, all)
 *   --overwrite            Écrase les fichiers existants
 *   --dry-run              Affiche ce qui serait généré sans créer les fichiers
 *
 * Exemples:
 *   node scripts/generate-graphql-route.js evenements
 *   node scripts/generate-graphql-route.js stock --with-handlers --with-types
 *   node scripts/generate-graphql-route.js notifications --tests-only --test-type unit
 *   node scripts/generate-graphql-route.js paiements --overwrite
 */

import { fileURLToPath } from "url";
import path from "path";
import {
  banner,
  section,
  success,
  error,
  info,
  warning,
  summary,
  options as displayOptions,
  examples,
} from "./utils/logger.js";
import { cleanDomainName, isValidDomainName } from "./utils/string-utils.js";
import { generateRoute, routeExists } from "./generators/route-generator.js";
import { generateTests, TEST_TYPES } from "./generators/test-generator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_OPTIONS = {
  withHandlers: false,
  withTypes: false,
  skipService: false,
  skipTests: false,
  testsOnly: false,
  testTypes: [TEST_TYPES.ALL],
  overwrite: false,
  dryRun: false,
};

// ============================================================================
// PARSING DES ARGUMENTS
// ============================================================================

/**
 * Parse les arguments de ligne de commande
 */
function parseArguments() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  const domainName = args[0];
  const options = { ...DEFAULT_OPTIONS };

  // Parse les flags
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--with-handlers":
        options.withHandlers = true;
        break;
      case "--with-types":
        options.withTypes = true;
        break;
      case "--skip-service":
        options.skipService = true;
        break;
      case "--skip-tests":
        options.skipTests = true;
        break;
      case "--tests-only":
        options.testsOnly = true;
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
      case "--overwrite":
        options.overwrite = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      default:
        if (arg.startsWith("--")) {
          warning(`Option inconnue: ${arg}`);
        }
    }
  }

  return { domainName, options };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valide le nom de domaine
 */
function validateDomainName(domainName) {
  const cleaned = cleanDomainName(domainName);

  if (!isValidDomainName(cleaned)) {
    error(
      `Nom de domaine invalide: "${domainName}"\n` +
        `Le nom doit commencer par une lettre et ne contenir que des lettres minuscules, chiffres, tirets ou underscores.`,
    );
  }

  return cleaned;
}

/**
 * Valide les options
 */
function validateOptions(domainName, options) {
  if (options.testsOnly) {
    if (!routeExists(domainName)) {
      error(
        `Impossible de générer uniquement les tests: la route "${domainName}" n'existe pas.\n` +
          `Générez d'abord la route ou retirez l'option --tests-only.`,
      );
    }
  }

  if (options.skipTests && options.testsOnly) {
    error("Les options --skip-tests et --tests-only sont incompatibles.");
  }

  if (options.dryRun) {
    info("Mode DRY-RUN activé - Aucun fichier ne sera créé");
  }

  if (options.overwrite) {
    warning("Mode OVERWRITE activé - Les fichiers existants seront écrasés");
  }
}

// ============================================================================
// GÉNÉRATION
// ============================================================================

/**
 * Génère la route complète
 */
async function generateCompleteRoute(domainName, options) {
  const totalStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Génération de la structure de route
    if (!options.testsOnly) {
      section("Génération de la structure de route");

      const routeStats = await generateRoute(domainName, {
        dryRun: options.dryRun,
        overwrite: options.overwrite,
        withHandlers: options.withHandlers,
        withTypes: options.withTypes,
        skipService: options.skipService,
      });

      mergeStats(totalStats, routeStats);

      if (routeStats.errors > 0) {
        error("Erreurs lors de la génération de la route");
        return totalStats;
      }

      success("Structure de route générée avec succès");
    }

    // Génération des tests
    if (!options.skipTests) {
      section("Génération des tests");

      const testStats = await generateTests(domainName, {
        dryRun: options.dryRun,
        overwrite: options.overwrite,
        testTypes: options.testTypes,
      });

      mergeStats(totalStats, testStats);

      if (testStats.errors > 0) {
        warning("Certains tests n'ont pas pu être générés");
      } else {
        success("Tests générés avec succès");
      }
    }

    return totalStats;
  } catch (err) {
    error(`Erreur lors de la génération: ${err.message}`);
    totalStats.errors++;
    return totalStats;
  }
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
// AFFICHAGE
// ============================================================================

/**
 * Affiche l'aide
 */
function showHelp() {
  banner(
    "🚀 Générateur de Routes GraphQL - ClubManager API",
    "Génération automatique de routes avec tests complets",
  );

  info("Usage:");
  console.log(
    "  node scripts/generate-graphql-route.js <nom-domaine> [options]\n",
  );

  displayOptions([
    {
      flag: "--with-handlers",
      description: "Génère le fichier handlers.ts",
      enabled: false,
    },
    {
      flag: "--with-types",
      description: "Génère le fichier types.ts personnalisé",
      enabled: false,
    },
    {
      flag: "--skip-service",
      description: "Ne génère pas le service",
      enabled: false,
    },
    {
      flag: "--skip-tests",
      description: "Ne génère pas les tests",
      enabled: false,
    },
    {
      flag: "--tests-only",
      description: "Génère uniquement les tests",
      enabled: false,
    },
    {
      flag: "--test-type <type>",
      description:
        "Type de test (unit, integration, security, advanced, e2e, all)",
      enabled: false,
    },
    {
      flag: "--overwrite",
      description: "Écrase les fichiers existants",
      enabled: false,
    },
    {
      flag: "--dry-run",
      description: "Affiche ce qui serait généré",
      enabled: false,
    },
  ]);

  examples([
    {
      description: "Générer une route complète avec tous les tests",
      command: "node scripts/generate-graphql-route.js evenements",
    },
    {
      description: "Générer avec handlers et types personnalisés",
      command:
        "node scripts/generate-graphql-route.js stock --with-handlers --with-types",
    },
    {
      description: "Générer uniquement les tests unitaires",
      command:
        "node scripts/generate-graphql-route.js notifications --tests-only --test-type unit",
    },
    {
      description: "Générer sans les tests",
      command: "node scripts/generate-graphql-route.js paiements --skip-tests",
    },
    {
      description: "Mode dry-run pour voir ce qui serait créé",
      command: "node scripts/generate-graphql-route.js abonnements --dry-run",
    },
  ]);
}

/**
 * Affiche le résumé des options
 */
function displayOptionsUsed(domainName, options) {
  section("Configuration");

  info(`Domaine: ${domainName}`);
  console.log("");

  if (options.testsOnly) {
    info("Mode: Génération des tests uniquement");
  } else {
    info("Mode: Génération complète (route + tests)");
  }

  if (options.withHandlers) {
    info("✓ Génération des handlers");
  }

  if (options.withTypes) {
    info("✓ Génération des types personnalisés");
  }

  if (options.skipService) {
    warning("⊗ Service non généré");
  }

  if (options.skipTests) {
    warning("⊗ Tests non générés");
  } else if (options.testTypes.includes(TEST_TYPES.ALL)) {
    info("✓ Tous les types de tests");
  } else {
    info(`✓ Tests: ${options.testTypes.join(", ")}`);
  }

  console.log("");
}

/**
 * Affiche les prochaines étapes
 */
function displayNextSteps(domainName, options) {
  section("Prochaines étapes");

  console.log(
    "  1. Examinez les fichiers générés et personnalisez-les selon vos besoins",
  );
  console.log("  2. Ajoutez les types dans @clubmanager/types si nécessaire");
  console.log(
    "  3. Mettez à jour le schéma GraphQL principal (src/graphql/schema.ts)",
  );
  console.log("  4. Adaptez les permissions dans auth.middleware.ts");
  console.log("  5. Lancez les tests:");
  console.log(`     npm run test:${domainName}`);
  console.log("");

  if (!options.skipTests && !options.testsOnly) {
    info("💡 Astuce: Ajoutez les scripts de test dans package.json:");
    console.log("");
    console.log(
      `  "test:${domainName}": "jest --testPathPattern=${domainName}",`,
    );
    console.log(
      `  "test:${domainName}:watch": "jest --testPathPattern=${domainName} --watch",`,
    );
    console.log(
      `  "test:${domainName}:coverage": "jest --testPathPattern=${domainName} --coverage",`,
    );
    console.log("");
  }
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
    "🚀 Générateur de Routes GraphQL",
    "ClubManager API - Architecture moderne",
  );

  // Parser les arguments
  const { domainName, options } = parseArguments();

  // Valider et nettoyer le nom de domaine
  const cleanedDomainName = validateDomainName(domainName);

  // Valider les options
  validateOptions(cleanedDomainName, options);

  // Afficher la configuration
  displayOptionsUsed(cleanedDomainName, options);

  // Générer la route
  const stats = await generateCompleteRoute(cleanedDomainName, options);

  // Afficher le résumé
  summary(stats);

  // Afficher les prochaines étapes
  if (!options.dryRun && stats.errors === 0) {
    displayNextSteps(cleanedDomainName, options);
    success("Génération terminée avec succès ! 🎉");
  } else if (stats.errors > 0) {
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
