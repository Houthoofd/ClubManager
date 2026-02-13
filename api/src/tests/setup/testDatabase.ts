/**
 * Configuration de la base de données de test pour les tests d'intégration
 * Copie la structure de la DB principale vers une DB de test séparée
 */

import { prisma } from '@/infrastructure/database/prisma-client.js';
import { execSync } from "child_process";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement de test
dotenv.config({ path: join(__dirname, "../../../.env.test") });

// Charger aussi la config de dev pour connaître la DB source
const devEnvPath = join(__dirname, "../../../.env.development");
const devEnv: Record<string, string> = {};
if (fs.existsSync(devEnvPath)) {
  const content = fs.readFileSync(devEnvPath, "utf8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      devEnv[match[1].trim()] = match[2].trim();
    }
  });
}

let testPrisma: typeof prisma;

/**
 * Trouver le chemin de MySQL sur le système
 */
function findMySQLPath(): string {
  const possiblePaths = [
    "C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin",
    "C:\\laragon\\bin\\mysql\\mysql-8.1.0-winx64\\bin",
    "C:\\laragon\\bin\\mysql\\mysql-5.7.33-winx64\\bin",
    "C:\\xampp\\mysql\\bin",
    "C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin",
    "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin",
    "C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin",
  ];

  // Essayer de trouver mysql.exe dans les chemins possibles
  for (const dir of possiblePaths) {
    const mysqlExe = path.join(dir, "mysql.exe");
    const mysqldumpExe = path.join(dir, "mysqldump.exe");
    if (fs.existsSync(mysqlExe) && fs.existsSync(mysqldumpExe)) {
      console.log(`✅ MySQL trouvé dans: ${dir}`);
      return dir;
    }
  }

  // Si pas trouvé, utiliser juste 'mysql' (si dans le PATH)
  console.log(
    "⚠️  MySQL non trouvé dans les chemins standards, utilisation du PATH système",
  );
  return "";
}

const mysqlBinPath = findMySQLPath();
const mysqlCmd = mysqlBinPath ? path.join(mysqlBinPath, "mysql.exe") : "mysql";
const mysqldumpCmd = mysqlBinPath
  ? path.join(mysqlBinPath, "mysqldump.exe")
  : "mysqldump";

/**
 * Copier la structure de la DB principale vers la DB de test
 */
async function copyDatabaseStructure() {
  const sourceDB = devEnv.DB_NAME || "clubmanager";
  const targetDB = process.env.DB_NAME || "clubmanager_test";
  const host = process.env.DB_HOST || "localhost";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";

  console.log(
    `📋 Copie de la structure de '${sourceDB}' vers '${targetDB}'...`,
  );

  const dumpFile = join(__dirname, "temp_structure.sql");

  try {
    // Dump de la structure de la DB source (sans les données)
    console.log(`   Extraction de la structure de ${sourceDB}...`);
    const dumpCommand = password
      ? `"${mysqldumpCmd}" -h${host} -u${user} -p${password} --no-data --skip-add-drop-table --skip-comments ${sourceDB}`
      : `"${mysqldumpCmd}" -h${host} -u${user} --no-data --skip-add-drop-table --skip-comments ${sourceDB}`;

    const dumpOutput = execSync(dumpCommand, { encoding: "utf8" });
    fs.writeFileSync(dumpFile, dumpOutput);

    // Importer la structure dans la DB de test
    console.log(`   Import de la structure dans ${targetDB}...`);
    const dumpContent = fs.readFileSync(dumpFile, "utf8");
    const importCommand = password
      ? `"${mysqlCmd}" -h${host} -u${user} -p${password} ${targetDB}`
      : `"${mysqlCmd}" -h${host} -u${user} ${targetDB}`;

    execSync(importCommand, { input: dumpContent });

    // Nettoyer le fichier temporaire
    fs.unlinkSync(dumpFile);

    console.log("✅ Structure copiée avec succès");
  } catch (error) {
    console.error("❌ Erreur lors de la copie de structure:", error);
    if (fs.existsSync(dumpFile)) {
      fs.unlinkSync(dumpFile);
    }
    throw error;
  }
}

/**
 * Initialiser la base de données de test
 */
