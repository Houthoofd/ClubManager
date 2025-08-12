import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');

// Chemin vers le fichier jest.config.js
const jestConfigPath = path.join(apiRoot, 'jest.config.js');

async function main() {
  console.log('🔧 Correction de la configuration Jest pour résoudre les problèmes de chemins de modules...');

  try {
    // Lire le fichier de configuration Jest actuel
    let jestConfigContent = await fs.readFile(jestConfigPath, 'utf-8');

    // Vérifier si le fichier contient déjà une configuration de moduleNameMapper
    if (jestConfigContent.includes('moduleNameMapper')) {
      console.log('⚠️ Une configuration moduleNameMapper existe déjà. Mise à jour...');
      
      // Remplacer la configuration existante par la nouvelle
      jestConfigContent = jestConfigContent.replace(
        /(moduleNameMapper\s*:\s*{[^}]*})/s,
        `moduleNameMapper: {
    // Résoudre les importations .js (important pour ESM)
    "^(.*)\\.js$": "$1",
    // Conserver d'autres mappers si nécessaire
    "@clubmanager/(.*)": "<rootDir>/../packages/$1/src"
  }`
      );
    } else {
      // Ajouter la configuration moduleNameMapper si elle n'existe pas
      console.log('➕ Ajout de la configuration moduleNameMapper...');
      
      // Trouver l'endroit où insérer la configuration (juste avant la dernière accolade fermante)
      const lastBraceIndex = jestConfigContent.lastIndexOf('}');
      
      if (lastBraceIndex !== -1) {
        jestConfigContent = 
          jestConfigContent.substring(0, lastBraceIndex) +
          `,
  // Configuration pour résoudre les importations .js (important pour ESM)
  moduleNameMapper: {
    "^(.*)\\.js$": "$1",
    "@clubmanager/(.*)": "<rootDir>/../packages/$1/src"
  }
` +
          jestConfigContent.substring(lastBraceIndex);
      } else {
        throw new Error("Format de fichier Jest inattendu. Impossible d'ajouter la configuration.");
      }
    }

    // Écrire la configuration mise à jour
    await fs.writeFile(jestConfigPath, jestConfigContent, 'utf-8');
    console.log('✅ Configuration Jest mise à jour avec succès!');

    // Vérifier et corriger le fichier jest-setup-improved.ts si nécessaire
    const setupFilePath = path.join(apiRoot, 'src', '__tests__', 'setup', 'jest-setup-improved.ts');
    if (await fileExists(setupFilePath)) {
      console.log('🔍 Vérification du fichier de configuration de test...');
      
      let setupContent = await fs.readFile(setupFilePath, 'utf-8');
      
      // Vérifier si le fichier contient la référence problématique à app.js
      if (setupContent.includes("jest.mock('../../app.js")) {
        console.log('🔧 Correction des références dans le fichier de configuration de test...');
        
        // Remplacer la référence pour utiliser un chemin sans extension .js
        setupContent = setupContent.replace(
          "jest.mock('../../app.js",
          "jest.mock('../../app"
        );
        
        await fs.writeFile(setupFilePath, setupContent, 'utf-8');
        console.log('✅ Fichier de configuration de test corrigé!');
      }
    }
    
    console.log('\n📋 Résumé des modifications:');
    console.log('1. Ajout de moduleNameMapper pour résoudre les importations .js');
    console.log('2. Correction des références à app.js dans les fichiers de test');
    console.log('\n🚀 Vous pouvez maintenant exécuter les tests avec: npm run test:windows');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la configuration Jest:', error);
  }
}

// Fonction utilitaire pour vérifier si un fichier existe
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Exécuter la fonction principale
main().catch(console.error);
