import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env.test") });

const prisma = new PrismaClient();

async function checkStructure() {
  try {
    console.log("Vérification de la structure de la table stocks...\n");

    const columns = await prisma.$queryRaw`SHOW COLUMNS FROM stocks`;

    console.log("Colonnes de la table 'stocks':");
    console.table(columns);

    console.log("\nVérification de la table articles_tailles...\n");

    const columnsAT = await prisma.$queryRaw`SHOW COLUMNS FROM articles_tailles`;

    console.log("Colonnes de la table 'articles_tailles':");
    console.table(columnsAT);

  } catch (error) {
    console.error("Erreur:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStructure();
