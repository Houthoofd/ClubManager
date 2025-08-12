import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');
const testsDir = path.join(apiRoot, 'src', '__tests__');

async function fixTestFiles() {
  console.log('🔍 Recherche des fichiers de test à corriger...');
  
  // Récupérer tous les fichiers de test de manière récursive
  const testFiles = await getAllFiles(testsDir);
  const filesToFix = [];
  
  console.log(`📊 Analyse de ${testFiles.length} fichiers de test...`);
  
  // Parcourir les fichiers pour trouver ceux qui utilisent jest sans l'importer
  for (const filePath of testFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Vérifie si le fichier utilise jest mais ne l'importe pas
    if (content.includes('jest.mock(') && !content.includes("import { jest }")) {
      filesToFix.push(filePath);
    }
  }
  
  console.log(`🔧 Correction de ${filesToFix.length} fichiers de test...`);
  
  // Corriger chaque fichier
  for (const filePath of filesToFix) {
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      
      // Ajouter l'import jest en haut du fichier
      content = `import { jest } from '@jest/globals';\n${content}`;
      
      // Écrire le fichier mis à jour
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`✅ Fichier corrigé: ${filePath}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la correction de ${filePath}:`, error);
    }
  }
  
  console.log('✨ Correction terminée!');
}

// Fonction récursive pour obtenir tous les fichiers .ts dans un répertoire
async function getAllFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...await getAllFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && entry.name.includes('test')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Exécuter la fonction principale
fixTestFiles().catch(console.error);
