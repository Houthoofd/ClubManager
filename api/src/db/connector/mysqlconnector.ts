import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql';

// Pour __dirname dans ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(path.resolve(__dirname, '../../../'))

// Détermine quel fichier env charger
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

// Chemin racine du projet (remonte depuis api/src/db/connector)
const rootDir = path.resolve(__dirname, '../../../');
const envPath = path.resolve(rootDir, envFile);

// Vérifie si le fichier env existe
if (!fs.existsSync(envPath)) {
  console.warn(`⚠️  Fichier env introuvable : ${envPath}`);
} else {
  dotenv.config({ path: envPath });
  console.log(`✅  Fichier env chargé : ${envPath}`);
}

// Liste des variables critiques
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'STRIPE_SECRET_KEY'];

// En production, DB_PASSWORD devient obligatoire
if (process.env.NODE_ENV === 'production') {
  requiredVars.push('DB_PASSWORD');
}

// Vérifie que toutes les variables critiques sont bien définies
requiredVars.forEach(v => {
  if (!process.env[v]) {
    console.error(`❌ Variable d'environnement manquante : ${v}`);
  }
});

// Crée un pool MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
});

export default class MysqlConnector {
  public query(
    sql: string,
    values: any[] = [],
    callback: (error: mysql.MysqlError | null, results?: any, fields?: mysql.FieldInfo[]) => void
  ): void {
    pool.getConnection((err, connection) => {
      if (err) return callback(err);
      connection.query(sql, values, (error, results, fields) => {
        connection.release();
        callback(error, results, fields);
      });
    });
  }

  public beginTransaction(
    callback: (err: mysql.MysqlError | null, connection?: mysql.PoolConnection) => void
  ): void {
    // Test rapide de connexion au démarrage
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('❌ Impossible de se connecter à la base de données :', err.message);
      } else {
        console.log(`✅ Connecté à MySQL sur ${process.env.DB_HOST}/${process.env.DB_NAME}`);
        connection.release();
      }
    });
  }

  public commit(
    connection: mysql.PoolConnection,
    callback?: (err: mysql.MysqlError | null) => void
  ): void {
    connection.commit(err => {
      if (err) {
        return connection.rollback(() => {
          connection.release();
          if (callback) callback(err);
        });
      }
      connection.release();
      if (callback) callback(null);
    });
  }

  public rollback(connection: mysql.PoolConnection, callback?: () => void): void {
    connection.rollback(() => {
      connection.release();
      if (callback) callback();
    });
  }

  public close(): void {
    // Ne fermez le pool que lors de l'arrêt du serveur (ex: dans un handler SIGINT/SIGTERM)
    // Retirez l'appel automatique ici pour éviter "Pool is closed" lors des requêtes
    // Exemple d'utilisation correcte :
    // process.on('SIGINT', () => {
    //   pool.end(err => { 
    //     if(err) console.error(err); 
    //     else console.log('✅ Pool MySQL fermé'); 
    //     process.exit();
    //   });
    // });
  }
}
