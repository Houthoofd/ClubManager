/**
 * Configuration de la base de données de test pour les tests d'intégration
 * Copie la structure de la DB principale vers une DB de test séparée
 */

import { prisma } from '../../infrastructure/database/prisma-client.js';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement de test
dotenv.config({ path: join(__dirname, '../../../.env.test') });

// Charger aussi la config de dev pour connaître la DB source
const devEnvPath = join(__dirname, '../../../.env.development');
const devEnv: Record<string, string> = {};
if (fs.existsSync(devEnvPath)) {
  const content = fs.readFileSync(devEnvPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      devEnv[match[1].trim()] = match[2].trim();
    }
  });
}

let testPrisma: typeof prisma;

/**
 * Copier la structure de la DB principale vers la DB de test
 */
async function copyDatabaseStructure() {
  const sourceDB = devEnv.DB_NAME || 'clubmanager';
  const targetDB = process.env.DB_NAME || 'clubmanager_test';
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  
  console.log(`📋 Copie de la structure de '${sourceDB}' vers '${targetDB}'...`);
  
  const dumpFile = join(__dirname, 'temp_structure.sql');
  
  try {
    // Dump de la structure de la DB source (sans les données)
    console.log(`   Extraction de la structure de ${sourceDB}...`);
    const mysqldumpCmd = password
      ? `mysqldump -h${host} -u${user} -p${password} --no-data --skip-add-drop-table --skip-comments ${sourceDB}`
      : `mysqldump -h${host} -u${user} --no-data --skip-add-drop-table --skip-comments ${sourceDB}`;
    
    const dumpOutput = execSync(mysqldumpCmd, { encoding: 'utf8' });
    fs.writeFileSync(dumpFile, dumpOutput);
    
    // Importer la structure dans la DB de test
    console.log(`   Import de la structure dans ${targetDB}...`);
    const dumpContent = fs.readFileSync(dumpFile, 'utf8');
    const mysqlImportCmd = password
      ? `mysql -h${host} -u${user} -p${password} ${targetDB}`
      : `mysql -h${host} -u${user} ${targetDB}`;
    
    execSync(mysqlImportCmd, { input: dumpContent });
    
    // Nettoyer le fichier temporaire
    fs.unlinkSync(dumpFile);
    
    console.log('✅ Structure copiée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la copie de structure:', error);
    if (fs.existsSync(dumpFile)) {
      fs.unlinkSync(dumpFile);
    }
    throw error;
  }
}

/**
 * Initialiser la base de données de test
 */
export async function setupTestDatabase() {
  try {
    console.log('🔧 Configuration de la base de données de test...');
    
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const testDB = process.env.DB_NAME || 'clubmanager_test';
    
    // Supprimer et recréer la base de données de test
    console.log(`📦 Recréation de la base ${testDB}...`);
    try {
      // Si pas de mot de passe, ne pas utiliser -p
      const mysqlCmd = password 
        ? `mysql -h${host} -u${user} -p${password} -e "DROP DATABASE IF EXISTS ${testDB}; CREATE DATABASE ${testDB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`
        : `mysql -h${host} -u${user} -e "DROP DATABASE IF EXISTS ${testDB}; CREATE DATABASE ${testDB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`;
      
      execSync(mysqlCmd, { stdio: 'pipe' });
    } catch (error) {
      console.error('❌ Erreur lors de la création de la DB:', error);
      throw error;
    }

    // Copier la structure de la DB principale
    await copyDatabaseStructure();

    // Utiliser l'instance prisma existante (déjà connectée à clubmanager_test via .env.test)
    testPrisma = prisma;

    console.log('✅ Base de données de test prête');
    
    return testPrisma;
  } catch (error) {
    console.error('❌ Erreur lors du setup de la DB de test:', error);
    throw error;
  }
}

/**
 * Nettoyer la base de données de test
 */
export async function cleanupTestDatabase() {
  if (!testPrisma) return;

  try {
    console.log('🧹 Nettoyage de la base de données de test...');
    
    // Désactiver les contraintes de clés étrangères
    await testPrisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
    
    // Truncate toutes les tables importantes
    const tables = [
      'alertes_utilisateurs',
      'alertes_types',
      'utilisateurs',
      'commandes',
      'inscriptions',
      'paiements'
    ];
    
    for (const table of tables) {
      try {
        await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${table}`);
      } catch (error) {
        // Table peut ne pas exister, on continue
        console.warn(`⚠️ Impossible de truncate ${table}:`, error);
      }
    }
    
    // Réactiver les contraintes
    await testPrisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Base de données nettoyée');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

/**
 * Fermer la connexion à la base de données de test
 */
export async function teardownTestDatabase() {
  if (!testPrisma) return;
  
  try {
    // Prisma gère automatiquement la déconnexion
    console.log('✅ Connexion à la DB de test fermée');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture:', error);
    throw error;
  }
}

/**
 * Obtenir l'instance Prisma pour les tests
 */
export function getTestPrisma() {
  if (!testPrisma) {
    throw new Error('La base de données de test n\'est pas initialisée. Appelez setupTestDatabase() d\'abord.');
  }
  return testPrisma;
}

/**
 * Seed de données de test pour les alertes
 */
export async function seedTestAlertes() {
  const prismaInstance = getTestPrisma();
  
  console.log('🌱 Seed des données de test pour les alertes...');
  
  // Créer des types d'alertes
  await prismaInstance.alertes_types.createMany({
    data: [
      {
        id: 1,
        code: 'COMPTE_INCOMPLET',
        nom: 'Compte incomplet',
        description: 'Profil utilisateur incomplet',
        priorite: 'haute',
        actif: true
      },
      {
        id: 2,
        code: 'PAIEMENT_RETARD',
        nom: 'Paiement en retard',
        description: 'Paiement en retard',
        priorite: 'moyenne',
        actif: true
      },
      {
        id: 3,
        code: 'PAIEMENT_CRITIQUE',
        nom: 'Paiement critique',
        description: 'Paiement très en retard',
        priorite: 'critique',
        actif: true
      }
    ],
    skipDuplicates: true
  });
  
  // Créer des utilisateurs de test
  await prismaInstance.utilisateurs.createMany({
    data: [
      {
        id: 1,
        first_name: 'Jean',
        last_name: 'Test',
        email: 'jean.test@test.com',
        password: 'hashed_password',
        status_id: 1
      },
      {
        id: 2,
        first_name: 'Marie',
        last_name: 'Test',
        email: 'marie.test@test.com',
        password: 'hashed_password',
        status_id: 1
      }
    ],
    skipDuplicates: true
  });
  
  // Créer des alertes de test
  await prismaInstance.alertes_utilisateurs.createMany({
    data: [
      {
        utilisateur_id: 1,
        alerte_type_id: 1,
        statut: 'active',
        date_detection: new Date('2026-01-20'),
        donnees_contexte: { champsManquants: ['email'] }
      },
      {
        utilisateur_id: 2,
        alerte_type_id: 3,
        statut: 'active',
        date_detection: new Date('2026-01-15'),
        donnees_contexte: { joursRetard: 45, montantTotal: '150.00' }
      }
    ],
    skipDuplicates: true
  });
  
  console.log('✅ Seed terminé');
}
