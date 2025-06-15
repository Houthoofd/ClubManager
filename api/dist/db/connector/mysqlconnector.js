import mysql from 'mysql';
export default class MysqlConnector {
    constructor() {
        // Configuration de la connexion à la base de données MySQL
        this.connection = mysql.createConnection({
            host: 'localhost', // Remplacez par votre endpoint RDS
            port: 3306, // Le port par défaut pour MySQL
            user: 'root', // Remplacez par votre nom d'utilisateur RDS
            password: '', // Remplacez par votre mot de passe RDS
            database: 'clubmanager',
        });
        // Établir la connexion à la base de données
        this.connection.connect((err) => {
            if (err) {
                console.error('Erreur de connexion à la base de données : ' + err.stack);
                return;
            }
            console.log('Connecté à la base de données MySQL avec l\'ID : ' + this.connection.threadId);
        });
    }
    // Méthode pour exécuter des requêtes SQL
    query(sql, values = [], callback) {
        this.connection.query(sql, values, (error, results, fields) => {
            callback(error, results, fields);
        });
    }
    // Démarrer une transaction
    beginTransaction(callback) {
        this.connection.beginTransaction(callback);
    }
    // Commit une transaction
    commit(callback) {
        this.connection.commit(callback);
    }
    // Rollback une transaction
    rollback(callback) {
        this.connection.rollback(callback);
    }
    // Fermer la connexion
    close() {
        this.connection.end((err) => {
            if (err) {
                console.error('Erreur lors de la fermeture de la connexion : ' + err.stack);
                return;
            }
            console.log('Connexion à la base de données MySQL fermée');
        });
    }
}
