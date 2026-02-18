#!/usr/bin/env node

/**
 * 🔄 Sync Routes from Types - ClubManager API
 *
 * Ce script analyse les domaines dans @clubmanager/types et génère
 * les routes GraphQL correspondantes dans l'API si elles n'existent pas.
 *
 * Mapping entre domaines types et routes API :
 * - users         → utilisateurs (existant)
 * - activities    → cours (existant)
 * - sessions      → cours (même domaine)
 * - memberships   → inscription (existant)
 * - shop          → magasin (existant)
 * - communications → messages/alertes (existants)
 * - events        → evenements (à créer)
 * - documents     → documents (à créer)
 * - gdpr          → gdpr (à créer)
 * - settings      → parametres (à créer)
 * - statistics    → statistiques (existant)
 * - audit         → audit (à créer)
 *
 * Usage:
 *   node scripts/sync-routes-from-types.js [options]
 *
 * Options:
 *   --create-missing       Crée les routes manquantes
 *   --generate-tests       Génère les tests pour les routes existantes
 *   --dry-run              Affiche ce qui serait fait sans créer les fichiers
 *   --force                Force la création même si la route existe
 *
 * Exemples:
 *   node scripts/sync-routes-from-types.js --dry-run
 *   node scripts/sync-routes-from-types.js --create-missing
 *   node scripts/sync-routes-from-types.js --generate-tests
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
} from "./utils/logger.js";
import { generateRoute } from "./generators/route-generator.js";
import { generateTests } from "./generators/test-generator.js";
import { resolveProjectPath, resolveRoutesPath } from "./utils/file-utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Mapping entre les domaines de @clubmanager/types et les routes API
 */
const DOMAIN_MAPPING = {
  users: {
    routeName: "users",
    status: "missing",
    description: "Gestion des utilisateurs",
  },
  activities: {
    routeName: "activities",
    status: "missing",
    description: "Gestion des activités et cours",
  },
  sessions: {
    routeName: "activities",
    status: "exists",
    description: "Sessions de cours (même domaine que activities)",
    skip: true, // Fusionné avec activities
  },
  memberships: {
    routeName: "memberships",
    status: "missing",
    description: "Gestion des inscriptions et adhésions",
  },
  shop: {
    routeName: "shop",
    status: "missing",
    description: "Boutique et commandes",
  },
  communications: {
    routeName: "communications",
    status: "missing",
    description: "Communications et messages",
  },
  events: {
    routeName: "events",
    status: "missing",
    description: "Gestion des événements",
  },
  documents: {
    routeName: "documents",
    status: "exists",
    description: "Gestion des documents",
  },
  gdpr: {
    routeName: "gdpr",
    status: "exists",
    description: "Conformité RGPD",
  },
  settings: {
    routeName: "settings",
    status: "missing",
    description: "Paramètres et configuration",
  },
  statistics: {
    routeName: "statistics",
    status: "missing",
    description: "Statistiques et rapports",
  },
  audit: {
    routeName: "audit",
    status: "exists",
    description: "Logs et audit",
  },
};

const DEFAULT_OPTIONS = {
  createMissing: false,
  generateTests: false,
  dryRun: false,
  force: false,
};

// ============================================================================
// PARSING DES ARGUMENTS
// ============================================================================