export async function setupTestDatabase() {
  try {
    console.log("🔧 Configuration de la base de données de test...");

    const host = process.env.DB_HOST || "localhost";
    const user = process.env.DB_USER || "root";
    const password = process.env.DB_PASSWORD || "";
    const testDB = process.env.DB_NAME || "clubmanager_test";

    // Supprimer et recréer la base de données de test
    console.log(`📦 Recréation de la base ${testDB}...`);
    try {
      // Si pas de mot de passe, ne pas utiliser -p
      const createDbCommand = password
        ? `"${mysqlCmd}" -h${host} -u${user} -p${password} -e "DROP DATABASE IF EXISTS ${testDB}; CREATE DATABASE ${testDB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`
        : `"${mysqlCmd}" -h${host} -u${user} -e "DROP DATABASE IF EXISTS ${testDB}; CREATE DATABASE ${testDB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`;

      execSync(createDbCommand, { stdio: "pipe" });
    } catch (error) {
      console.error("❌ Erreur lors de la création de la DB:", error);
      throw error;
    }

    // Copier la structure de la DB principale
    await copyDatabaseStructure();

    // Utiliser l'instance Prisma globale qui pointe déjà vers .env.test
    // car .env.test a été chargé AVANT l'import de prisma-client dans jest.setup.mjs
    testPrisma = prisma;

    console.log("✅ Base de données de test prête");
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);

    return testPrisma;
  } catch (error) {
    console.error("❌ Erreur lors du setup de la DB de test:", error);
    throw error;
  }
}

/**
 * Nettoyer la base de données de test
 */
export async function cleanupTestDatabase() {
  if (!testPrisma) return;

  try {
    console.log("🧹 Nettoyage de la base de données de test...");

    // Supprimer les données dans l'ordre (contraintes FK)
    try {
      await testPrisma.alertes_utilisateurs.deleteMany({});
    } catch (error) {
      console.warn("⚠️ Impossible de nettoyer alertes_utilisateurs:", error);
    }

    try {
      await testPrisma.utilisateurs.deleteMany({});
    } catch (error) {
      console.warn("⚠️ Impossible de nettoyer utilisateurs:", error);
    }

    try {
      await testPrisma.commandes.deleteMany({});
    } catch (error) {
      console.warn("⚠️ Impossible de nettoyer commandes:", error);
    }

    try {
      await testPrisma.inscriptions.deleteMany({});
    } catch (error) {
      console.warn("⚠️ Impossible de nettoyer inscriptions:", error);
    }

    try {
      await testPrisma.paiements.deleteMany({});
    } catch (error) {
      console.warn("⚠️ Impossible de nettoyer paiements:", error);
    }

    console.log("✅ Base de données nettoyée");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    throw error;
  }
}

/**
 * Fermer la connexion à la base de données de test
 */
export async function teardownTestDatabase() {
  if (!testPrisma) return;

  try {
    // Ne pas déconnecter Prisma ici car c'est l'instance globale
    // Prisma gère automatiquement la déconnexion
    console.log("✅ Connexion à la DB de test fermée");
  } catch (error) {
    console.error("❌ Erreur lors de la fermeture:", error);
    throw error;
  }
}

/**
 * Obtenir l'instance Prisma pour les tests
 */
export function getTestPrisma() {
  if (!testPrisma) {
    throw new Error(
      "La base de données de test n'est pas initialisée. Appelez setupTestDatabase() d'abord.",
    );
  }
  return testPrisma;
}

/**
 * Seed de données de test pour les alertes
 */
