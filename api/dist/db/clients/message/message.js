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
                console.log("Exécution de la requête pour obtenir les statuts");
                mysqlConnector.query(query, params, (error, results) => {
                    if (error) {
                        console.error('Erreur lors de la récupération des statuts : ' + error.message);
                        reject(error);
                    }
                    else {
                        console.log('Statuts récupérés avec succès :', results);
                        resolve(results); // retourne les statuts obtenus
                    }
                    // Fermer la connexion après avoir traité les résultats
                    mysqlConnector.close();
                });
            });
        });
    }
}
