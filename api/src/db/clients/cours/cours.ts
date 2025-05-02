import { 
  VerifyResultWithData,
  AjoutCours,
  JourCours, 
  ConfirmationResult, 
  CoursData, 
  DataReservation, 
  BookResult, 
  DataInscription, 
  UtilisateursParCours, 
  Utilisateur, 
  DataAnnulation, 
  DataValidation
} from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Cours {

  // Récupérer les cours
  obtenirLesCours(): Promise<Array<CoursData>> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `SELECT * FROM cours LIMIT 12`;
  
      console.log("Exécution de la requête pour obtenir les cours");
  
      mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des cours : ' + error.message);
          reject(error);
        } else {
          console.log('cours récupérés avec succès :', results);
          resolve(results);
        }
  
        mysqlConnector.close();
      });
    });
  }

  obtenirLesJoursDeCours(): Promise<JourCours[]> {
    return new Promise<JourCours[]>((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `
        SELECT DISTINCT 
          DAYNAME(date_cours) AS jour,
          type_cours,
          DATE_FORMAT(heure_debut, '%H:%i') AS heure_debut,
          DATE_FORMAT(heure_fin, '%H:%i') AS heure_fin
        FROM cours
        ORDER BY FIELD(DAYOFWEEK(date_cours), 1, 2, 5, 7);
      `;
    
      console.log("Exécution de la requête pour obtenir les jours de cours...");
    
      mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des jours de cours : ' + error.message);
          reject(error);
        } else {
          // Si on a des résultats, on les formate en fonction de JourCours
          const joursDeCours: JourCours[] = results.map((result: any) => ({
            jour: result.jour,
            type_cours: result.type_cours,
            heure_debut: result.heure_debut,
            heure_fin: result.heure_fin
          }));
    
          console.log('Cours récupérés avec succès:', joursDeCours);
          resolve(joursDeCours);  // On renvoie les résultats formatés en type JourCours[]
        }
    
        mysqlConnector.close();
      });
    });
  }
  

  ajouterCoursRecurrent(data: AjoutCours): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
  
      // Mappage des jours de la semaine (lundi = 1, ..., dimanche = 7)
      const joursDeSemaine: { [key: string]: number } = {
        lundi: 1,
        mardi: 2,
        mercredi: 3,
        jeudi: 4,
        vendredi: 5,
        samedi: 6,
        dimanche: 7
      };
  
      const jourSemaine = joursDeSemaine[data.jour_semaine.toLowerCase()]; // Convertir le jour du front en nombre

      console.log(jourSemaine)
  
      if (!jourSemaine) {
        reject("Jour de la semaine invalide");
        return;
      }
  
      // Déterminer le premier jour du cours
      const start_date = new Date('2024-01-01'); // Commencer avec le 1er janvier de l'année
      const dayOfWeek = start_date.getDay(); // Jour de la semaine (0 = dimanche, 1 = lundi, ..., 6 = samedi)
      const daysUntilTargetDay = (jourSemaine - dayOfWeek + 7) % 7;  // Calculer combien de jours jusqu'au jour souhaité
      start_date.setDate(start_date.getDate() + daysUntilTargetDay);  // Ajuster à la date du premier jour choisi
  
      // Définir la date de fin au 31 décembre de la même année
      const end_date = new Date(start_date);
      end_date.setFullYear(start_date.getFullYear() + 1);  // Ajouter 1 an pour la fin de l'année
      end_date.setDate(31);  // Fixer au 31 décembre
  
      const formattedEndDate = end_date.toISOString().split('T')[0]; // Format 'YYYY-MM-DD'

      console.log(daysUntilTargetDay)
  
      // Étape 1 : Insérer dans cours_recurrent
      const insertRecurrentSql = `
        INSERT INTO cours_recurrent (type_cours, jour_semaine, heure_debut, heure_fin)
        VALUES (?, ?, ?, ?)
      `;
  
      console.log("Exécution de la requête pour insérer le cours récurrent");
  
      mysqlConnector.query(
        insertRecurrentSql,
        [data.type_cours, jourSemaine, data.heure_debut, data.heure_fin],
        (error, results) => {
          if (error) {
            console.error('Erreur lors de l’ajout du cours récurrent : ' + error.message);
            mysqlConnector.close();
            reject(error);
          } else {
            console.log('Cours récurrent ajouté avec succès :', results);
  
            // Étape 2 : Générer les cours récurrents pour le jour de la semaine choisi
            console.log("Initialisation de la variable @row");
            mysqlConnector.query(`SET @row := -1`, [], (setVarError) => {
              if (setVarError) {
                console.error('Erreur lors de l’initialisation de la variable @row : ' + setVarError.message);
                mysqlConnector.close();
                reject(setVarError);
              } else {
                console.log("Insertion des cours générés entre", start_date.toISOString().split('T')[0], "et", formattedEndDate);
  
                const insertCoursSql = `
                  INSERT INTO cours (date_cours, type_cours, heure_debut, heure_fin)
                  SELECT 
                    DATE_ADD(?, INTERVAL (7 * n) DAY) AS date_cours, 
                    ?, 
                    ?, 
                    ?
                  FROM 
                    (SELECT @row := @row + 1 AS n FROM seq_0_to_52) t
                  WHERE 
                    DATE_ADD(?, INTERVAL (7 * n) DAY) BETWEEN ? AND ?
                `;
  
                const params = [
                  start_date.toISOString().split('T')[0], data.type_cours, data.heure_debut, data.heure_fin,
                  start_date.toISOString().split('T')[0], start_date.toISOString().split('T')[0], formattedEndDate
                ];
  
                mysqlConnector.query(insertCoursSql, params, (insertError, insertResults) => {
                  if (insertError) {
                    console.error('Erreur lors de la génération des cours : ' + insertError.message);
                    mysqlConnector.close();
                    reject(insertError);
                  } else {
                    console.log('Cours générés avec succès :', insertResults);
                    mysqlConnector.close();
                    resolve(insertResults);
                  }
                });
              }
            });
          }
        }
      );
    });
  }
  
  
  
   

  obtenirTousLesCours(): Promise<Array<CoursData>> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `SELECT * FROM cours`;
  
      console.log("Exécution de la requête pour obtenir les cours");
  
      mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des cours : ' + error.message);
          reject(error);
        } else {
          console.log('cours récupérés avec succès :', results);
          resolve(results);
        }
  
        mysqlConnector.close();
      });
    });
  }

  obtenirUtilisateursParCours(coursId: number): Promise<UtilisateursParCours> {
    return new Promise<UtilisateursParCours>((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `
        SELECT 
          c.id AS coursId,
          c.date_cours,
          c.type_cours,
          c.heure_debut,
          c.heure_fin,
          u.id AS utilisateurId,
          u.last_name AS nom,
          u.first_name AS prenom,
          i.status_id 
        FROM 
          cours c
        LEFT JOIN 
          inscriptions i ON c.id = i.cours_id
        LEFT JOIN 
          utilisateurs u ON u.id = i.utilisateur_id
        WHERE 
          c.id = ?;
      `;
  
      const values = [coursId];
  
      console.log("Exécution de la requête pour récupérer les utilisateurs inscrits au cours", coursId);
  
      mysqlConnector.query(sql, values, (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des utilisateurs par cours : ' + error.message);
          reject(error);
        } else {
          // Filtrer les utilisateurs ayant un ID valide
          const utilisateurs: Utilisateur[] = results
            .filter((row: any) => row.utilisateurId !== null) // Exclure les utilisateurs dont l'ID est null
            .map((row: any) => ({
              nom: row.nom,
              prenom: row.prenom,
              presence: row.status_id
            }));
  
          // Construire un objet UtilisateursParCours avec les utilisateurs
          const coursAvecUtilisateurs: UtilisateursParCours = {
            id: coursId,
            date_cours: results.length > 0 ? results[0].date_cours : '',
            type_cours: results.length > 0 ? results[0].type_cours : '',
            heure_debut: results.length > 0 ? results[0].heure_debut : '',
            heure_fin: results.length > 0 ? results[0].heure_fin : '',
            utilisateurs: utilisateurs // Liste des utilisateurs filtrée
          };
  
          resolve(coursAvecUtilisateurs); // Retourner le cours avec ses utilisateurs
        }
        mysqlConnector.close();
      });
    });
  }
  
  
  

  verifierInscriptionUtilisateur(data: DataReservation): Promise<BookResult> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `
        SELECT
          u.id AS userId, i.id AS inscriptionId
        FROM
          utilisateurs u
        LEFT JOIN
          inscriptions i
        ON
          u.id = i.utilisateur_id AND i.cours_id = ?
        WHERE
          u.last_name = ? AND u.first_name = ?;
      `;
      const values = [
        data.cours_id, // ID du cours
        data.utilisateur_nom,
        data.utilisateur_prenom,
      ];
      console.log("Exécution de la requête pour récupérer l'utilisateur et vérifier l'inscription au cours");
  
      mysqlConnector.query(sql, values, (error, results) => {
        if (error) {
          console.error('Erreur lors de la vérification de l\'inscription : ' + error.message);
          reject(error);
        } else {
          const isFind = results.length > 0;
          console.log(results);
  
          if (isFind) {
            const userId = results[0].userId;
            const inscriptionId = results[0].inscriptionId;
  
            if (inscriptionId) {
              const message = `L'utilisateur est déjà inscrit à ce cours.`;
              console.log(message);
              resolve({
                isBooked: true,
                isFind: true,
                message,
                data: { userId, inscriptionId },
              });
            } else {
              const message = `L'utilisateur n'est pas encore inscrit au cours.`;
              console.log(message);
              resolve({
                isBooked: false,
                isFind: true,
                message,
                data: { userId, inscriptionId: null },
              });
            }
          } else {
            const message = `L'utilisateur n'a pas été trouvé.`;
            console.log(message);
            resolve({
              isBooked: false,
              isFind: false,
              message,
              data: null,
            });
          }
        }
  
        mysqlConnector.close();
      });
    });
  }

  

  inscrireUtilisateurAuCours(data: DataInscription): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
        const mysqlConnector = new MysqlConnector();
        
        // Requête d'insertion dans la table 'inscriptions'
        const sql = `
            INSERT INTO inscriptions (cours_id, utilisateur_id, status_id)
            VALUES (?, ?, ?);
        `;
        const values = [
            data.cours_id,
            data.utilisateur_id,
            data.status_id
        ];

        console.log("Exécution de la requête pour inscrire l'utilisateur au cours");

        mysqlConnector.query(sql, values, (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'inscription de l\'utilisateur au cours : ' + error.message);
                mysqlConnector.close(); // Assurer la fermeture de la connexion même en cas d'erreur
                reject({ message: 'Erreur lors de l\'inscription de l\'utilisateur au cours.', error: error.message });
            } else {
                const message = `L'utilisateur avec l'ID ${data.utilisateur_id} a été inscrit au cours ${data.cours_id} avec succès.`;
                console.log(message);
                mysqlConnector.close(); // Fermeture de la connexion après réussite
                resolve({ isConfirm: true, message});
            }
        });
    });
  }

  desinscrireUtilisateurDuCours(data: DataAnnulation): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
        const mysqlConnector = new MysqlConnector();

        // Requête pour supprimer l'inscription en récupérant d'abord l'ID utilisateur
        const sql = `
            DELETE FROM inscriptions
            WHERE cours_id = ? 
            AND utilisateur_id = (SELECT id FROM utilisateurs WHERE last_name = ? AND first_name = ? LIMIT 1);
        `;
        const values = [data.cours_id, data.utilisateur_nom, data.utilisateur_prenom];

        console.log("Exécution de la requête pour désinscrire l'utilisateur du cours");

        mysqlConnector.query(sql, values, (error, results) => {
            if (error) {
                console.error("Erreur lors de la désinscription : " + error.message);
                mysqlConnector.close();
                reject({ message: "Erreur lors de la désinscription.", error: error.message });
            } else if (results.affectedRows === 0) {
                console.warn("Aucune inscription trouvée.");
                mysqlConnector.close();
                resolve({ isConfirm: false, message: "Aucune inscription trouvée pour cet utilisateur et ce cours." });
            } else {
                console.log(`L'utilisateur ${data.utilisateur_nom} ${data.utilisateur_prenom} a été désinscrit du cours ${data.cours_id}.`);
                mysqlConnector.close();
                resolve({ isConfirm: true, message: `L'utilisateur ${data.utilisateur_nom} ${data.utilisateur_prenom} a été désinscrit du cours ${data.cours_id}.` });
            }
        });
    });
  }

  validerUtilisateurAuCours(data: DataValidation): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
        const mysqlConnector = new MysqlConnector();

        // Mise à jour du status_id à 1 (validé)
        const sql = `
            UPDATE inscriptions
            SET status_id = 1
            WHERE cours_id = ? 
            AND utilisateur_id = (SELECT id FROM utilisateurs WHERE last_name = ? AND first_name = ? LIMIT 1);
        `;
        const values = [data.cours_id, data.utilisateur_nom, data.utilisateur_prenom];

        console.log("Exécution de la requête pour valider l'inscription");

        mysqlConnector.query(sql, values, (error, results) => {
            if (error) {
                console.error("Erreur lors de la validation : " + error.message);
                mysqlConnector.close();
                reject({ message: "Erreur lors de la validation.", error: error.message });
            } else if (results.affectedRows === 0) {
                console.warn("Aucune inscription trouvée.");
                mysqlConnector.close();
                resolve({ isConfirm: false, message: "Aucune inscription trouvée pour cet utilisateur et ce cours." });
            } else {
                console.log(`L'inscription de ${data.utilisateur_nom} ${data.utilisateur_prenom} a été validée.`);
                mysqlConnector.close();
                resolve({ isConfirm: true, message: `L'inscription de ${data.utilisateur_nom} ${data.utilisateur_prenom} a été validée.` });
            }
        });
    });
  }


  annulerUtilisateurAuCours(data: DataAnnulation): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
        const mysqlConnector = new MysqlConnector();

        // Mise à jour du status_id à 0 (annulé)
        const sql = `
            UPDATE inscriptions
            SET status_id = 0
            WHERE cours_id = ? 
            AND utilisateur_id = (SELECT id FROM utilisateurs WHERE last_name = ? AND first_name = ? LIMIT 1);
        `;
        const values = [data.cours_id, data.utilisateur_nom, data.utilisateur_prenom];

        console.log("Exécution de la requête pour annuler l'inscription");

        mysqlConnector.query(sql, values, (error, results) => {
            if (error) {
                console.error("Erreur lors de l'annulation : " + error.message);
                mysqlConnector.close();
                reject({ message: "Erreur lors de l'annulation.", error: error.message });
            } else if (results.affectedRows === 0) {
                console.warn("Aucune inscription trouvée.");
                mysqlConnector.close();
                resolve({ isConfirm: false, message: "Aucune inscription trouvée pour cet utilisateur et ce cours." });
            } else {
                console.log(`L'inscription de ${data.utilisateur_nom} ${data.utilisateur_prenom} a été annulée.`);
                mysqlConnector.close();
                resolve({ isConfirm: true, message: `L'inscription de ${data.utilisateur_nom} ${data.utilisateur_prenom} a été annulée.` });
            }
        });
    });
  }
}