export async function seedTestAlertes() {
  const prismaInstance = getTestPrisma();

  console.log("🌱 Seed des données de test pour les alertes...");

  // Nettoyer les alertes_utilisateurs avant de seed (pour éviter les doublons)
  try {
    await prismaInstance.alertes_utilisateurs.deleteMany({});
  } catch (error) {
    console.warn("⚠️ Impossible de nettoyer alertes_utilisateurs:", error);
  }

  // Créer des types d'alertes (individuellement pour compatibilité MySQL)
  const alertTypes = [
    {
      id: 1,
      code: "COMPTE_INCOMPLET",
      nom: "Compte incomplet",
      description: "Profil utilisateur incomplet",
      priorite: "haute",
      actif: true,
    },
    {
      id: 2,
      code: "PAIEMENT_RETARD",
      nom: "Paiement en retard",
      description: "Paiement en retard",
      priorite: "normale",
      actif: true,
    },
    {
      id: 3,
      code: "PAIEMENT_CRITIQUE",
      nom: "Paiement critique",
      description: "Paiement très en retard",
      priorite: "critique",
      actif: true,
    },
  ];

  for (const alertType of alertTypes) {
    try {
      await prismaInstance.alertes_types.create({
        data: alertType,
      });
    } catch (error) {
      // Ignorer les erreurs de doublons (données déjà existantes)
    }
  }

  // Créer des utilisateurs de test (individuellement pour compatibilité MySQL)
  const testUsers = [
    {
      id: 1,
      userId: "TEST001",
      first_name: "Jean",
      last_name: "Test",
      email: "jean.test@test.com",
      password: "hashed_password",
      status_id: null,
      grade_id: null,
      nom_utilisateur: "jean_test",
      date_of_birth: new Date("1990-01-01"),
    },
    {
      id: 2,
      userId: "TEST002",
      first_name: "Marie",
      last_name: "Test",
      email: "marie.test@test.com",
      password: "hashed_password",
      status_id: null,
      grade_id: null,
      nom_utilisateur: "marie_test",
      date_of_birth: new Date("1992-05-15"),
    },
  ];

  for (const user of testUsers) {
    try {
      await prismaInstance.utilisateurs.create({
        data: user,
      });
    } catch (error) {
      // Ignorer les erreurs de doublons (données déjà existantes)
    }
  }

  // Créer des alertes de test (individuellement pour compatibilité MySQL)
  const testAlertes = [
    {
      utilisateur_id: 1,
      alerte_type_id: 1,
      statut: "active",
      date_detection: new Date("2026-01-20"),
      donnees_contexte: { champsManquants: ["email"] },
    },
    {
      utilisateur_id: 2,
      alerte_type_id: 3,
      statut: "active",
      date_detection: new Date("2026-01-15"),
      donnees_contexte: { joursRetard: 45, montantTotal: "150.00" },
    },
  ];

  for (const alerte of testAlertes) {
    try {
      await prismaInstance.alertes_utilisateurs.create({
        data: alerte,
      });
    } catch (error) {
      // Ignorer les erreurs de doublons (données déjà existantes)
    }
  }

  console.log("✅ Seed terminé");
}

/**
 * Seed de données de test pour les commandes
 */
