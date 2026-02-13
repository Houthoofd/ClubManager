#!/usr/bin/env node
/**
 * Script de seed pour la base de données de test clubmanager_test
 *
 * Ce script insère les données de référence nécessaires pour les tests
 * d'intégration réels du module d'inscription.
 *
 * Usage:
 *   node scripts/seed/seed-test-db.js
 *   npm run seed:test
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

// Configuration de la connexion
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'clubmanager_test',
  port: process.env.DB_PORT || 3306,
};

// Données de référence
const seedData = {
  genres: [
    { id: 1, genre_name: 'Masculin' },
    { id: 2, genre_name: 'Féminin' }
  ],

  plans_tarifaires: [
    { id: 1, nom_plan: 'Paiement mensuel', prix: 25.00, periode: 'mois', description: 'Abonnement de 25 EUR par mois' },
    { id: 2, nom_plan: 'Paiement trimestriel', prix: 100.00, periode: 'trimestre', description: 'Abonnement de 100 EUR tous les 3 mois' },
    { id: 3, nom_plan: 'Paiement annuel', prix: 300.00, periode: 'an', description: 'Abonnement de 300 EUR pour une année complète' }
  ],

  status: [
    { id: 1, nom_role: 'visiteur', description: "s'est rendu à un cours d'essai, pas encore inscrit dans le système" },
    { id: 2, nom_role: 'utilisateur', description: "membre de l'équipe sportive" },
    { id: 3, nom_role: 'administrateur', description: "En plus d'être un membre, l'administrateur a quelques droits supplémentaires par rapport au simple utilisateur, ce sont souvent des professeurs" },
    { id: 4, nom_role: 'super-administrateur', description: "Le seul et unique, a tous les droits" }
  ],

  grades: [
    { id: 1, grade: 'ceinture blanche' },
    { id: 2, grade: 'ceinture blanche une barette' },
    { id: 3, grade: 'ceinture blanche deux barettes' },
    { id: 4, grade: 'ceinture blanche trois barettes' },
    { id: 5, grade: 'ceinture blanche quatre barettes' },
    { id: 6, grade: 'ceinture bleue' },
    { id: 7, grade: 'ceinture bleue une barette' },
    { id: 8, grade: 'ceinture bleue deux barettes' },
    { id: 9, grade: 'ceinture bleue trois barettes' },
    { id: 10, grade: 'ceinture bleue quatre barettes' },
    { id: 11, grade: 'ceinture violette' },
    { id: 12, grade: 'ceinture violette une barette' },
    { id: 13, grade: 'ceinture violette deux barettes' },
    { id: 14, grade: 'ceinture violette trois barettes' },
    { id: 15, grade: 'ceinture violette quatre barettes' },
    { id: 16, grade: 'ceinture marron' },
    { id: 17, grade: 'ceinture marron une barette' },
    { id: 18, grade: 'ceinture marron deux barettes' },
    { id: 19, grade: 'ceinture marron trois barettes' },
    { id: 20, grade: 'ceinture marron quatre barettes' },
    { id: 21, grade: 'ceinture noire' },
    { id: 22, grade: 'ceinture noire une barette' },
    { id: 23, grade: 'ceinture noire deux barettes' },
    { id: 24, grade: 'ceinture noire trois barettes' },
    { id: 25, grade: 'ceinture noire quatre barettes' },
    { id: 26, grade: 'ceinture noire cinq barettes (ceinture noire avec bande rouge)' },
    { id: 27, grade: 'ceinture noire six barettes (ceinture noire avec bande rouge)' },
    { id: 28, grade: 'ceinture noire sept barettes (ceinture rouge et noire)' },
    { id: 29, grade: 'ceinture noire huit barettes (ceinture rouge et noire)' },
    { id: 30, grade: 'ceinture noire neuf barettes (ceinture rouge)' },
    { id: 31, grade: 'ceinture noire dix barettes (ceinture rouge)' }
  ]
};

async function seedTable(connection, tableName, data) {
  try {
    console.log(`\n🌱 Seeding table: ${tableName}...`);

    // Désactiver les vérifications FK temporairement
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Vider la table
    await connection.query(`TRUNCATE TABLE ${tableName}`);
    console.log(`   ✓ Table ${tableName} vidée`);

    // Insérer les données
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

      for (const row of data) {
        const values = columns.map(col => row[col]);
        await connection.query(insertQuery, values);
      }

      console.log(`   ✓ ${data.length} ligne(s) insérée(s) dans ${tableName}`);
    }

    // Réactiver les vérifications FK
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  } catch (error) {
    console.error(`   ✗ Erreur lors du seed de ${tableName}:`, error.message);
    throw error;
  }
}

async function verifyData(connection) {
  console.log('\n📊 Vérification des données insérées...\n');

  const tables = ['genres', 'plans_tarifaires', 'status', 'grades'];

  for (const table of tables) {
    const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(`   ${table}: ${rows[0].count} ligne(s)`);
  }
}

async function main() {
  console.log('🚀 Démarrage du seed de la base de données de test...');
  console.log(`📦 Base de données: ${config.database}`);
  console.log(`🖥️  Host: ${config.host}:${config.port}`);
  console.log(`👤 User: ${config.user}`);

  let connection;

  try {
    // Créer la connexion
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion à la base de données établie');

    // Seed des tables dans l'ordre (pour respecter les FK si nécessaire)
    await seedTable(connection, 'genres', seedData.genres);
    await seedTable(connection, 'plans_tarifaires', seedData.plans_tarifaires);
    await seedTable(connection, 'status', seedData.status);
    await seedTable(connection, 'grades', seedData.grades);

    // Vérification
    await verifyData(connection);

    console.log('\n✅ Seed de la base de données de test terminé avec succès ! 🎉\n');

  } catch (error) {
    console.error('\n❌ Erreur lors du seed:', error.message);
    console.error('\nDétails:', error);
    process.exit(1);

  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée\n');
    }
  }
}

// Exécution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { seedData, main };
