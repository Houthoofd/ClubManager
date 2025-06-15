import MysqlConnector from '../../connector/mysqlconnector.js'; // Ton connecteur MySQL
export class Statistiques {
    // Méthode pour obtenir les présences par mois pour un utilisateur spécifique
    obtenirPresenceParMois(userId) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector(); // Création d'une instance de connexion MySQL
            const query = `
      SELECT u.last_name, u.first_name, MONTH(c.date_cours) AS mois,
        CASE MONTH(c.date_cours)
          WHEN 1 THEN 'Janvier'
          WHEN 2 THEN 'Février'
          WHEN 3 THEN 'Mars'
          WHEN 4 THEN 'Avril'
          WHEN 5 THEN 'Mai'
          WHEN 6 THEN 'Juin'
          WHEN 7 THEN 'Juillet'
          WHEN 8 THEN 'Août'
          WHEN 9 THEN 'Septembre'
          WHEN 10 THEN 'Octobre'
          WHEN 11 THEN 'Novembre'
          WHEN 12 THEN 'Décembre'
        END AS nom_mois,
        c.type_cours, COUNT(i.id) AS total_presences
      FROM inscriptions i
      JOIN cours c ON i.cours_id = c.id
      JOIN utilisateurs u ON i.utilisateur_id = u.id
      WHERE i.status_id = 1
        AND i.utilisateur_id = ?
      GROUP BY u.last_name, u.first_name, mois, c.type_cours
      ORDER BY u.last_name, u.first_name, mois, c.type_cours;
      `;
            const values = [userId]; // Remplace le paramètre `userId` dans la requête
            console.log("Exécution de la requête pour obtenir les présences par mois pour l'utilisateur.");
            mysqlConnector.query(query, values, (err, results) => {
                if (err) {
                    console.error('Erreur lors de l\'exécution de la requête : ' + err.message);
                    mysqlConnector.close(); // Assure la fermeture de la connexion même en cas d'erreur
                    reject({ message: 'Erreur lors de l\'exécution de la requête.', error: err.message });
                }
                else {
                    console.log('Résultats obtenus avec succès');
                    mysqlConnector.close(); // Fermeture de la connexion après récupération des résultats
                    resolve(results); // Résout la promesse avec les résultats obtenus
                }
            });
        });
    }
    // Méthode pour formater les résultats récupérés
    formatPresenceData(data) {
        const formatted = {};
        data.forEach((item) => {
            const { nom_mois, type_cours, total_presences } = item;
            if (!formatted[nom_mois]) {
                formatted[nom_mois] = {};
            }
            formatted[nom_mois][type_cours] = total_presences;
        });
        return formatted;
    }
}
