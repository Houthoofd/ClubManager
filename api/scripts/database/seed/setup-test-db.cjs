#!/usr/bin/env node
/**
 * Script de setup et vérification de la base de données de test
 *
 * Ce script vérifie que la base de données de test existe et contient
 * les données de référence nécessaires. Si les données sont manquantes,
 * il les insère automatiquement.
 *
 * Usage:
 *   node scripts/seed/setup-test-db.js
 *   npm run setup:test:db
 */

const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

// Charger les variables d'environnement
const envPath = path.join(__dirname, "../../.env.test");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
} else {
  console.warn(
    "⚠️  Fichier .env.test non trouvé, utilisation des variables d'environnement système",
  );
}

// Configuration de la connexion
const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "clubmanager_test",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  multipleStatements: true,
};

// Données de référence requises
const REQUIRED_DATA = {
  genres: {
    table: "genres",
    minCount: 2,
    requiredIds: [1, 2],
    data: [
      { id: 1, genre_name: "Masculin" },
      { id: 2, genre_name: "Féminin" },
    ],
  },
  plans_tarifaires: {
    table: "plans_tarifaires",
    minCount: 3,
    requiredIds: [1, 2, 3],
    data: [
      {
        id: 1,
        nom_plan: "Paiement mensuel",
        prix: 25.0,
        periode: "mois",
        description: "Abonnement de 25 EUR par mois",
      },
      {
        id: 2,
        nom_plan: "Paiement trimestriel",
        prix: 100.0,
        periode: "trimestre",
        description: "Abonnement de 100 EUR tous les 3 mois",
      },
      {
        id: 3,
        nom_plan: "Paiement annuel",
        prix: 300.0,
        periode: "an",
        description: "Abonnement de 300 EUR pour une année complète",
      },
    ],
  },
  status: {
    table: "status",
    minCount: 4,
    requiredIds: [1, 2, 3, 4],
    data: [
      {
        id: 1,
        nom_role: "visiteur",
        description:
          "s'est rendu à un cours d'essai, pas encore inscrit dans le système",
      },
      {
        id: 2,
        nom_role: "utilisateur",
        description: "membre de l'équipe sportive",
      },
      {
        id: 3,
        nom_role: "administrateur",
        description:
          "En plus d'être un membre, l'administrateur a quelques droits supplémentaires",
      },
      {
        id: 4,
        nom_role: "super-administrateur",
        description: "Le seul et unique, a tous les droits",
      },
    ],
  },
  grades: {
    table: "grades",
    minCount: 5,
    requiredIds: [1],
    data: [
      { id: 1, grade: "ceinture blanche" },
      { id: 2, grade: "ceinture blanche une barette" },
      { id: 3, grade: "ceinture blanche deux barettes" },
      { id: 4, grade: "ceinture blanche trois barettes" },
      { id: 5, grade: "ceinture blanche quatre barettes" },
    ],
  },
};

async function checkTableExists(connection, tableName) {
  try {
    const [rows] = await connection.query(
      `SELECT COUNT(*) as count FROM information_schema.tables
       WHERE table_schema = ? AND table_name = ?`,
      [config.database, tableName],
    );
    return rows[0].count > 0;
  } catch (error) {
    console.error(
      `❌ Erreur lors de la vérification de la table ${tableName}:`,
      error.message,
    );
    return false;
  }
}

async function checkRequiredData(connection, tableConfig) {
  try {
    const { table, requiredIds } = tableConfig;

    // Vérifier si les IDs requis existent
    const placeholders = requiredIds.map(() => "?").join(",");
    const [rows] = await connection.query(
      `SELECT id FROM ${table} WHERE id IN (${placeholders})`,
      requiredIds,
    );

    const foundIds = rows.map((row) => row.id);
    const missingIds = requiredIds.filter((id) => !foundIds.includes(id));

    return {
      hasAllRequired: missingIds.length === 0,
      missingIds,
      foundCount: foundIds.length,
    };
  } catch (error) {
    console.error(
      `❌ Erreur lors de la vérification des données de ${tableConfig.table}:`,
      error.message,
    );
    return {
      hasAllRequired: false,
      missingIds: tableConfig.requiredIds,
      foundCount: 0,
    };
  }
}

async function insertMissingData(connection, tableConfig) {
  try {
    const { table, data, requiredIds } = tableConfig;

    console.log(`   🔧 Insertion des données manquantes dans ${table}...`);

    // Désactiver temporairement les contraintes FK
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // Insérer seulement les données avec les IDs requis
    const dataToInsert = data.filter((row) => requiredIds.includes(row.id));

    for (const row of dataToInsert) {
      const columns = Object.keys(row);
      const placeholders = columns.map(() => "?").join(", ");
      const values = columns.map((col) => row[col]);

      const insertQuery = `
        INSERT INTO ${table} (${columns.join(", ")})
        VALUES (${placeholders})
        ON DUPLICATE KEY UPDATE id=id
      `;

      await connection.query(insertQuery, values);
    }

    // Réactiver les contraintes FK
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log(
      `   ✅ ${dataToInsert.length} ligne(s) insérée(s) dans ${table}`,
    );
    return true;
  } catch (error) {
    console.error(
      `   ❌ Erreur lors de l'insertion dans ${tableConfig.table}:`,
      error.message,
    );
    return false;
  }
}

