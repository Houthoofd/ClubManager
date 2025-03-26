import MysqlConnector from '../../connector/mysqlconnector.js';
import { UserData, VerifyResultWithData } from '@clubmanager/types';

export class Compte{
  obtenirUnUtilisateurParSonNomEtPrenom(prenom: string, nom: string): Promise<VerifyResultWithData> {
    console.log(prenom, nom);
    try {
      const mysqlConnector = new MysqlConnector();
  
      // Construire la requête SQL
      const sql = 'SELECT * FROM utilisateurs WHERE first_name = ? AND last_name = ?';
      const values = [prenom, nom];
  
      // Retourner une promesse
      return new Promise<VerifyResultWithData>((resolve, reject) => {
        mysqlConnector.query(sql, values, async (error, results) => {
          if (error) {
            console.error("Erreur lors de la récupération de l'utilisateur : " + error.message);
            reject(error); // Rejeter la promesse en cas d'erreur
          } else {
            if (results.length > 0) {
              console.log('Utilisateur trouvé avec succès.');
  
              // Mapper les résultats pour correspondre au type UserData
              const utilisateur: UserData[] = results.map((result: any) => ({
                id: result.id,
                prenom: result.first_name,
                nom: result.last_name,
                nom_utilisateur: result.nom_utilisateur,
                email: result.email,
                password: result.password,
                genre_id: result.genre_id,
                date_of_birth: result.date_of_birth,
                status_id: result.status_id,
                grade_id: result.grade_id,
                abonnement_id: result.abonnement_id
              }));
  
              try {
                // Récupérer les informations supplémentaires de l'utilisateur
                const informations = await this.obtenirInformationsUtilisateur(utilisateur[0].prenom, utilisateur[0].nom);
                resolve({
                  isFind: true,
                  message: "Utilisateur trouvé",
                  data: informations // Retourner les informations récupérées
                });
              } catch (infoError) {
                reject(infoError); // Gérer une erreur lors de la récupération des informations supplémentaires
              }
  
            } else {
              console.log('Aucun utilisateur trouvé.');
              resolve({
                isFind: false,
                message: "Aucun utilisateur trouvé",
                data: [] // Retourner un tableau vide si aucun utilisateur n'est trouvé
              });
            }
          }
        });
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      throw error; // Lever l'erreur pour que l'appelant puisse la gérer
    }
  }
  

  obtenirInformationsUtilisateur = async (prenom: string, nom: string): Promise<VerifyResultWithData> => {
    try {
      const mysqlConnector = new MysqlConnector();
  
      // Requête SQL pour récupérer les informations en fonction des IDs liés
      const sql = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.nom_utilisateur,
          u.email,
          u.password,
          g.genre_name AS genres,  
          s.nom_role AS status,  
          gr.grade_id AS grades,  
          a.nom_plan AS abonnement,  
          u.date_of_birth
        FROM 
          utilisateurs u
        JOIN 
          genres g ON u.genre_id = g.id  
        JOIN 
          status s ON u.status_id = s.id  
        JOIN 
          grades gr ON u.grade_id = gr.id  
        JOIN 
          plans_tarifaires a ON u.abonnement_id = a.id  
        WHERE 
          u.first_name = ? AND u.last_name = ?
      `;

      const values = [prenom, nom];
      
      return new Promise<VerifyResultWithData>((resolve, reject) => {
        mysqlConnector.query(sql, values, (error, results) => {
          if (error) {
            console.error(`Erreur lors de la récupération de l'utilisateur ${prenom} ${nom} : ${error.message}`);
            reject(error); // Rejeter la promesse en cas d'erreur
          } else {
            if (results.length > 0) {
              const utilisateur = results[0]; // On prend le premier résultat si trouvé
              console.log(utilisateur);
              resolve({
                isFind: true,
                message: "Utilisateur trouvé",
                data: utilisateur
              });
            } else {
              console.log(`Aucun utilisateur trouvé pour ${prenom} ${nom}`);
              resolve({
                isFind: false,
                message: "Aucun utilisateur trouvé",
                data: []
              });
            }
          }
        });
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération des informations de l'utilisateur ${prenom} ${nom} :`, error);
      throw error;
    }
  };

  
}