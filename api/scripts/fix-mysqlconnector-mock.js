import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob'; // Correction: importation correcte avec destructuration
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');

async function fixMysqlConnectorMocks() {
  console.log('🔍 Recherche des fichiers de test utilisant mysqlconnector...');
  
  // Trouver tous les fichiers de test avec glob (promisifier n'est plus nécessaire avec la nouvelle API)
  const files = await glob('src/__tests__/**/*.test.ts', { cwd: apiRoot });
  let modifiedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(apiRoot, file);
    let content = await fs.readFile(filePath, 'utf8');
    
    // Vérifier si le fichier contient des mocks de mysqlconnector
    if (content.includes('mysqlconnector.js')) {
      // Vérifier si l'import jest existe
      if (!content.includes("import { jest }")) {
        content = `import { jest } from '@jest/globals';\n${content}`;
      }
      
      // Ajouter l'import de getMockConnector s'il n'est pas déjà présent
      if (!content.includes("import { getMockConnector }")) {
        content = content.replace(/^(import.*?;)(\n|$)/m, '$1\nimport { getMockConnector } from "../../setup/jest-setup-improved.js";\n');
      }
      
      // Remplacer le mock direct par notre helper
      content = content.replace(
        /jest\.mock\(['"].*?mysqlconnector\.js['"].*?\{[\s\S]*?\}\);/m,
        'jest.mock("../../../../db/connector/mysqlconnector.js", () => {\n  return { default: getMockConnector() };\n});'
      );
      
      await fs.writeFile(filePath, content, 'utf8');
      modifiedCount++;
      console.log(`✅ Fichier modifié: ${file}`);
    }
  }
  
  console.log(`✨ ${modifiedCount} fichiers de test ont été mis à jour.`);
}

fixMysqlConnectorMocks().catch(console.error);
fixMysqlConnectorMocks().catch(console.error);
