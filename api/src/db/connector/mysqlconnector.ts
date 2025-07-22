import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql';

// Pour __dirname dans ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Va chercher .env à la racine du projet (../.. depuis /src/db/connector/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), debug: true });


export default class MysqlConnector {
  private connection: mysql.Connection;

  constructor() {
    this.connection = mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    this.connection.connect((err) => {
      if (err) {
        console.error('Erreur de connexion à la base de données : ' + err.stack);
        return;
      }
      console.log('Connecté à la base de données MySQL avec l\'ID : ' + this.connection.threadId);
    });
  }

  public query(
    sql: string,
    values: any[] = [],
    callback: (error: mysql.MysqlError | null, results?: any, fields?: mysql.FieldInfo[]) => void
  ): void {
    this.connection.query(sql, values, (error, results, fields) => {
      callback(error, results, fields);
    });
  }

  public beginTransaction(callback: (err: mysql.MysqlError | null) => void): void {
    this.connection.beginTransaction(callback);
  }

  public commit(callback: (err: mysql.MysqlError | null) => void): void {
    this.connection.commit(callback);
  }

  public rollback(callback: () => void): void {
    this.connection.rollback(callback);
  }

  public close(): void {
    this.connection.end((err) => {
      if (err) {
        console.error('Erreur lors de la fermeture de la connexion : ' + err.stack);
        return;
      }
      console.log('Connexion à la base de données MySQL fermée');
    });
  }
}
