import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, 'logs');

// Liste tous les fichiers de log
function listLogFiles() {
  if (!fs.existsSync(LOG_DIR)) {
    console.log('No log directory found.');
    return [];
  }
  
  const files = fs.readdirSync(LOG_DIR)
    .filter(file => file.startsWith('test-log-'))
    .sort((a, b) => {
      // Trier par date, le plus récent en premier
      const statA = fs.statSync(path.join(LOG_DIR, a));
      const statB = fs.statSync(path.join(LOG_DIR, b));
      return statB.mtime.getTime() - statA.mtime.getTime();
    });
    
  return files;
}

// Lire un fichier de log
async function displayLog(fileName, filterErrors = false) {
  const filePath = path.join(LOG_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  console.log(`\n=== Log: ${fileName} ===\n`);
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  for await (const line of rl) {
    // Si filterErrors est vrai, n'afficher que les lignes contenant [ERROR]
    if (!filterErrors || line.includes('[ERROR]')) {
      console.log(line);
    }
  }
}

async function main() {
  const files = listLogFiles();
  
  if (files.length === 0) {
    console.log('No test logs found.');
    return;
  }
  
  console.log('Available test logs:');
  files.forEach((file, index) => {
    const stats = fs.statSync(path.join(LOG_DIR, file));
    console.log(`${index + 1}. ${file} (${stats.mtime.toLocaleString()})`);
  });
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nEnter the number of the log to view (or "e" to view only errors in the latest log): ', async (answer) => {
    if (answer.toLowerCase() === 'e' && files.length > 0) {
      // Afficher seulement les erreurs du dernier log
      await displayLog(files[0], true);
    } else {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < files.length) {
        await displayLog(files[index]);
      } else {
        console.log('Invalid selection.');
      }
    }
    rl.close();
  });
}

main();
