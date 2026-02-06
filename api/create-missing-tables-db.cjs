require("dotenv").config({ path: ".env.test" });
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function createMissingTables() {
  console.log("🔧 Création des tables manquantes...\n");

  const config = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "clubmanager_test",
    multipleStatements: true,
  };

  console.log("📊 Configuration:");
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}\n`);

  let connection;

  try {
    // Read SQL file
    const sqlPath = path.join(
      __dirname,
      "..",
      "create-only-missing-tables.sql",
    );

    if (!fs.existsSync(sqlPath)) {
      console.error("❌ Fichier create-only-missing-tables.sql introuvable!");
      console.log("💡 Exécutez d'abord: node api/extract-missing-tables.cjs");
      process.exit(1);
    }

    console.log("📄 Lecture du script SQL...");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Remove comments and split into statements
    const statements = sqlContent
      .split("\n")
      .filter((line) => !line.trim().startsWith("--") && line.trim().length > 0)
      .join("\n")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`   ✅ ${statements.length} instructions SQL trouvées\n`);

    // Connect to database
    console.log("🔌 Connexion à MySQL...");
    connection = await mysql.createConnection(config);
    console.log("   ✅ Connexion réussie!\n");

    // Execute statements one by one
    console.log("🚀 Exécution des instructions SQL...\n");

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Extract table name for better logging
      const createMatch = statement.match(/CREATE TABLE `(\w+)`/);
      const alterMatch = statement.match(/ALTER TABLE `(\w+)`/);
      const tableName = createMatch
        ? createMatch[1]
        : alterMatch
          ? alterMatch[1]
          : "";

      const prefix = tableName
        ? `[${tableName}]`
        : `[${i + 1}/${statements.length}]`;

      try {
        await connection.execute(statement);
        successCount++;

        if (createMatch) {
          console.log(`   ✅ ${prefix} Table créée`);
        } else if (alterMatch) {
          console.log(`   ✅ ${prefix} Foreign key ajoutée`);
        } else {
          console.log(`   ✅ ${prefix} Instruction exécutée`);
        }
      } catch (error) {
        // Check if error is because table/constraint already exists
        if (
          error.code === "ER_TABLE_EXISTS_ERROR" ||
          error.code === "ER_DUP_KEYNAME" ||
          error.message.includes("already exists")
        ) {
          skippedCount++;
          console.log(`   ⚠️  ${prefix} Déjà existant (ignoré)`);
        } else if (
          error.message.includes("Duplicate foreign key") ||
          error.message.includes("foreign key constraint") ||
          error.code === "ER_CANT_CREATE_TABLE" ||
          error.code === "ER_DUP_CONSTRAINT"
        ) {
          skippedCount++;
          console.log(
            `   ⚠️  ${prefix} Contrainte ignorée (${error.code || "FK error"})`,
          );
        } else {
          errorCount++;
          console.error(`   ❌ ${prefix} Erreur: ${error.message}`);

          // Only stop on critical CREATE TABLE errors
          if (createMatch && !error.message.includes("doesn't exist")) {
            console.error(`\n❌ Arrêt suite à une erreur critique`);
            throw error;
          }
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 RÉSUMÉ DE L'EXÉCUTION:");
    console.log(`   Instructions totales: ${statements.length}`);
    console.log(`   ✅ Succès: ${successCount}`);
    console.log(`   ⚠️  Ignorées (déjà existantes): ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log("=".repeat(60));

    if (errorCount === 0) {
      console.log("\n✅ Toutes les tables ont été créées avec succès!");
    } else if (successCount > 0) {
      console.log(
        "\n⚠️  Certaines erreurs sont survenues, mais des tables ont été créées",
      );
    }

    console.log("\n📝 Prochaine étape:");
    console.log("   Vérifier les tables: node api/check-missing-tables.cjs");
  } catch (error) {
    console.error("\n❌ Erreur fatale:", error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Connexion fermée");
    }
  }
}

createMissingTables();
