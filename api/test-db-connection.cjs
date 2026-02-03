/**
 * Script de test de connexion à la base de données
 * Usage: node test-db-connection.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.test' });

async function testConnection() {
  console.log('🔧 Test de connexion à la base de données...\n');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clubmanager_test',
  };

  console.log('📊 Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log('');

  let connection;

  try {
    // Tentative de connexion
    console.log('🔌 Connexion à MySQL...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion réussie!\n');

    // Test 1: Vérifier la base de données
    const [databases] = await connection.query('SHOW DATABASES');
    console.log(`📁 Bases de données disponibles: ${databases.length}`);

    const testDbExists = databases.some(db => db.Database === config.database);
    if (testDbExists) {
      console.log(`✅ Base de test "${config.database}" existe\n`);
    } else {
      console.log(`❌ Base de test "${config.database}" n'existe pas\n`);
      console.log('💡 Pour créer la base:');
      console.log(`   CREATE DATABASE ${config.database};`);
      return;
    }

    // Test 2: Vérifier la table paiements
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📋 Tables disponibles: ${tables.length}`);

    const tablesList = tables.map(t => Object.values(t)[0]);
    console.log('   -', tablesList.join('\n   - '));
    console.log('');

    const paiementsTableExists = tablesList.some(
      t => t.toLowerCase().includes('paiement')
    );

    if (paiementsTableExists) {
      console.log('✅ Table(s) paiements trouvée(s)\n');

      // Test 3: Compter les paiements
      try {
        const paiementTable = tablesList.find(
          t => t.toLowerCase() === 'paiements'
        );

        if (paiementTable) {
          const [countResult] = await connection.query(
            `SELECT COUNT(*) as count FROM ${paiementTable}`
          );
          const count = countResult[0].count;
          console.log(`📊 Nombre de paiements: ${count}`);

          if (count > 0) {
            // Récupérer un exemple
            const [sample] = await connection.query(
              `SELECT * FROM ${paiementTable} LIMIT 1`
            );
            console.log('📝 Exemple de paiement:');
            console.log(JSON.stringify(sample[0], null, 2));
          }
        }
      } catch (error) {
        console.log('⚠️  Impossible de lire les paiements:', error.message);
      }
    } else {
      console.log('⚠️  Aucune table paiements trouvée');
      console.log('💡 Les migrations doivent peut-être être exécutées');
    }

    console.log('\n✅ Test de connexion terminé avec succès!');

  } catch (error) {
    console.error('\n❌ Erreur de connexion:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 MySQL ne semble pas démarré. Vérifiez:');
      console.log('   - Windows: Ouvrir Services et démarrer MySQL');
      console.log('   - XAMPP: Démarrer MySQL dans le panneau XAMPP');
      console.log('   - Ligne de commande: net start MySQL80');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Accès refusé. Vérifiez:');
      console.log('   - Le nom d\'utilisateur (DB_USER)');
      console.log('   - Le mot de passe (DB_PASSWORD)');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log(`\n💡 La base "${config.database}" n'existe pas.`);
      console.log('   Créez-la avec: CREATE DATABASE clubmanager_test;');
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

// Exécuter le test
testConnection().catch(console.error);
