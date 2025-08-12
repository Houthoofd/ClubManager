import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');
const testsDir = path.join(apiRoot, 'src', '__tests__');

async function fixSyntaxErrors() {
  console.log('🔍 Recherche des fichiers de test avec des erreurs de syntaxe...');
  
  // Récupérer les chemins des fichiers
  const coursTestPath = path.join(testsDir, 'db', 'clients', 'cours', 'cours.test.ts');
  const informationsTestPath = path.join(testsDir, 'db', 'clients', 'informations', 'informations.test.ts');
  
  try {
    // Lire et nettoyer les fichiers
    await cleanUpFile(coursTestPath);
    await cleanUpFile(informationsTestPath);
    
    console.log('✅ Correction des erreurs de syntaxe terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

async function cleanUpFile(filePath) {
  try {
    console.log(`🔧 Traitement du fichier: ${filePath}`);
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Ajouter l'import jest s'il est manquant
    if (!content.includes("import { jest }")) {
      content = `import { jest } from '@jest/globals';\n${content}`;
    }
    
    // Nettoyer les accolades et parenthèses non équilibrées
    content = balanceParentheses(content);
    
    // Écrire le fichier mis à jour
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✅ Fichier corrigé: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erreur lors du nettoyage de ${filePath}:`, error);
  }
}

function balanceParentheses(text) {
  // Une méthode simpliste pour équilibrer les accolades et parenthèses
  // Cette méthode ne gère pas tous les cas mais peut résoudre les problèmes courants
  
  // Supprimer les accolades et parenthèses supplémentaires à la fin
  let cleanedText = text;
  const lines = text.split('\n');
  const lastNonEmptyLines = lines.filter(line => line.trim() !== '').slice(-5);
  
  // Vérifier et nettoyer les dernières lignes qui contiennent juste des accolades/parenthèses
  for (let i = lastNonEmptyLines.length - 1; i >= 0; i--) {
    const line = lastNonEmptyLines[i];
    if (line.trim() === '});' || line.trim() === '});') {
      // On garde un seul '});' à la fin
      cleanedText = cleanedText.replace(/\}\)\;\s*\}\)\;\s*$/g, '});');
    }
  }
  
  return cleanedText;
}

// Exécuter la fonction principale
fixSyntaxErrors().catch(console.error);
