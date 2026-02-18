#!/usr/bin/env node

/**
 * 🔄 Rename Routes - ClubManager API
 *
 * Renomme les routes pour qu'elles correspondent aux noms des domaines
 * dans @clubmanager/types
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROUTES_PATH = path.join(__dirname, "..", "src", "routes");

// Mapping ancien nom → nouveau nom
const RENAME_MAP = {
  utilisateurs: "users",
  statistiques: "statistics",
  magasin: "shop",
  parametres: "settings",
  inscription: "memberships",
  evenements: "events",
  cours: "activities",
  messages: "communications",
};

function renameRoute(oldName, newName) {
  const oldPath = path.join(ROUTES_PATH, oldName);
  const newPath = path.join(ROUTES_PATH, newName);

  if (!fs.existsSync(oldPath)) {
    console.log(`⊘ ${oldName} n'existe pas, ignoré`);
    return false;
  }

  if (fs.existsSync(newPath)) {
    console.log(`⚠️  ${newName} existe déjà, suppression de l'ancien...`);
    fs.rmSync(oldPath, { recursive: true, force: true });
    return false;
  }

  try {
    fs.renameSync(oldPath, newPath);
    console.log(`✅ ${oldName} → ${newName}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur pour ${oldName}: ${error.message}`);
    return false;
  }
}

console.log("\n🔄 Renommage des routes...\n");

let success = 0;
let failed = 0;

for (const [oldName, newName] of Object.entries(RENAME_MAP)) {
  if (renameRoute(oldName, newName)) {
    success++;
  } else {
    failed++;
  }
}

console.log(`\n📊 Résultat: ${success} renommés, ${failed} échecs\n`);

// Vérifier la structure finale
console.log("📁 Structure finale:\n");
const routes = fs
  .readdirSync(ROUTES_PATH)
  .filter((item) => {
    const fullPath = path.join(ROUTES_PATH, item);
    return fs.statSync(fullPath).isDirectory() && !item.startsWith("_");
  })
  .sort();

routes.forEach((route) => {
  console.log(`  - ${route}`);
});

console.log(`\n✅ Total: ${routes.length} routes\n`);
