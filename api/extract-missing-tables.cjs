const fs = require('fs');
const path = require('path');

const MISSING_TABLES = [
  'alertes_actions',
  'alertes_utilisateurs',
  'cours_recurrent',
  'cours_recurrent_professeur',
  'email_validation_tokens',
  'groupes_utilisateurs',
  'manual_recovery_requests',
  'message_status',
  'messages_personnalises',
  'password_reset_attempts',
  'password_reset_tokens',
  'plans_tarifaires',
  'professeurs',
  'refresh_tokens',
  'reservations',
  'sms_recovery_codes',
  'statistiques',
  'types_messages_personnalises',
  'validation_tokens'
];

console.log('🔍 Extraction des tables manquantes...\n');

// Read the full SQL file
const fullSqlPath = path.join(__dirname, '..', 'create-missing-tables.sql');
const outputPath = path.join(__dirname, '..', 'create-only-missing-tables.sql');

if (!fs.existsSync(fullSqlPath)) {
  console.error('❌ Fichier create-missing-tables.sql introuvable!');
  process.exit(1);
}

const fullSql = fs.readFileSync(fullSqlPath, 'utf8');

// Split by CREATE TABLE statements
const statements = fullSql.split(/-- CreateTable\s*\n/);

let extractedSql = `-- ============================================================
-- Script de création des tables manquantes
-- Généré automatiquement le ${new Date().toISOString()}
-- ============================================================
-- Tables à créer: ${MISSING_TABLES.length}
-- ============================================================

`;

let foundTables = [];
let notFoundTables = [];

MISSING_TABLES.forEach(tableName => {
  console.log(`🔍 Recherche de la table: ${tableName}`);

  // Find the statement that creates this table
  const statement = statements.find(s => {
    const match = s.match(/CREATE TABLE `(\w+)`/);
    return match && match[1] === tableName;
  });

  if (statement) {
    console.log(`   ✅ Trouvée`);
    foundTables.push(tableName);
    extractedSql += `-- CreateTable: ${tableName}\n`;
    extractedSql += statement.trim() + '\n\n';
  } else {
    console.log(`   ❌ Non trouvée`);
    notFoundTables.push(tableName);
  }
});

// Add foreign keys section if present
const foreignKeysMatch = fullSql.match(/(-- AddForeignKey[\s\S]*)/);
if (foreignKeysMatch) {
  const allForeignKeys = foreignKeysMatch[1];
  const foreignKeyStatements = allForeignKeys.split(/-- AddForeignKey\s*\n/);

  extractedSql += `\n-- ============================================================\n`;
  extractedSql += `-- Foreign Keys pour les tables manquantes\n`;
  extractedSql += `-- ============================================================\n\n`;

  foreignKeyStatements.forEach(fk => {
    if (!fk.trim()) return;

    // Check if this foreign key is for one of our missing tables
    const tableName = fk.match(/ALTER TABLE `(\w+)`/);
    if (tableName && MISSING_TABLES.includes(tableName[1])) {
      extractedSql += `-- AddForeignKey\n${fk.trim()}\n\n`;
    }
  });
}

// Write the extracted SQL
fs.writeFileSync(outputPath, extractedSql, 'utf8');

console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ:');
console.log(`   Tables recherchées: ${MISSING_TABLES.length}`);
console.log(`   Tables trouvées: ${foundTables.length}`);
console.log(`   Tables non trouvées: ${notFoundTables.length}`);
console.log('='.repeat(60));

if (notFoundTables.length > 0) {
  console.log('\n⚠️  Tables non trouvées:');
  notFoundTables.forEach(t => console.log(`   - ${t}`));
}

console.log(`\n✅ Script généré: create-only-missing-tables.sql`);
console.log(`\n📝 Prochaines étapes:`);
console.log(`   1. Vérifier le fichier: create-only-missing-tables.sql`);
console.log(`   2. Exécuter dans HeidiSQL/Laragon`);
console.log(`   3. Vérifier avec: node api/check-missing-tables.cjs`);
