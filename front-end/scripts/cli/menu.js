#!/usr/bin/env node

/**
 * ClubManager Frontend Scripts Launcher
 *
 * Interactive menu to launch various development scripts
 */

import readline from "readline";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const colorize = (text, color) => `${colors[color]}${text}${colors.reset}`;

// Available scripts
const scripts = {
  1: {
    name: "Générateur de tests - Aperçu (dry-run)",
    command: "node",
    args: ["scripts/generators/tests/index.js", "--all", "--dry-run"],
    description: "Prévisualise les tests qui seront générés sans les écrire",
  },
  2: {
    name: "Générateur de tests - Tous les tests",
    command: "node",
    args: ["scripts/generators/tests/index.js", "--all"],
    description: "Génère tous les tests pour le projet",
  },
  3: {
    name: "Générateur de tests - Hooks uniquement",
    command: "node",
    args: ["scripts/generators/tests/index.js", "--type", "hook"],
    description: "Génère les tests pour tous les hooks",
  },
  4: {
    name: "Générateur de tests - Composants uniquement",
    command: "node",
    args: ["scripts/generators/tests/index.js", "--type", "component"],
    description: "Génère les tests pour tous les composants",
  },
  5: {
    name: "Générateur de tests - Utilitaires uniquement",
    command: "node",
    args: ["scripts/generators/tests/index.js", "--type", "util"],
    description: "Génère les tests pour tous les utilitaires",
  },
  6: {
    name: "Générateur de tests - Stores uniquement",
    command: "node",
    args: ["scripts/generators/tests/index.js", "--type", "store"],
    description: "Génère les tests pour tous les stores",
  },
  7: {
    name: "Générateur de tests - Feature spécifique",
    command: "node",
    args: ["scripts/generators/tests/index.js", "--feature"],
    description: "Génère les tests pour une feature (demande le nom)",
    requiresInput: true,
    inputPrompt: "Nom de la feature (users, shop, stats, etc.): ",
  },
  8: {
    name: "Améliorer la couverture - Générer tests manquants",
    command: "node",
    args: ["scripts/generators/tests/index.js", "--all", "--verbose"],
    description: "Génère tous les tests manquants pour améliorer la couverture",
  },
  9: {
    name: "Améliorer la couverture - Dry-run + Coverage",
    command: "sh",
    args: ["-c", "npm run test:coverage && node scripts/generators/tests/index.js --all --dry-run"],
    description: "Affiche la couverture actuelle puis prévisualise les tests à générer",
  },
  10: {
    name: "Fix GraphQL Generated Files",
    command: "node",
    args: ["scripts/tools/graphql/fix-generated.cjs"],
    description: "Corrige les fichiers générés par GraphQL Codegen",
  },
  11: {
    name: "Lancer les tests",
    command: "npm",
    args: ["test"],
    description: "Lance tous les tests avec Vitest",
  },
  12: {
    name: "Tests avec UI",
    command: "npm",
    args: ["run", "test:ui"],
    description: "Ouvre l'interface Vitest UI",
  },
  13: {
    name: "Couverture de tests",
    command: "npm",
    args: ["run", "test:coverage"],
    description: "Génère un rapport de couverture",
  },
  14: {
    name: "Couverture + Rapport HTML",
    command: "sh",
    args: [
      "-c",
      "npm run test:coverage && echo 'Ouvrez ./coverage/index.html pour voir le rapport'",
    ],
    description: "Génère la couverture et indique où trouver le rapport HTML",
  },
  15: {
    name: "GraphQL Codegen",
    command: "npm",
    args: ["run", "codegen"],
    description: "Génère les types TypeScript depuis le schéma GraphQL",
  },
  16: {
    name: "GraphQL Codegen + Watch",
    command: "npm",
    args: ["run", "codegen:watch"],
    description: "Génère les types GraphQL et surveille les changements",
  },
  h: {
    name: "Aide - Générateur de tests",
    command: "node",
    args: ["scripts/generators/tests/index.js", "--help"],
    description: "Affiche l'aide du générateur de tests",
  },
};

function showBanner() {
  console.clear();
  console.log("");
  console.log(colorize("╔══════════════════════════════════════════════════════════╗", "cyan"));
  console.log(colorize("║         ClubManager - Scripts Frontend v1.0.0           ║", "cyan"));
  console.log(colorize("╚══════════════════════════════════════════════════════════╝", "cyan"));
  console.log("");
}

