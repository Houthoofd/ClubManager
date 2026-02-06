require('dotenv').config({ path: '.env.test' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function recreateTestDatabase() {
  console.log('🔄 Recréation complète de la base de données de test...\n');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  console.log('📊 Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}\n`);

  let connection;

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'scripts', 'recreate-complete-test-db.sql');

    if (!fs.existsSync(sqlPath)) {
      console.error('❌ Fichier recreate-complete-test-db.sql introuvable!');
      console.log('💡 Emplacement attendu:', sqlPath);
      process.exit(1);
    }

    console.log('📄 Lecture du script SQL...');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('   ✅ Script chargé\n');

    // Connect to MySQL (without database selection)
    console.log('🔌 Connexion à MySQL...');
    connection = await mysql.createConnection(config);
    console.log('   ✅ Connexion réussie!\n');

    console.log('🗑️  Suppression de l\'ancienne base (si existante)...');
    console.log('🏗️  Création de la nouvelle base...');
    console.log('📋 Création des tables...');
    console.log('🔗 Ajout des contraintes...');
    console.log('🌱 Insertion des données de base...\n');

    // Execute the entire script
    const [results] = await connection.query(sqlContent);

    console.log('═'.repeat(60));
    console.log('✅ BASE DE DONNÉES RECRÉÉE AVEC SUCCÈS!');
    console.log('═'.repeat(60));

    // Connect to the new database to verify
    await connection.changeUser({ database: 'clubmanager_test' });

    const [tables] = await connection.execute(
      'SELECT COUNT(*) as count FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
      ['clubmanager_test']
    );

    const tableCount = tables[0].count;

    console.log('\n📊 RÉSUMÉ:');
    console.log(`   Base de données: clubmanager_test`);
    console.log(`   Tables créées: ${tableCount}`);
    console.log(`   Encodage: utf8mb4_unicode_ci`);

    // Show some statistics
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM utilisateurs');
    const [genres] = await connection.execute('SELECT COUNT(*) as count FROM genres');
    const [grades] = await connection.execute('SELECT COUNT(*) as count FROM grades');
    const [status] = await connection.execute('SELECT COUNT(*) as count FROM status');
    const [alertTypes] = await connection.execute('SELECT COUNT(*) as count FROM alertes_types');

    console.log('\n📦 DONNÉES INSÉRÉES:');
    console.log(`   Utilisateurs: ${users[0].count}`);
    console.log(`   Genres: ${genres[0].count}`);
    console.log(`   Grades: ${grades[0].count}`);
    console.log(`   Status: ${status[0].count}`);
    console.log(`   Types d'alertes: ${alertTypes[0].count}`);

    console.log('\n✨ La base de données est prête pour les tests!');
    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('   1. Vérifier: node api/check-missing-tables.cjs');
    console.log('   2. Lancer les tests: npm run test:professeurs:all');

  } catch (error) {
    console.error('\n❌ ERREUR lors de la recréation de la base de données');
    console.error(`   Message: ${error.message}`);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    if (error.sqlMessage) {
      console.error(`   SQL: ${error.sqlMessage}`);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Interruption par l\'utilisateur');
  process.exit(0);
});

console.log('═'.repeat(60));
console.log('   RECRÉATION DE LA BASE DE DONNÉES DE TEST');
console.log('═'.repeat(60));
console.log();

recreateTestDatabase();