function parseArguments() {
  const args = process.argv.slice(2);
  const options = { ...DEFAULT_OPTIONS };

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  for (const arg of args) {
    switch (arg) {
      case "--create-missing":
        options.createMissing = true;
        break;
      case "--generate-tests":
        options.generateTests = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--force":
        options.force = true;
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
 * Vérifie si une route existe
 */
function routeExists(routeName) {
  const routePath = resolveRoutesPath(routeName);
  return fs.existsSync(routePath);
}

/**
 * Lit les domaines disponibles dans @clubmanager/types
 */
function readTypeDomains() {
  const typesDomainsPath = resolveProjectPath(
    "..",
    "packages",
    "types",
    "src",
    "domains",
  );

  try {
    if (!fs.existsSync(typesDomainsPath)) {
      warning("Le dossier packages/types/src/domains n'existe pas");
      return [];
    }

    const items = fs.readdirSync(typesDomainsPath);
    return items.filter((item) => {
      const fullPath = path.join(typesDomainsPath, item);
      const stat = fs.statSync(fullPath);
      return (
        stat.isDirectory() &&
        !item.startsWith(".") &&
        !item.startsWith("_") &&
        item !== "__tests__"
      );
    });
  } catch (err) {
    error(`Erreur lors de la lecture des domaines: ${err.message}`);
    return [];
  }
}

/**
 * Analyse l'état actuel
 */
function analyzeCurrentState() {
  const typeDomains = readTypeDomains();
  const analysis = {
    total: 0,
    existing: 0,
    missing: 0,
    skipped: 0,
    unknown: 0,
    routes: [],
  };

  for (const domain of typeDomains) {
    const mapping = DOMAIN_MAPPING[domain];

    if (!mapping) {
      analysis.unknown++;
      analysis.routes.push({
        typeDomain: domain,
        routeName: null,
        status: "unknown",
        exists: false,
      });
      continue;
    }

    if (mapping.skip) {
      analysis.skipped++;
      analysis.routes.push({
        typeDomain: domain,
        routeName: mapping.routeName,
        status: "skipped",
        exists: routeExists(mapping.routeName),
        description: mapping.description,
      });
      continue;
    }

    analysis.total++;
    const exists = routeExists(mapping.routeName);

    if (exists) {
      analysis.existing++;
      analysis.routes.push({
        typeDomain: domain,
        routeName: mapping.routeName,
        status: "exists",
        exists: true,
        description: mapping.description,
      });
    } else {
      analysis.missing++;
      analysis.routes.push({
        typeDomain: domain,
        routeName: mapping.routeName,
        status: "missing",
        exists: false,
        description: mapping.description,
      });
    }
  }

  return analysis;
}

// ============================================================================
// GÉNÉRATION
// ============================================================================

/**
 * Crée les routes manquantes
 */
async function createMissingRoutes(analysis, options) {
  const missingRoutes = analysis.routes.filter((r) => r.status === "missing");

  if (missingRoutes.length === 0) {
    success("Aucune route manquante à créer");
    return { created: 0, errors: 0 };
  }

  info(`${missingRoutes.length} route(s) à créer`);
  console.log("");

  const stats = { created: 0, errors: 0 };

  for (const route of missingRoutes) {
    subsection(`Création de la route ${route.routeName}`);
    info(`Domaine type: ${route.typeDomain}`);
    info(`Description: ${route.description}`);

    try {
      if (!options.dryRun) {
        const routeStats = await generateRoute(route.routeName, {
          dryRun: false,
          overwrite: options.force,
          withHandlers: false,
          withTypes: true,
          skipService: false,
        });

        if (routeStats.errors > 0) {
          warning(`Erreurs lors de la création de ${route.routeName}`);
          stats.errors++;
        } else {
          success(`Route ${route.routeName} créée avec succès`);
          stats.created++;
        }
      } else {
        info(`[DRY-RUN] Route ${route.routeName} serait créée`);
        stats.created++;
      }
    } catch (err) {
      error(`Erreur pour ${route.routeName}: ${err.message}`);
      stats.errors++;
    }

    console.log("");
  }

  return stats;
}

/**
 * Génère les tests pour les routes existantes
 */
async function generateTestsForExisting(analysis, options) {
  const existingRoutes = analysis.routes.filter((r) => r.status === "exists");

  if (existingRoutes.length === 0) {
    warning("Aucune route existante trouvée");
    return { generated: 0, errors: 0 };
  }

  info(`${existingRoutes.length} route(s) existante(s)`);
  console.log("");

  const stats = { generated: 0, errors: 0 };

  for (const route of existingRoutes) {
    subsection(`Génération des tests pour ${route.routeName}`);

    try {
      if (!options.dryRun) {
        const testStats = await generateTests(route.routeName, {
          dryRun: false,
          overwrite: false,
          testTypes: ["all"],
        });

        if (testStats.errors > 0) {
          warning(
            `Erreurs lors de la génération des tests pour ${route.routeName}`,
          );
          stats.errors++;
        } else if (testStats.created > 0) {
          success(
            `Tests générés pour ${route.routeName} (${testStats.created} fichiers)`,
          );
          stats.generated++;
        } else {
          info(`Aucun nouveau test pour ${route.routeName} (déjà présents)`);
        }
      } else {
        info(`[DRY-RUN] Tests pour ${route.routeName} seraient générés`);
        stats.generated++;
      }
    } catch (err) {
      error(`Erreur pour ${route.routeName}: ${err.message}`);
      stats.errors++;
    }

    console.log("");
  }

  return stats;
}

// ============================================================================
// AFFICHAGE
// ============================================================================

function showHelp() {
  banner(
    "🔄 Sync Routes from Types",
    "Synchronise les routes API avec les domaines @clubmanager/types",
  );

  info("Usage:");
  console.log("  node scripts/sync-routes-from-types.js [options]\n");

  info("Options:");
  console.log("  --create-missing    Crée les routes manquantes");
  console.log(
    "  --generate-tests    Génère les tests pour les routes existantes",
  );
  console.log("  --dry-run           Affiche ce qui serait fait");
  console.log("  --force             Force la création même si existe");
  console.log("");

  info("Exemples:");
  console.log("  node scripts/sync-routes-from-types.js --dry-run");
  console.log("  node scripts/sync-routes-from-types.js --create-missing");
  console.log("  node scripts/sync-routes-from-types.js --generate-tests");
  console.log(
    "  node scripts/sync-routes-from-types.js --create-missing --generate-tests",
  );
  console.log("");
}

function displayAnalysis(analysis) {
  section("Analyse des domaines");

  console.log(
    `  Total domaines types:     ${analysis.total + analysis.skipped + analysis.unknown}`,
  );
  console.log(`  Routes existantes:        ${analysis.existing}`);
  console.log(`  Routes manquantes:        ${analysis.missing}`);
  console.log(`  Domaines fusionnés:       ${analysis.skipped}`);
  console.log(`  Domaines non mappés:      ${analysis.unknown}`);
  console.log("");

  if (analysis.existing > 0) {
    subsection("Routes existantes");
    analysis.routes
      .filter((r) => r.status === "exists")
      .forEach((r) => {
        console.log(
          `  ✓ ${r.typeDomain.padEnd(20)} → ${r.routeName.padEnd(20)} ${r.description}`,
        );
      });
    console.log("");
  }

  if (analysis.missing > 0) {
    subsection("Routes manquantes");
    analysis.routes
      .filter((r) => r.status === "missing")
      .forEach((r) => {
        console.log(
          `  ✗ ${r.typeDomain.padEnd(20)} → ${r.routeName.padEnd(20)} ${r.description}`,
        );
      });
    console.log("");
  }

  if (analysis.skipped > 0) {
    subsection("Domaines fusionnés");
    analysis.routes
      .filter((r) => r.status === "skipped")
      .forEach((r) => {
        console.log(
          `  ⊘ ${r.typeDomain.padEnd(20)} → ${r.routeName.padEnd(20)} ${r.description}`,
        );
      });
    console.log("");
  }

  if (analysis.unknown > 0) {
    subsection("Domaines non mappés");
    analysis.routes
      .filter((r) => r.status === "unknown")
      .forEach((r) => {
        console.log(`  ? ${r.typeDomain.padEnd(20)} (mapping à définir)`);
      });
    console.log("");
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  banner(
    "🔄 Sync Routes from Types",
    "Synchronisation routes API ↔ domaines @clubmanager/types",
  );

  const options = parseArguments();

  if (options.dryRun) {
    info("Mode DRY-RUN activé - Aucun fichier ne sera créé");
    console.log("");
  }

  // Analyser l'état actuel
  const analysis = analyzeCurrentState();
  displayAnalysis(analysis);

  // Actions
  if (options.createMissing) {
    section("Création des routes manquantes");
    const createStats = await createMissingRoutes(analysis, options);
    summary({
      created: createStats.created,
      errors: createStats.errors,
      updated: 0,
      skipped: 0,
    });
  }

  if (options.generateTests) {
    section("Génération des tests");
    const testStats = await generateTestsForExisting(analysis, options);
    console.log(`  Tests générés pour ${testStats.generated} route(s)`);
    if (testStats.errors > 0) {
      console.log(`  Erreurs: ${testStats.errors}`);
    }
    console.log("");
  }

  if (!options.createMissing && !options.generateTests) {
    section("Recommandations");
    if (analysis.missing > 0) {
      info("Utilisez --create-missing pour créer les routes manquantes");
    }
    if (analysis.existing > 0) {
      info("Utilisez --generate-tests pour générer les tests");
    }
    if (analysis.unknown > 0) {
      warning(
        "Certains domaines ne sont pas mappés - Mise à jour du mapping nécessaire",
      );
    }
    console.log("");
  }

  success("Synchronisation terminée ! 🎉");
}

main().catch((err) => {
  error(`Erreur fatale: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
