require('dotenv').config({ path: '.env.test' });
const mysql = require('mysql2/promise');

const PRISMA_TABLES = [
  'alertes_actions',
  'alertes_types',
  'alertes_utilisateurs',
  'articles',
  'articles_tailles',
  'auth_attempts',
  'categories',
  'commande_articles',
  'commandes',
  'cours',
  'cours_recurrent',
  'cours_recurrent_professeur',
  'echeances_paiements',
  'email_validation_tokens',
  'genres',
  'grades',
  'groupes',
  'groupes_utilisateurs',
  'historique_statuts_commande',
  'images',
  'inscriptions',
  'manual_recovery_requests',
  'message_status',
  'messages',
  'messages_personnalises',
  'notifications',
  'paiements',
  'password_reset_attempts',
  'password_reset_tokens',
  'plans_tarifaires',
  'professeurs',
  'refresh_tokens',
  'reservations',
  'sms_recovery_codes',
  'statistiques',
  'status',
  'stocks',
  'tailles',
  'types_messages_personnalises',
  'utilisateurs',
  'validation_tokens'
];

async function checkMissingTables() {
  console.log('🔍 Vérification des tables manquantes...\n');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clubmanager_test'
  };

  console.log('📊 Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}\n`);

  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion réussie!\n');

    // Get existing tables
    const [rows] = await connection.execute(
      'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
      [config.database]
    );

    const existingTables = rows.map(row => row.TABLE_NAME);

    console.log(`📋 Tables dans Prisma schema: ${PRISMA_TABLES.length}`);
    console.log(`📋 Tables dans la base de données: ${existingTables.length}\n`);

    // Find missing tables
    const missingTables = PRISMA_TABLES.filter(table => !existingTables.includes(table));

    // Find extra tables (in DB but not in Prisma)
    const extraTables = existingTables.filter(table => !PRISMA_TABLES.includes(table));

    if (missingTables.length > 0) {
      console.log(`❌ Tables MANQUANTES (${missingTables.length}):`);
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log();
    } else {
      console.log('✅ Aucune table manquante!\n');
    }

    if (extraTables.length > 0) {
      console.log(`⚠️  Tables SUPPLÉMENTAIRES dans la DB (${extraTables.length}):`);
      extraTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log();
    }

    // Show all existing tables
    console.log('📊 Tables EXISTANTES:');
    existingTables.sort().forEach(table => {
      const status = PRISMA_TABLES.includes(table) ? '✅' : '⚠️ ';
      console.log(`   ${status} ${table}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('📈 RÉSUMÉ:');
    console.log(`   Tables attendues (Prisma): ${PRISMA_TABLES.length}`);
    console.log(`   Tables existantes (DB): ${existingTables.length}`);
    console.log(`   Tables manquantes: ${missingTables.length}`);
    console.log(`   Tables supplémentaires: ${extraTables.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

checkMissingTables();
