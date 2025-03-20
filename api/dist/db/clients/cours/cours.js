import MysqlConnector from '../../connector/mysqlconnector.js';
export class Cours {
    // Récupérer les grades
    obtenirLesCours() {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `SELECT * FROM cours LIMIT 12`;
            console.log("Exécution de la requête pour obtenir les cours");
            mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des cours : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('cours récupérés avec succès :', results);
                    resolve(results);
                }
                mysqlConnector.close();
            });
        });
    }
}
