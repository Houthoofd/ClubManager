import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env.test") });

const prisma = new PrismaClient();

async function countTables() {
  try {
    console.log("================================================================================");
    console.log("COMPTAGE DES TABLES - BASE DE DONNÉES CLUBMANAGER");
    console.log("================================================================================\n");

    // Compter les tables
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
    `;

    const totalTables = Number(countResult[0].count);
    console.log(`📊 Nombre total de tables: ${totalTables}\n`);

    // Lister toutes les tables
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME, TABLE_ROWS,
             ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) as SIZE_KB
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;

    console.log("📋 Liste des tables:\n");
    console.log("┌──────┬─────────────────────────────────┬──────────┬────────────┐");
    console.log("│ #    │ Nom de la table                 │ Lignes   │ Taille KB  │");
    console.log("├──────┼─────────────────────────────────┼──────────┼────────────┤");

    tables.forEach((table, index) => {
      const num = String(index + 1).padStart(4, " ");
      const name = String(table.TABLE_NAME).padEnd(31, " ");
      const rows = String(table.TABLE_ROWS || 0).padStart(8, " ");
      const size = String(table.SIZE_KB || 0).padStart(10, " ");
      console.log(`│ ${num} │ ${name} │ ${rows} │ ${size} │`);
    });

    console.log("└──────┴─────────────────────────────────┴──────────┴────────────┘\n");

    // Identifier les nouvelles tables de la Phase 1
    const phase1Tables = ["payment_methods", "course_types", "article_stock"];
    const newTables = tables.filter((t) =>
      phase1Tables.includes(t.TABLE_NAME)
    );

    console.log("✨ Nouvelles tables créées (Phase 1):\n");
    if (newTables.length > 0) {
      newTables.forEach((table) => {
        console.log(`   ✅ ${table.TABLE_NAME}`);
      });
    } else {
      console.log("   ⚠️  Aucune nouvelle table détectée");
    }

    console.log("\n================================================================================");
    console.log(`RÉSUMÉ: ${totalTables} tables au total`);
    console.log("================================================================================\n");
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

countTables();
