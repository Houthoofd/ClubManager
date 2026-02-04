#!/usr/bin/env node
/**
 * Script pour vérifier la structure de la table utilisateurs
 */

const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

// Charger les variables d'environnement
const envPath = path.join(__dirname, "../../.env.test");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
}

const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "clubmanager_test",
  port: parseInt(process.env.DB_PORT || "3306", 10),
};

async function checkTable() {
  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log("✅ Connexion établie\n");

    // Vérifier la structure de la table
    console.log("📋 Structure de la table utilisateurs:\n");
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM utilisateurs"
    );
    console.table(columns);

    // Vérifier les index
    console.log("\n🔑 Index de la table utilisateurs:\n");
    const [indexes] = await connection.query("SHOW INDEX FROM utilisateurs");
    console.table(indexes);

    // Vérifier s'il y a des utilisateurs avec le même email
    console.log("\n🔍 Vérification des emails en double:\n");
    const [duplicates] = await connection.query(`
      SELECT email, COUNT(*) as count
      FROM utilisateurs
      GROUP BY email
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length > 0) {
      console.log("⚠️  Emails en double trouvés:");
      console.table(duplicates);
    } else {
      console.log("✅ Aucun email en double");
    }

    // Compter les utilisateurs
    const [countResult] = await connection.query(
      "SELECT COUNT(*) as total FROM utilisateurs"
    );
    console.log(`\n📊 Total utilisateurs: ${countResult[0].total}`);

  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTable();
