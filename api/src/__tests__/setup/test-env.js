import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../../');

// Charger les variables d'environnement de test
dotenv.config({ 
  path: path.resolve(rootDir, '.env.test'),
  override: true
});

console.log('Test environment loaded:', {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
});
