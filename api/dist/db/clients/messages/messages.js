import MysqlConnector from '../../connector/mysqlconnector.js';
export class Message {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    async envoyerMessage(utilisateur_id, contenu) {
        return new Promise((resolve, reject) => {
            const query = `
        INSERT INTO messages_personnalises (utilisateur_id, contenu)
        VALUES (?, ?)
      `;
            const params = [utilisateur_id, contenu];
            console.log("Exécution de la requête pour insérer un message");
            this.mysqlConnector.query(query, params, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l’insertion du message : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Message inséré avec succès :', results);
                    const confirmation = {
                        isConfirm: true,
                        message: "Le message à bien été enregistrée"
                    };
                    resolve(confirmation);
                }
            });
        });
    }
    async creerTypeMessage(title, content) {
        return new Promise((resolve, reject) => {
            const query = `
        INSERT INTO types_messages_personnalises (title, content)
        VALUES (?, ?)
      `;
            const params = [title, content];
            console.log("Exécution de la requête pour insérer un type de message personnalisé");
            this.mysqlConnector.query(query, params, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l’insertion du type de message personnalisé : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Type de message personnalisé inséré avec succès :', results);
                    const confirmation = {
                        isConfirm: true,
                        message: "Le type de message personnalisé a bien été enregistré"
                    };
                    resolve(confirmation);
                }
            });
        });
    }
    async obtenirTousLesTypesDeMessages() {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT * FROM types_messages_personnalises
      `;
            console.log("Exécution de la requête pour récupérer tous les types de message");
            this.mysqlConnector.query(query, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la requête pour récupérer tous les types de message : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Types de message personnalisés récupérés avec succès :', results);
                    const confirmation = {
                        isFind: true,
                        message: "Types de messages récupérés avec succès",
                        data: results
                    };
                    resolve(confirmation);
                }
            });
        });
    }
}