function showMenu() {
  console.log(colorize("📋 Scripts disponibles:", "bright"));
  console.log("");

  // Générateur de tests
  console.log(colorize("🧪 Générateur de tests:", "yellow"));
  ["1", "2", "3", "4", "5", "6", "7"].forEach((key) => {
    const script = scripts[key];
    console.log(`  ${colorize(key, "green")}. ${script.name}`);
    console.log(`     ${colorize(script.description, "blue")}`);
  });

  console.log("");

  // Amélioration couverture
  console.log(colorize("📈 Amélioration couverture:", "yellow"));
  ["8", "9"].forEach((key) => {
    const script = scripts[key];
    console.log(`  ${colorize(key, "green")}. ${script.name}`);
    console.log(`     ${colorize(script.description, "blue")}`);
  });

  console.log("");

  // Utilitaires
  console.log(colorize("🔧 Utilitaires:", "yellow"));
  ["10"].forEach((key) => {
    const script = scripts[key];
    console.log(`  ${colorize(key, "green")}. ${script.name}`);
    console.log(`     ${colorize(script.description, "blue")}`);
  });

  console.log("");

  // Tests
  console.log(colorize("✅ Tests:", "yellow"));
  ["11", "12", "13", "14"].forEach((key) => {
    const script = scripts[key];
    console.log(`  ${colorize(key, "green")}. ${script.name}`);
    console.log(`     ${colorize(script.description, "blue")}`);
  });

  console.log("");

  // GraphQL
  console.log(colorize("📊 GraphQL:", "yellow"));
  ["15", "16"].forEach((key) => {
    const script = scripts[key];
    console.log(`  ${colorize(key, "green")}. ${script.name}`);
    console.log(`     ${colorize(script.description, "blue")}`);
  });

  console.log("");

  // Aide et quitter
  console.log(colorize("ℹ️  Autres:", "yellow"));
  console.log(`  ${colorize("h", "green")}. Aide - Générateur de tests`);
  console.log(`  ${colorize("q", "green")}. Quitter`);

  console.log("");
  console.log(colorize("─".repeat(60), "cyan"));
}

function runScript(script, additionalArgs = []) {
  return new Promise((resolve, reject) => {
    console.log("");
    console.log(colorize(`▶️  Exécution: ${script.name}`, "cyan"));
    console.log("");

    const args = [...script.args, ...additionalArgs];
    const child = spawn(script.command, args, {
      stdio: "inherit",
      shell: true,
      cwd: join(__dirname, ".."),
    });

    child.on("close", (code) => {
      console.log("");
      if (code === 0) {
        console.log(colorize("✅ Terminé avec succès!", "green"));
      } else {
        console.log(colorize(`❌ Erreur (code: ${code})`, "red"));
      }
      console.log("");
      resolve(code);
    });

    child.on("error", (error) => {
      console.error(colorize(`❌ Erreur: ${error.message}`, "red"));
      reject(error);
    });
  });
}

async function askQuestion(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(colorize(prompt, "yellow"), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  showBanner();
  showMenu();

  const choice = await askQuestion("Votre choix: ");

  if (choice.toLowerCase() === "q") {
    console.log(colorize("👋 Au revoir!", "cyan"));
    process.exit(0);
  }

  const script = scripts[choice];

  if (!script) {
    console.log(colorize("❌ Choix invalide. Veuillez réessayer.", "red"));
    setTimeout(() => main(), 2000);
    return;
  }

  let additionalArgs = [];

  // Si le script nécessite un input
  if (script.requiresInput) {
    const input = await askQuestion(script.inputPrompt);
    if (input) {
      additionalArgs.push(input);
    }
  }

  try {
    await runScript(script, additionalArgs);

    // Demander si on veut continuer
    const continueChoice = await askQuestion(
      colorize("Voulez-vous lancer un autre script? (o/n): ", "yellow"),
    );

    if (continueChoice.toLowerCase() === "o" || continueChoice.toLowerCase() === "y") {
      main();
    } else {
      console.log(colorize("👋 Au revoir!", "cyan"));
      process.exit(0);
    }
  } catch (error) {
    console.error(colorize(`Erreur lors de l'exécution: ${error.message}`, "red"));
    process.exit(1);
  }
}

// Gestion des signaux
process.on("SIGINT", () => {
  console.log("");
  console.log(colorize("👋 Au revoir!", "cyan"));
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("");
  console.log(colorize("👋 Au revoir!", "cyan"));
  process.exit(0);
});

// Lancer le menu principal
main().catch((error) => {
  console.error(colorize(`Erreur: ${error.message}`, "red"));
  process.exit(1);
});
