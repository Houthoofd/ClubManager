require('dotenv').config({ path: '.env.test' });
const mysql = require('mysql2/promise');

async function listAllTablesDetailed() {
  console.log('📊 Liste détaillée de TOUTES les tables de la base de données\n');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clubmanager_test'
  };

  console.log('🔧 Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.database}\n`);

  let connection;

  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion réussie!\n');

    // Get all tables with details
    const [tables] = await connection.execute(`
      SELECT
        TABLE_NAME,
        ENGINE,
        TABLE_ROWS,
        AVG_ROW_LENGTH,
        DATA_LENGTH,
        CREATE_TIME,
        UPDATE_TIME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [config.database]);

    console.log('═'.repeat(80));
    console.log(`📋 TOUTES LES TABLES DE LA BASE "${config.database}"`);
    console.log('═'.repeat(80));
    console.log();

    if (tables.length === 0) {
      console.log('⚠️  Aucune table trouvée!');
    } else {
      console.log(`✅ Nombre total de tables: ${tables.length}\n`);

      // Display in a numbered list
      tables.forEach((table, index) => {
        const num = String(index + 1).padStart(2, '0');
        const name = table.TABLE_NAME.padEnd(40, ' ');
        const rows = String(table.TABLE_ROWS || 0).padStart(6, ' ');
        const created = table.CREATE_TIME ? table.CREATE_TIME.toISOString().split('T')[0] : 'N/A';

        console.log(`   ${num}. ${name} | Lignes: ${rows} | Créée: ${created}`);
      });

      console.log();
      console.log('═'.repeat(80));

      // Group by category
      console.log('\n📂 TABLES PAR CATÉGORIE:\n');

      const categories = {
        'Utilisateurs & Auth': ['utilisateurs', 'auth_attempts', 'refresh_tokens', 'email_validation_tokens', 'validation_tokens', 'password_reset_tokens', 'password_reset_attempts', 'sms_recovery_codes', 'manual_recovery_requests', 'roles'],
        'Groupes': ['groupes', 'groupes_utilisateurs', 'utilisateurs_groupes'],
        'Cours & Professeurs': ['cours', 'cours_recurrent', 'cours_recurrents', 'cours_recurrent_professeur', 'inscriptions', 'reservations', 'professeurs', 'grades', 'status'],
        'Alertes': ['alertes', 'alertes_types', 'alertes_actions', 'alertes_utilisateurs'],
        'Messages': ['messages', 'message_status', 'messages_personnalises', 'types_messages_personnalises', 'notifications'],
        'Boutique': ['articles', 'categories', 'tailles', 'articles_tailles', 'images', 'stocks'],
        'Commandes': ['commandes', 'commande_articles', 'historique_statuts_commande'],
        'Paiements': ['paiements', 'echeances_paiements', 'plans_tarifaires', 'abonnements'],
        'Divers': ['genres', 'statistiques']
      };

      const allTableNames = tables.map(t => t.TABLE_NAME);

      Object.entries(categories).forEach(([category, tableList]) => {
        const foundTables = tableList.filter(t => allTableNames.includes(t));
        if (foundTables.length > 0) {
          console.log(`\n   ${category}:`);
          foundTables.forEach(t => {
            console.log(`      ✓ ${t}`);
          });
        }
      });

      // List uncategorized tables
      const categorizedTables = Object.values(categories).flat();
      const uncategorized = allTableNames.filter(t => !categorizedTables.includes(t));

      if (uncategorized.length > 0) {
        console.log(`\n   Autres:`);
        uncategorized.forEach(t => {
          console.log(`      ? ${t}`);
        });
      }

      console.log();
      console.log('═'.repeat(80));
      console.log();

      // Statistics
      const totalRows = tables.reduce((sum, t) => sum + (t.TABLE_ROWS || 0), 0);
      const totalSize = tables.reduce((sum, t) => sum + (t.DATA_LENGTH || 0), 0);
      const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

      console.log('📊 STATISTIQUES:');
      console.log(`   Tables: ${tables.length}`);
      console.log(`   Lignes totales: ${totalRows.toLocaleString()}`);
      console.log(`   Taille totale: ${sizeMB} MB`);
      console.log();

      // Tables with data
      const tablesWithData = tables.filter(t => t.TABLE_ROWS > 0);
      if (tablesWithData.length > 0) {
        console.log(`📦 TABLES CONTENANT DES DONNÉES (${tablesWithData.length}):`);
        tablesWithData
          .sort((a, b) => b.TABLE_ROWS - a.TABLE_ROWS)
          .forEach(t => {
            console.log(`   • ${t.TABLE_NAME.padEnd(40, ' ')} : ${t.TABLE_ROWS} ligne(s)`);
          });
      }
    }

    console.log();
    console.log('═'.repeat(80));
    console.log('\n💡 CONSEIL POUR HEIDISQL:');
    console.log('   1. Cliquez sur la base "clubmanager_test" dans le panneau de gauche');
    console.log('   2. Appuyez sur F5 ou clic droit → "Rafraîchir"');
    console.log('   3. Vous devriez voir toutes les 46 tables listées ci-dessus');
    console.log();

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée\n');
    }
  }
}

listAllTablesDetailed();
