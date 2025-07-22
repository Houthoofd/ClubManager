import mysql from 'mysql';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('MYSQL_USER:', process.env.MYSQL_USER);
console.log('MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD);

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
