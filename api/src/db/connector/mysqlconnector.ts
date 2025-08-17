import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql';

// Pour __dirname dans ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Va chercher .env à la racine du projet (../.. depuis /src/db/connector/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), debug: true });


console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);


// Crée un pool MySQL partagé pour limiter les connexions
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10 // Limite configurable via .env
});

export default class MysqlConnector {
  public query(
    sql: string,
    values: any[] = [],
    callback: (error: mysql.MysqlError | null, results?: any, fields?: mysql.FieldInfo[]) => void
  ): void {
    pool.getConnection((err, connection) => {
      if (err) {
        callback(err);
        return;
      }
      connection.query(sql, values, (error, results, fields) => {
        connection.release();
        callback(error, results, fields);
      });
    });
  }

  public beginTransaction(callback: (err: mysql.MysqlError | null) => void): void {
    pool.getConnection((err, connection) => {
      if (err) {
        callback(err);
        return;
      }
      connection.beginTransaction((beginErr) => {
        connection.release();
        callback(beginErr);
      });
    });
  }

  public commit(callback: (err: mysql.MysqlError | null) => void): void {
    // Transaction management should be handled per connection, not pool-wide
    // This method is kept for compatibility but should be managed in transaction context
    callback(null);
  }

  public rollback(callback: () => void): void {
    // Transaction management should be handled per connection, not pool-wide
    callback();
  }

  public close(): void {
    // Le pool gère la fermeture des connexions automatiquement
    // Pour fermer tout le pool (rarement nécessaire) :
    pool.end((err) => {
      if (err) {
        console.error('Erreur lors de la fermeture du pool : ' + err.stack);
        return;
      }
      console.log('Pool MySQL fermé');
    });
  }
}