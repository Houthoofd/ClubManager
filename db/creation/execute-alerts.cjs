const fs = require('fs');
const { execSync } = require('child_process');

const sql = fs.readFileSync('db_alerts_system.sql', 'utf8');

// Split par DELIMITER pour gérer les procédures stockées
const statements = sql.split(/DELIMITER\s+\/\//);

console.log('Exécution du script SQL...');

try {
  // Exécuter chaque partie
  statements.forEach((stmt, index) => {
    if (stmt.trim()) {
      const cleanStmt = stmt.replace(/DELIMITER\s+;/g, '').trim();
      if (cleanStmt) {
        console.log(`Exécution partie ${index + 1}...`);
        fs.writeFileSync('temp_stmt.sql', cleanStmt);
        execSync('mysql -u root clubmanager < temp_stmt.sql', { encoding: 'utf8' });
      }
    }
  });
  
  fs.unlinkSync('temp_stmt.sql');
  console.log('✅ Tables alertes créées avec succès!');
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
