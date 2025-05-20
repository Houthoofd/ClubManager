var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import MysqlConnector from '../../connector/mysqlconnector.js';
export class Message {
    envoyerMessage(utilisateur_id, contenu) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const mysqlConnector = new MysqlConnector();
                const query = `
        INSERT INTO messages_personnalises (utilisateur_id, contenu)
        VALUES (?, ?)
      `;
                const params = [utilisateur_id, contenu];
                console.log("Exécution de la requête pour insérer un message");
                mysqlConnector.query(query, params, (error, results) => {
                    // Fermer la connexion d'abord, avant toute réponse
                    mysqlConnector.close();
                    if (error) {
                        console.error('Erreur lors de l’insertion du message : ' + error.message);
                        reject(error);
                    }
                    else {
                        console.log('Message inséré avec succès :', results);
                        // Ici on peut préparer un "ConfirmationResult" propre
                        const confirmation = {
                            isConfirm: true,
                            message: "Le message à bien été enregistrée"
                        };
                        resolve(confirmation);
                    }
                });
            });
        });
    }
    creerTypeMessage(title, content) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const mysqlConnector = new MysqlConnector();
                const query = `
        INSERT INTO types_messages_personnalises (title, content)
        VALUES (?, ?)
      `;
                const params = [title, content];
                console.log("Exécution de la requête pour insérer un type de message personnalisé");
                mysqlConnector.query(query, params, (error, results) => {
                    mysqlConnector.close();
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
        });
    }
    obtenirTousLesTypesDeMessages() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const mysqlConnector = new MysqlConnector();
                const query = `
        SELECT * FROM types_messages_personnalises
      `;
                console.log("Exécution de la requête pour récupèrer tous les types de message");
                mysqlConnector.query(query, [], (error, results) => {
                    mysqlConnector.close();
                    if (error) {
                        console.error('Erreur lors de la requête pour récupèrer tous les types de message : ' + error.message);
                        reject(error);
                    }
                    else {
                        console.log('Types de message personnalisés récupérés avec succès :', results);
                        // Ici on renvoie les résultats dans le champ data
                        const confirmation = {
                            isFind: true,
                            message: "Types de messages récupérés avec succès",
                            data: results // ✅ On envoie les résultats ici
                        };
                        resolve(confirmation);
                    }
                });
            });
        });
    }
}
