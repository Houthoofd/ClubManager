#!/usr/bin/env node

/**
 * ====================================================================
 * PATTERNFLY ICONS MIGRATION SCRIPT
 * ====================================================================
 *
 * Ce script remplace automatiquement les imports d'icônes PatternFly
 * pour utiliser le barrel export centralisé optimisé.
 *
 * Usage:
 *   node scripts/migrate-icons.js
 *   npm run migrate:icons
 *
 * Options:
 *   --dry-run    Affiche les changements sans les appliquer
 *   --verbose    Affiche plus de détails
 *
 * ====================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_DIR = path.join(__dirname, "..", "src");
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

// Couleurs pour la console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

// Statistiques
const stats = {
  totalFiles: 0,
  filesWithImports: 0,
  filesMigrated: 0,
  errors: 0,
};

/**
 * Récupère tous les fichiers TS/TSX récursivement
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorer certains dossiers
      if (!["node_modules", "dist", "build", ".git"].includes(file)) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else if (file.match(/\.(ts|tsx)$/)) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Vérifie si un fichier contient des imports PatternFly icons
 */
function hasPatternFlyIconImport(content) {
  return /@patternfly\/react-icons/.test(content);
}

/**
 * Migre les imports dans le contenu du fichier
 */
function migrateImports(content) {
  // Pattern pour matcher les imports PatternFly icons
  // Gère les formats:
  // - import { Icon } from '@patternfly/react-icons';
  // - import { Icon1, Icon2 } from '@patternfly/react-icons';
  // - import { Icon } from "@patternfly/react-icons";

  const pattern = /from\s+['"]@patternfly\/react-icons['"]/g;
  const newContent = content.replace(pattern, "from '@/shared/icons'");

  return newContent;
}

/**
 * Traite un fichier
 */
function processFile(filePath) {
  stats.totalFiles++;

  try {
    const content = fs.readFileSync(filePath, "utf8");

    if (!hasPatternFlyIconImport(content)) {
      if (VERBOSE) {
        console.log(
          `${colors.cyan}⏭️  Ignoré (pas d'import): ${path.relative(SRC_DIR, filePath)}${colors.reset}`,
        );
      }
      return;
    }

    stats.filesWithImports++;

    const newContent = migrateImports(content);

    // Vérifier si le contenu a changé
    if (content === newContent) {
      console.log(
        `${colors.yellow}⚠️  Aucun changement: ${path.relative(SRC_DIR, filePath)}${colors.reset}`,
      );
      return;
    }

    console.log(`${colors.blue}📝 Migration: ${path.relative(SRC_DIR, filePath)}${colors.reset}`);

    if (DRY_RUN) {
      console.log(
        `${colors.cyan}   [DRY RUN] Changements détectés mais non appliqués${colors.reset}`,
      );

      // Afficher un aperçu des changements
      const oldLines = content
        .split("\n")
        .filter((line) => line.includes("@patternfly/react-icons"));
      const newLines = newContent.split("\n").filter((line) => line.includes("@/shared/icons"));

      if (VERBOSE && oldLines.length > 0) {
        console.log(`${colors.red}   - ${oldLines[0].trim()}${colors.reset}`);
        console.log(`${colors.green}   + ${newLines[0].trim()}${colors.reset}`);
      }
    } else {
      // Écrire le fichier migré
      fs.writeFileSync(filePath, newContent, "utf8");
      console.log(`${colors.green}   ✅ Migré avec succès${colors.reset}`);
    }

    stats.filesMigrated++;
  } catch (error) {
    stats.errors++;
    console.error(`${colors.red}❌ Erreur lors du traitement de ${filePath}:${colors.reset}`);
    console.error(`   ${error.message}`);
  }
}

/**
 * Point d'entrée principal
 */
function main() {
  console.log(`${colors.cyan}
====================================================================
🎨 MIGRATION DES IMPORTS PATTERNFLY ICONS
====================================================================
${colors.reset}`);

  if (DRY_RUN) {
    console.log(
      `${colors.yellow}⚠️  MODE DRY RUN - Aucune modification ne sera appliquée${colors.reset}\n`,
    );
  }

  console.log(`📂 Analyse du dossier: ${SRC_DIR}\n`);

  // Récupérer tous les fichiers
  const files = getAllFiles(SRC_DIR);
  console.log(`📄 ${files.length} fichiers TypeScript/React trouvés\n`);

  // Traiter chaque fichier
  files.forEach(processFile);

  // Afficher les statistiques
  console.log(`
${colors.cyan}======================================================================
✅ MIGRATION TERMINÉE !
======================================================================${colors.reset}

📊 Statistiques:
   - Fichiers analysés:                ${stats.totalFiles}
   - Fichiers avec imports PatternFly:  ${stats.filesWithImports}
   - Fichiers migrés:                   ${stats.filesMigrated}
   - Erreurs:                           ${stats.errors}

${
  stats.filesMigrated > 0
    ? `${colors.green}💡 Prochaines étapes:${colors.reset}
   1. ${DRY_RUN ? "Relancer sans --dry-run pour appliquer les changements" : "Vérifier les changements: git diff"}
   2. Tester l'application: npm run dev
   3. Vérifier les tests: npm run test
   4. Analyser le bundle: npm run analyze

🎯 Gain estimé: -50 à -100KB sur le bundle initial
`
    : ""
}${colors.cyan}======================================================================${colors.reset}
`);

  // Code de sortie
  process.exit(stats.errors > 0 ? 1 : 0);
}

// Lancer le script
main();