async function addUniqueConstraintOnEmail(connection) {
  try {
    console.log("🔧 Vérification de la contrainte UNIQUE sur email...");

    // Vérifier si la contrainte UNIQUE existe
    const [indexes] = await connection.query(
      "SHOW INDEX FROM utilisateurs WHERE Column_name = 'email'",
    );

    const hasUniqueConstraint = indexes.some(
      (idx) => idx.Non_unique === 0 && idx.Column_name === "email",
    );

    if (hasUniqueConstraint) {
      console.log("   ✅ Contrainte UNIQUE sur email déjà présente\n");
      return true;
    }

    console.log("   ⚠️  Contrainte UNIQUE manquante, ajout en cours...");

    // Supprimer l'index normal s'il existe
    try {
      await connection.query("ALTER TABLE utilisateurs DROP INDEX idx_email");
      console.log("   ✓ Index normal idx_email supprimé");
    } catch (error) {
      // L'index n'existe peut-être pas, ce n'est pas grave
    }

    // Ajouter la contrainte UNIQUE
    await connection.query(
      "ALTER TABLE utilisateurs ADD UNIQUE KEY unique_email (email)",
    );
    console.log("   ✅ Contrainte UNIQUE ajoutée sur email\n");

    return true;
  } catch (error) {
    console.error(
      "   ❌ Erreur lors de l'ajout de la contrainte UNIQUE:",
      error.message,
    );
    return false;
  }
}

async function verifyTestDatabase() {
  console.log("\n🔍 Vérification de la base de données de test...\n");
  console.log(`📦 Base de données: ${config.database}`);
  console.log(`🖥️  Host: ${config.host}:${config.port}`);
  console.log(`👤 User: ${config.user}\n`);

  let connection;
  let allValid = true;

  try {
    // Connexion à la base de données
    connection = await mysql.createConnection(config);
    console.log("✅ Connexion établie\n");

    // Ajouter la contrainte UNIQUE sur email
    const constraintAdded = await addUniqueConstraintOnEmail(connection);
    if (!constraintAdded) {
      allValid = false;
    }

    // Vérifier chaque table et ses données
    for (const [name, tableConfig] of Object.entries(REQUIRED_DATA)) {
      console.log(`📊 Vérification de la table ${tableConfig.table}...`);

      // Vérifier que la table existe
      const tableExists = await checkTableExists(connection, tableConfig.table);
      if (!tableExists) {
        console.error(`   ❌ Table ${tableConfig.table} n'existe pas !`);
        allValid = false;
        continue;
      }

      // Vérifier les données requises
      const dataCheck = await checkRequiredData(connection, tableConfig);

      if (dataCheck.hasAllRequired) {
        console.log(
          `   ✅ Toutes les données requises sont présentes (${dataCheck.foundCount}/${tableConfig.requiredIds.length})`,
        );
      } else {
        console.warn(
          `   ⚠️  Données manquantes: IDs ${dataCheck.missingIds.join(", ")}`,
        );

        // Tenter d'insérer les données manquantes
        const inserted = await insertMissingData(connection, tableConfig);
        if (!inserted) {
          allValid = false;
        }
      }

      console.log("");
    }

    // Résumé final
    if (allValid) {
      console.log("✅ ✅ ✅ Base de données de test prête ! ✅ ✅ ✅\n");
      console.log(
        "Vous pouvez maintenant exécuter les tests d'intégration réels.\n",
      );
    } else {
      console.error(
        "❌ Des problèmes ont été détectés dans la base de données de test.",
      );
      console.error("Veuillez vérifier les erreurs ci-dessus.\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Erreur lors de la vérification:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Le serveur MySQL n'est pas accessible.");
      console.error(
        "   Vérifiez que MySQL est démarré et que les credentials sont corrects.\n",
      );
    } else if (error.code === "ER_BAD_DB_ERROR") {
      console.error("\n💡 La base de données n'existe pas.");
      console.error(
        `   Créez la base de données : CREATE DATABASE ${config.database};\n`,
      );
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Connexion fermée\n");
    }
  }
}

// Fonction pour nettoyer les utilisateurs de test
async function cleanTestUsers() {
  console.log("🧹 Nettoyage des utilisateurs de test...\n");

  let connection;

  try {
    connection = await mysql.createConnection(config);

    // Supprimer les utilisateurs avec email de test
    const [result] = await connection.query(`
      DELETE FROM utilisateurs
      WHERE email LIKE '%test_%@test.com'
         OR email LIKE '%test-real-db%@example.com'
         OR email LIKE '%test-inscription%@example.com'
    `);

    console.log(
      `✅ ${result.affectedRows} utilisateur(s) de test supprimé(s)\n`,
    );
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--clean") || args.includes("-c")) {
    await cleanTestUsers();
  } else if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: node setup-test-db.js [options]

Options:
  --clean, -c    Nettoyer les utilisateurs de test
  --help, -h     Afficher cette aide

Sans option: Vérifie et prépare la base de données de test
    `);
  } else {
    await verifyTestDatabase();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Erreur fatale:", error);
    process.exit(1);
  });
}

module.exports = { verifyTestDatabase, cleanTestUsers };