export async function seedTestCommandes() {
  const prismaInstance = getTestPrisma();

  console.log("🌱 Seed des données de test pour les commandes...");

  // Nettoyer les tables dans le bon ordre (contraintes FK)
  try {
    await prismaInstance.commandes_articles.deleteMany({});
    await prismaInstance.historique_statuts_commande.deleteMany({});
    await prismaInstance.commandes.deleteMany({});
    await prismaInstance.articles_tailles.deleteMany({});
    await prismaInstance.articles.deleteMany({});
    await prismaInstance.tailles.deleteMany({});
    await prismaInstance.categories.deleteMany({});
  } catch (error) {
    console.warn("⚠️ Erreur lors du nettoyage des tables:", error);
  }

  // Créer des utilisateurs de test si nécessaire
  let testUser1, testUser2;
  try {
    testUser1 = await prismaInstance.utilisateurs.findFirst({
      where: { email: "jean.test@test.com" },
    });
    if (!testUser1) {
      testUser1 = await prismaInstance.utilisateurs.create({
        data: {
          userId: "TEST001",
          first_name: "Jean",
          last_name: "Test",
          email: "jean.test@test.com",
          password: "hashed_password",
          status_id: null,
          grade_id: null,
          nom_utilisateur: "jean_test",
          date_of_birth: new Date("1990-01-01"),
        },
      });
    }

    testUser2 = await prismaInstance.utilisateurs.findFirst({
      where: { email: "marie.test@test.com" },
    });
    if (!testUser2) {
      testUser2 = await prismaInstance.utilisateurs.create({
        data: {
          userId: "TEST002",
          first_name: "Marie",
          last_name: "Test",
          email: "marie.test@test.com",
          password: "hashed_password",
          status_id: null,
          grade_id: null,
          nom_utilisateur: "marie_test",
          date_of_birth: new Date("1992-05-15"),
        },
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création des utilisateurs:", error);
    throw error;
  }

  // Créer des catégories
  const categorie1 = await prismaInstance.categories.create({
    data: {
      id: 1,
      nom: "Vêtements",
      description: "Articles vestimentaires du club",
    },
  });

  const categorie2 = await prismaInstance.categories.create({
    data: {
      id: 2,
      nom: "Équipement",
      description: "Équipement sportif",
    },
  });

  // Créer des articles
  const article1 = await prismaInstance.articles.create({
    data: {
      id: 1,
      nom: "Maillot Home",
      description: "Maillot domicile officiel",
      prix: 49.99,
      categorie_id: categorie1.id,
      image_url: "https://example.com/maillot-home.jpg",
    },
  });

  const article2 = await prismaInstance.articles.create({
    data: {
      id: 2,
      nom: "Short",
      description: "Short officiel",
      prix: 29.99,
      categorie_id: categorie1.id,
      image_url: "https://example.com/short.jpg",
    },
  });

  const article3 = await prismaInstance.articles.create({
    data: {
      id: 3,
      nom: "Ballon",
      description: "Ballon d'entraînement",
      prix: 19.99,
      categorie_id: categorie2.id,
      image_url: "https://example.com/ballon.jpg",
    },
  });

  // Créer des tailles
  const tailleS = await prismaInstance.tailles.create({
    data: {
      id: 1,
      nom: "S",
      code: "S",
    },
  });

  const tailleM = await prismaInstance.tailles.create({
    data: {
      id: 2,
      nom: "M",
      code: "M",
    },
  });

  const tailleL = await prismaInstance.tailles.create({
    data: {
      id: 3,
      nom: "L",
      code: "L",
    },
  });

  // Créer les stocks pour les articles
  await prismaInstance.articles_tailles.createMany({
    data: [
      { article_id: article1.id, taille_id: tailleS.id, stock_disponible: 50 },
      { article_id: article1.id, taille_id: tailleM.id, stock_disponible: 100 },
      { article_id: article1.id, taille_id: tailleL.id, stock_disponible: 75 },
      { article_id: article2.id, taille_id: tailleS.id, stock_disponible: 30 },
      { article_id: article2.id, taille_id: tailleM.id, stock_disponible: 60 },
      { article_id: article2.id, taille_id: tailleL.id, stock_disponible: 40 },
      { article_id: article3.id, taille_id: tailleM.id, stock_disponible: 200 },
    ],
  });

  // Créer des commandes de test
  const commande1 = await prismaInstance.commandes.create({
    data: {
      id: 1,
      utilisateur_id: testUser1.id,
      numero_commande: "CMD-TEST-001",
      statut: "en attente",
      total: 99.98,
      date_commande: new Date("2024-01-15"),
    },
  });

  await prismaInstance.commandes_articles.createMany({
    data: [
      {
        commande_id: commande1.id,
        article_id: article1.id,
        taille_id: tailleM.id,
        quantite: 2,
        prix_unitaire: 49.99,
      },
    ],
  });

  const commande2 = await prismaInstance.commandes.create({
    data: {
      id: 2,
      utilisateur_id: testUser2.id,
      numero_commande: "CMD-TEST-002",
      statut: "payée",
      total: 79.98,
      date_commande: new Date("2024-01-20"),
    },
  });

  await prismaInstance.commandes_articles.createMany({
    data: [
      {
        commande_id: commande2.id,
        article_id: article1.id,
        taille_id: tailleL.id,
        quantite: 1,
        prix_unitaire: 49.99,
      },
      {
        commande_id: commande2.id,
        article_id: article2.id,
        taille_id: tailleM.id,
        quantite: 1,
        prix_unitaire: 29.99,
      },
    ],
  });

  const commande3 = await prismaInstance.commandes.create({
    data: {
      id: 3,
      utilisateur_id: testUser1.id,
      numero_commande: "CMD-TEST-003",
      statut: "expédiée",
      total: 49.99,
      date_commande: new Date("2024-01-10"),
      date_expedition: new Date("2024-01-12"),
    },
  });

  await prismaInstance.commandes_articles.createMany({
    data: [
      {
        commande_id: commande3.id,
        article_id: article1.id,
        taille_id: tailleS.id,
        quantite: 1,
        prix_unitaire: 49.99,
      },
    ],
  });

  // Créer l'historique des statuts
  await prismaInstance.historique_statuts_commande.createMany({
    data: [
      {
        commande_id: commande2.id,
        ancien_statut: "en attente",
        nouveau_statut: "payée",
        date_changement: new Date("2024-01-21"),
      },
      {
        commande_id: commande3.id,
        ancien_statut: "en attente",
        nouveau_statut: "payée",
        date_changement: new Date("2024-01-11"),
      },
      {
        commande_id: commande3.id,
        ancien_statut: "payée",
        nouveau_statut: "expédiée",
        date_changement: new Date("2024-01-12"),
      },
    ],
  });

  console.log("✅ Seed des commandes terminé");
  console.log(`   - ${3} commandes créées`);
  console.log(`   - ${3} articles créés`);
  console.log(`   - ${3} tailles créées`);
  console.log(`   - ${7} stocks créés`);
}
