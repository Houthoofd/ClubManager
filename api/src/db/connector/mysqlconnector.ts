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
const missingVars = requiredVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Variables d'environnement manquantes : ${missingVars.join(', ')}`);
}

// Configuration du pool MySQL améliorée
const poolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 15,
  acquireTimeout: Number(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
  timeout: Number(process.env.DB_TIMEOUT) || 60000,
  reconnect: true,
  multipleStatements: false
};

// Crée un pool MySQL avec configuration robuste
const pool = mysql.createPool(poolConfig);

// Test de connexion initial et monitoring
pool.on('connection', (connection) => {
  console.log(`✅ Nouvelle connexion MySQL établie (ID: ${connection.threadId})`);
});

pool.on('error', (err) => {
  console.error('❌ Erreur du pool MySQL :', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Reconnexion automatique en cours...');
  }
});

// Monitoring du pool
let lastPoolStats = { total: 0, free: 0, used: 0 };
setInterval(() => {
  const stats = {
    total: (pool as any)._allConnections?.length || 0,
    free: (pool as any)._freeConnections?.length || 0,
    used: ((pool as any)._allConnections?.length || 0) - ((pool as any)._freeConnections?.length || 0)
  };
  
  // Log seulement si changement significatif
  if (stats.total !== lastPoolStats.total || stats.used > poolConfig.connectionLimit * 0.8) {
    console.log(`📊 Pool MySQL - Total: ${stats.total}, Utilisées: ${stats.used}, Libres: ${stats.free}`);
    if (stats.used > poolConfig.connectionLimit * 0.8) {
      console.warn('⚠️  Pool de connexions à plus de 80% de capacité !');
    }
  }
  lastPoolStats = stats;
}, 30000);

export default class MysqlConnector {
  private static instance: MysqlConnector;
  private isPoolHealthy: boolean = false;

  private constructor() {
    this.testConnection();
  }

  public static getInstance(): MysqlConnector {
    if (!MysqlConnector.instance) {
      MysqlConnector.instance = new MysqlConnector();
    }
    return MysqlConnector.instance;
  }

  private testConnection(): void {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('❌ Impossible de se connecter à la base de données :', err.message);
        this.isPoolHealthy = false;
      } else {
        console.log(`✅ Connecté à MySQL sur ${process.env.DB_HOST}/${process.env.DB_NAME}`);
        connection.release();
        this.isPoolHealthy = true;
      }
    });
  }

  public query(
    sql: string,
    values: any[] = [],
    callback: (error: mysql.MysqlError | null, results?: any, fields?: mysql.FieldInfo[]) => void
  ): void {
    if (!this.isPoolHealthy) {
      return callback(new Error('Pool de connexions non disponible') as mysql.MysqlError);
    }

    pool.getConnection((err, connection) => {
      if (err) {
        console.error('❌ Erreur lors de l\'acquisition de connexion :', err.message);
        return callback(err);
      }

      const queryTimeout = setTimeout(() => {
        connection.destroy();
        callback(new Error('Timeout de requête SQL') as mysql.MysqlError);
      }, poolConfig.timeout);

      connection.query(sql, values, (error, results, fields) => {
        clearTimeout(queryTimeout);
        connection.release();
        
        if (error) {
          console.error('❌ Erreur SQL :', error.message);
          console.error('Query :', sql);
        }
        
        callback(error, results, fields);
      });
    });
  }

  public beginTransaction(
    callback: (err: mysql.MysqlError | null, connection?: mysql.PoolConnection) => void
  ): void {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('❌ Erreur lors de l\'acquisition de connexion pour transaction :', err.message);
        return callback(err);
      }

      connection.beginTransaction((transErr) => {
        if (transErr) {
          connection.release();
          return callback(transErr);
        }
        callback(null, connection); // connection est définie ici
      });
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

  public getPoolStatus(): { total: number; free: number; used: number; healthy: boolean } {
    const total = (pool as any)._allConnections?.length || 0;
    const free = (pool as any)._freeConnections?.length || 0;
    return {
      total,
      free,
      used: total - free,
      healthy: this.isPoolHealthy
    };
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      pool.end((err) => {
        if (err) {
          console.error('❌ Erreur lors de la fermeture du pool :', err);
          reject(err);
        } else {
          console.log('✅ Pool MySQL fermé proprement');
          resolve();
        }
      });
    });
  }

  // Méthode pour setup le shutdown gracieux - NE PAS APPELER AUTOMATIQUEMENT
  public setupGracefulShutdown(): void {
    // Seulement configurer les handlers, ne pas fermer immédiatement
    const gracefulShutdown = async (signal: string) => {
      console.log(`🔄 Signal ${signal} reçu. Arrêt gracieux en cours...`);
      
      try {
        await this.close();
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
      } catch (error) {
        console.error('❌ Erreur lors de l\'arrêt :', error);
        process.exit(1);
      }
    };

    // Configurer les handlers pour les signaux d'arrêt
    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handler pour les erreurs non gérées
    process.on('uncaughtException', (error) => {
      console.error('❌ Exception non gérée :', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Rejet de promesse non géré :', reason);
      gracefulShutdown('unhandledRejection');
    });
  }
}
