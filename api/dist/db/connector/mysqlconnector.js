import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql';
// Pour __dirname dans ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Va chercher .env à la racine du projet
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
    connectionLimit: Number(process.env.DB_POOL_LIMIT) || 10,
});
export default class MysqlConnector {
    /**
     * Exécuter une requête SQL (hors transaction)
     */
    query(sql, values = [], callback) {
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
    /**
     * Démarrer une transaction
     * On renvoie la connexion pour exécuter les requêtes à l'intérieur
     */
    beginTransaction(callback) {
        pool.getConnection((err, connection) => {
            if (err) {
                callback(err);
                return;
            }
            connection.beginTransaction((beginErr) => {
                if (beginErr) {
                    connection.release();
                    callback(beginErr);
                    return;
                }
                callback(null, connection);
            });
        });
    }
    /**
     * Commit la transaction et libère la connexion
     */
    commit(connection, callback) {
        connection.commit((err) => {
            if (err) {
                return connection.rollback(() => {
                    connection.release();
                    if (callback)
                        callback(err);
                });
            }
            connection.release();
            if (callback)
                callback(null);
        });
    }
    /**
     * Rollback la transaction et libère la connexion
     */
    rollback(connection, callback) {
        connection.rollback(() => {
            connection.release();
            if (callback)
                callback();
        });
    }
    /**
     * Fermer le pool manuellement
     */
    close() {
        pool.end((err) => {
            if (err) {
                console.error('Erreur lors de la fermeture du pool : ' + err.stack);
                return;
            }
            console.log('Pool MySQL fermé');
        });
    }
}
