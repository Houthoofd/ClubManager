// Test rapide des fonctionnalités Phase 1
console.log('🧪 Test Phase 1 - Fonctionnalités créées\n');

// 1. Vérifier que les fichiers existent
const fs = require('fs');
const path = require('path');

const files = [
  'src/services/healthCheckService.ts',
  'src/services/auditService.ts',
  'src/services/rateLimitService.ts',
  'src/routes/health.ts',
  'src/middleware/auditLogger.ts',
  'src/middleware/rateLimiter.ts',
  'src/__tests__/isolation/tenant-isolation.test.ts',
  'src/__tests__/isolation/cross-tenant-access.test.ts',
];

console.log('✅ Vérification des fichiers créés :');
files.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✓' : '✗'} ${file}`);
});

// 2. Vérifier la table audit_logs
console.log('\n✅ Vérification base de données :');
const { execSync } = require('child_process');

try {
  const result = execSync(
    '"C:\laragon\bin\mysql\mysql-5.7.33-winx64\bin\mysql.exe" -u root clubmanager -e "SELECT COUNT(*) as count FROM audit_logs;"',
    { encoding: 'utf8' }
  );
  console.log('  ✓ Table audit_logs existe');
  console.log(result);
} catch (error) {
  console.log('  ✗ Erreur lors de la vérification de la table');
}

console.log('\n🎉 Tests de base terminés !');
console.log('\nPour tester complètement :');
console.log('1. Corriger les erreurs TypeScript dans le projet existant');
console.log('2. Démarrer le serveur : npm run dev');
console.log('3. Tester : curl http://localhost:5000/health');
