import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  multipleStatements: false,
};

async function installDatabase() {
  let connection;

  try {
    console.log("\n🚀 Installation de la base de données ClubManager...\n");
    console.log("═".repeat(80));

    // Read the SQL file
    const sqlFilePath = join(
      __dirname,
      "..",
      "..",
      "db",
      "creation",
      "clubmanager_schema.sql",
    );

    console.log("📖 Lecture du fichier SQL...");
    console.log(`   Fichier: ${sqlFilePath}`);
    console.log("   Type: Schéma uniquement (sans données)");

    const sql = readFileSync(sqlFilePath, "utf8");
    console.log(`✅ Fichier chargé (${(sql.length / 1024).toFixed(2)} KB)\n`);

    // Connect to MySQL
    console.log("🔌 Connexion à MySQL...");
    console.log(`   Hôte: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   Utilisateur: ${dbConfig.user}`);

    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connecté à MySQL\n");

    // Drop existing database
    console.log("🗑️  Suppression de l'ancienne base (si elle existe)...");
    await connection.query("DROP DATABASE IF EXISTS clubmanager_test");
    console.log("✅ Ancienne base supprimée\n");

    // Create new database
    console.log("📦 Création de la nouvelle base de données...");
    await connection.query(
      "CREATE DATABASE clubmanager_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    );
    console.log("✅ Base de données créée\n");

    // Close and reconnect to the new database
    await connection.end();

    console.log("🔌 Connexion à la base clubmanager_test...");
    connection = await mysql.createConnection({
      ...dbConfig,
      database: "clubmanager_test",
    });
    console.log("✅ Connecté à clubmanager_test\n");

    // Execute the SQL file
    console.log("⚙️  Exécution du script SQL...");
    console.log("   Cela peut prendre quelques secondes...\n");

    // Disable foreign key checks for installation
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // Split SQL into statements and execute them one by one
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let executed = 0;
    let skipped = 0;

    for (const statement of statements) {
      if (statement.length > 10) {
        try {
          await connection.query(statement);
          executed++;
          if (executed % 10 === 0) {
            console.log(
              `   Progression: ${executed}/${statements.length} statements...`,
            );
          }
        } catch (err) {
          // Skip errors for IF EXISTS, etc.
          if (
            !err.message.includes("doesn't exist") &&
            !err.message.includes("Unknown table")
          ) {
            console.log(`   ⚠️  Warning: ${err.message.substring(0, 60)}...`);
          }
          skipped++;
        }
      }
    }

    // Re-enable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log(
      `✅ Script SQL exécuté avec succès! (${executed} statements, ${skipped} skipped)\n`,
    );

    // Verify installation
    console.log("🔍 Vérification de l'installation...\n");

    const [tables] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?",
      ["clubmanager_test"],
    );

    const tableCount = tables[0].count;
    console.log(`   📊 Nombre de tables: ${tableCount}`);

    // Check for key tables
    const keyTables = ["users", "sports", "orders", "payments", "enrollments"];
    console.log("\n   Vérification des tables clés:");

    for (const tableName of keyTables) {
      const [exists] = await connection.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
        ["clubmanager_test", tableName],
      );

      if (exists[0].count > 0) {
        const [rows] = await connection.query(
          `SELECT COUNT(*) as count FROM \`${tableName}\``,
        );
        console.log(`   ✅ ${tableName.padEnd(20)} - ${rows[0].count} lignes`);
      } else {
        console.log(`   ❌ ${tableName.padEnd(20)} - MANQUANTE!`);
      }
    }

    console.log("\n" + "═".repeat(80));
    console.log("🎉 INSTALLATION RÉUSSIE!");
    console.log("═".repeat(80));
    console.log("\n📋 Prochaines étapes:");
    console.log("   1. Vérifier la connexion: cd api && npx prisma db pull");
    console.log("   2. Générer le client: npx prisma generate");
    console.log("   3. Lancer l'application: npm run dev\n");
  } catch (error) {
    console.error("\n❌ ERREUR lors de l'installation!");
    console.error("Message:", error.message);

    if (error.code === "ENOENT") {
      console.error("\n💡 Le fichier SQL n'a pas été trouvé.");
      console.error("   Vérifiez que db/schema/clubmanager_full.sql existe.\n");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("\n💡 Accès refusé à MySQL.");
      console.error("   Vérifiez vos identifiants de connexion.\n");
    } else {
      console.error("\nStack:", error.stack);
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Connexion fermée\n");
    }
  }
}

// Run the installation
installDatabase();
