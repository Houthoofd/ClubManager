import { 
  VerifyResultWithData,
  AjoutCours,
  JourCours, 
  ConfirmationResult, 
  DataReservation, 
  BookResult, 
  DataInscription, 
  UtilisateursParCours, 
  Utilisateur, 
  DataAnnulation, 
  DataValidation,
  CoursData,
} from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Cours {



  // Récupérer les cours avec le participant //
  obtenirLesCoursPourParticipant(participantId: number): Promise<CoursData[]> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();

      const sql = `
        SELECT c.*
        FROM cours c
        JOIN inscriptions i ON i.cours_id = c.id
        WHERE i.utilisateur_id = ?
          AND c.date_cours >= CURRENT_DATE
        ORDER BY c.date_cours ASC
        LIMIT 12;
      `;

      console.log("Exécution de la requête pour obtenir les cours du participant avec ID :", participantId);

      mysqlConnector.query(sql, [participantId], (error, results: any[]) => {
        if (error) {
          console.error('Erreur lors de la récupération des cours du participant : ' + error.message);
          reject(error);
        } else {
          // Map les résultats bruts en CoursData (selon ta structure)
          const cours: CoursData[] = results.map(row => ({
            id: row.id,
            date_cours: row.date_cours,         // vérifier que c’est un string ISO ou le formater si nécessaire
            type_cours: row.type_cours,
            heure_debut: row.heure_debut,
            heure_fin: row.heure_fin,
            // utilisateurs ne sera pas ici, à récupérer séparément
          }));

          console.log('Cours du participant récupérés avec succès :', cours);
          resolve(cours);
        }

        mysqlConnector.close();
      });
    });
  }

  obtenirUtilisateursParCours(coursId: number): Promise<{ utilisateurs: Utilisateur[] }> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();

      const sql = `
        SELECT u.first_name, u.last_name
        FROM utilisateurs u
        JOIN inscriptions i ON i.utilisateur_id = u.id
        WHERE i.cours_id = ?
      `;

      mysqlConnector.query(sql, [coursId], (error, results: any[]) => {
        if (error) {
          console.error('Erreur lors de la récupération des utilisateurs pour le cours : ' + error.message);
          reject(error);
        } else {
          const utilisateurs: Utilisateur[] = results.map(row => ({
            nom: row.nom,
            prenom: row.prenom,
            presence: row.presence
          }));

          resolve({ utilisateurs });
        }

        mysqlConnector.close();
      });
    });
  }

  async obtenirCoursAvecUtilisateurs(participantId: number): Promise<(CoursData & { utilisateurs: Utilisateur[] })[]> {
    const client = new Cours();

    // Récupérer les cours du participant
    const cours = await client.obtenirLesCoursPourParticipant(participantId);

    // Pour chaque cours, récupérer les utilisateurs associés
    const coursAvecUtilisateurs = await Promise.all(
      cours.map(async (cour) => {
        const { utilisateurs } = await client.obtenirUtilisateursParCours(cour.id);
        return {
          ...cour,
          utilisateurs,
        };
      })
    );

    return coursAvecUtilisateurs;
  }

 async obtenirLesJoursDeCours(): Promise<JourCours[]> {
  const mysqlConnector = new MysqlConnector();

  const sql = `
    SELECT 
        cr.id AS cours_recurrent_id,
        CASE cr.jour_semaine
            WHEN 1 THEN 'Lundi'
            WHEN 2 THEN 'Mardi'
            WHEN 3 THEN 'Mercredi'
            WHEN 4 THEN 'Jeudi'
            WHEN 5 THEN 'Vendredi'
            WHEN 6 THEN 'Samedi'
            WHEN 7 THEN 'Dimanche'
        END AS jour,
        cr.type_cours,
        TIME_FORMAT(cr.heure_debut, '%H:%i') AS heure_debut,
        TIME_FORMAT(cr.heure_fin, '%H:%i') AS heure_fin,
        GROUP_CONCAT(DISTINCT CONCAT(p.prenom, ' ', p.nom) ORDER BY p.nom ASC SEPARATOR ', ') AS professeurs
    FROM cours_recurrent cr
    LEFT JOIN cours_recurrent_professeur crp 
           ON cr.id = crp.cours_recurrent_id
    LEFT JOIN professeurs p 
           ON crp.professeur_id = p.id
    WHERE cr.active = 1
    GROUP BY cr.id, cr.type_cours, cr.heure_debut, cr.heure_fin, cr.jour_semaine
    ORDER BY cr.jour_semaine, cr.heure_debut;
  `;

  return new Promise<JourCours[]>((resolve, reject) => {
    mysqlConnector.query(sql, [], (error, results) => {
      if (error) {
        console.error('Erreur lors de la récupération des jours de cours :', error);
        reject(error);
      } else {
        const joursDeCours: JourCours[] = results.map((result: any) => {
          const professeursArray: string[] = result.professeurs
            ? result.professeurs.split(',').map((p: string) => p.trim())
            : []; // Vide si aucun professeur

          return {
            jour: result.jour,
            type_cours: result.type_cours,
            heure_debut: result.heure_debut,
            heure_fin: result.heure_fin,
            professeurs: Array.from(new Set(professeursArray)) // Supprime doublons
          };
        });

        console.log('Cours récupérés avec succès:', joursDeCours);
        resolve(joursDeCours);
      }

      mysqlConnector.close();
    });
  });
}



  

  ajouterCoursRecurrentAvecProfesseurs(data: AjoutCours): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>(async (resolve, reject) => {
      const mysqlConnector = new MysqlConnector();

      const joursDeSemaine: { [key: string]: number } = {
        lundi: 1,
        mardi: 2,
        mercredi: 3,
        jeudi: 4,
        vendredi: 5,
        samedi: 6,
        dimanche: 7
      };

      // Correction: accepte aussi les jours avec majuscule
      let jourSemaineRaw = data.jour_semaine;
      if (!jourSemaineRaw || typeof jourSemaineRaw !== 'string') {
        jourSemaineRaw = (data as any).jour;
      }
      if (!jourSemaineRaw || typeof jourSemaineRaw !== 'string') {
        reject("Jour de la semaine invalide");
        return;
      }
      const jourSemaineKey = jourSemaineRaw.toLowerCase().trim();
      const jourSemaine = joursDeSemaine[jourSemaineKey];
      if (!jourSemaine) {
        reject("Jour de la semaine invalide");
        return;
      }

      const start_date = new Date('2024-01-01');
      const dayOfWeek = start_date.getDay();
      const daysUntilTargetDay = (jourSemaine - dayOfWeek + 7) % 7;
      start_date.setDate(start_date.getDate() + daysUntilTargetDay);

      const end_date = new Date(start_date);
      end_date.setFullYear(start_date.getFullYear() + 1);
      end_date.setDate(31);
      const formattedEndDate = end_date.toISOString().split('T')[0];

      const insertRecurrentSql = `
        INSERT INTO cours_recurrent (type_cours, jour_semaine, heure_debut, heure_fin)
        VALUES (?, ?, ?, ?)
      `;

      mysqlConnector.query(
        insertRecurrentSql,
        [data.type_cours, jourSemaine, data.heure_debut, data.heure_fin],
        async (error, results) => {
          if (error) {
            mysqlConnector.close();
            reject(error);
          } else {
            const coursRecurrentId = results.insertId;

            mysqlConnector.query(`SET @row := -1`, [], async (setVarError) => {
              if (setVarError) {
                mysqlConnector.close();
                reject(setVarError);
              } else {
                const insertCoursSql = `
                  INSERT INTO cours (date_cours, type_cours, heure_debut, heure_fin, cours_recurrent_id)
                  SELECT 
                    DATE_ADD(?, INTERVAL (7 * n) DAY) AS date_cours, 
                    ?, 
                    ?, 
                    ?, 
                    ?
                  FROM 
                    (SELECT @row := @row + 1 AS n FROM seq_0_to_52) t
                  WHERE 
                    DATE_ADD(?, INTERVAL (7 * n) DAY) BETWEEN ? AND ?
                `;

                const params = [
                  start_date.toISOString().split('T')[0], data.type_cours, data.heure_debut, data.heure_fin, coursRecurrentId,
                  start_date.toISOString().split('T')[0], start_date.toISOString().split('T')[0], formattedEndDate
                ];

                mysqlConnector.query(insertCoursSql, params, async (insertError, insertResults) => {
                  if (insertError) {
                    mysqlConnector.close();
                    reject(insertError);
                  } else {
                    // 🔥 Gestion des professeurs (noms complets)
                    const professeursNoms = data.professeurs;
                    if (!professeursNoms || professeursNoms.length === 0) {
                      mysqlConnector.close();
                      resolve({ isConfirm: true, message: "Cours récurrent + cours générés (sans professeurs) ajoutés avec succès" });
                    } else {
                      // Récupère les IDs des professeurs à partir des noms complets
                      const placeholders = professeursNoms.map(() => '?').join(',');
                      const getProfIdsSql = `
                        SELECT id FROM professeurs
                        WHERE CONCAT(TRIM(prenom), ' ', TRIM(nom)) IN (${placeholders})
                      `;
                      mysqlConnector.query(getProfIdsSql, professeursNoms, (getProfError, profRows) => {
                        if (getProfError) {
                          mysqlConnector.close();
                          reject(getProfError);
                        } else {
                          const professeurIds = profRows.map((row: any) => row.id);
                          if (professeurIds.length === 0) {
                            mysqlConnector.close();
                            resolve({ isConfirm: true, message: "Cours ajouté, mais aucun professeur correspondant trouvé." });
                          } else {
                            const values = professeurIds.map(() => '(?, ?)').join(', ');
                            const profParams: any[] = [];
                            professeurIds.forEach((profId: number) => {
                              profParams.push(coursRecurrentId, profId);
                            });

                            const insertProfSql = `
                              INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
                              VALUES ${values}
                            `;

                            mysqlConnector.query(insertProfSql, profParams, (profError, profResults) => {
                              mysqlConnector.close();
                              if (profError) {
                                reject({ isConfirm: false, message: "Erreur lors de l'association des professeurs." });
                              } else {
                                resolve({ isConfirm: true, message: "Cours récurrent + cours générés + professeurs associés avec succès" });
                              }
                            });
                          }
                        }
                      });
                    }
                  }
                });
              }
            });
          }
        }
      );
    });
  }

  supprimerJourDeCours(joursSemaine: number): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();

      // Supprime d'abord les cours liés à ce jour
      const deleteCoursSql = `
        DELETE FROM cours WHERE cours_recurrent_id IN (
          SELECT id FROM cours_recurrent WHERE jour_semaine = ?
        )
      `;
      mysqlConnector.query(deleteCoursSql, [joursSemaine], (deleteCoursError) => {
        if (deleteCoursError) {
          console.error('Erreur lors de la suppression des cours : ' + deleteCoursError.message);
          mysqlConnector.close();
          reject(deleteCoursError);
        } else {
          // Ensuite supprime les associations professeurs
          const deleteProfSql = `
            DELETE FROM cours_recurrent_professeur WHERE cours_recurrent_id IN (
              SELECT id FROM cours_recurrent WHERE jour_semaine = ?
            )
          `;
          mysqlConnector.query(deleteProfSql, [joursSemaine], (deleteProfError) => {
            if (deleteProfError) {
              console.error('Erreur lors de la suppression des associations professeurs : ' + deleteProfError.message);
              mysqlConnector.close();
              reject(deleteProfError);
            } else {
              // Enfin supprime le cours récurrent
              const deleteRecurrentSql = `
                DELETE FROM cours_recurrent WHERE jour_semaine = ?
              `;
              mysqlConnector.query(deleteRecurrentSql, [joursSemaine], (recurrentError) => {
                mysqlConnector.close();
                if (recurrentError) {
                  console.error('Erreur lors de la suppression des cours récurrents : ' + recurrentError.message);
                  reject(recurrentError);
                } else {
                  console.log('Cours récurrents et toutes les dépendances supprimés avec succès pour les jours : ' + joursSemaine);
                  resolve({ isConfirm: true, message: `Cours récurrents et toutes les dépendances supprimés avec succès pour les jours ${joursSemaine}` });
                }
              });
            }
          });
        }
      });
    });
  }

  supprimerProfesseursDuCoursRecurrent(coursRecurrentId: number, professeursIds: number[]): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();

      if (!coursRecurrentId || !Array.isArray(professeursIds) || professeursIds.length === 0) {
        reject({ isConfirm: false, message: "coursRecurrentId et professeursIds requis" });
        return;
      }

      const inClause = professeursIds.map(() => '?').join(', ');
      const sql = `
        DELETE FROM cours_recurrent_professeur
        WHERE cours_recurrent_id = ?
        AND professeur_id IN (${inClause})
      `;
      const params = [coursRecurrentId, ...professeursIds];

      mysqlConnector.query(sql, params, (error, results) => {
        mysqlConnector.close();
        if (error) {
          console.error('Erreur lors de la suppression des professeurs du cours récurrent : ' + error.message);
          reject({ isConfirm: false, message: "Erreur lors de la suppression des professeurs." });
        } else {
          resolve({ isConfirm: true, message: "Professeur(s) supprimé(s) du cours récurrent avec succès." });
        }
      });
    });
  }

async supprimerProfesseursParNomEtJour(professeursNoms: string[], jour: string): Promise<ConfirmationResult> {
  const mysqlConnector = new MysqlConnector();

  // Map des jours
  const joursDeSemaine: Record<string, number> = {
    lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 7
  };

  const normalizeString = (str: string) => str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const jourNum = joursDeSemaine[normalizeString(jour)];
  if (!jourNum) {
    mysqlConnector.close();
    return { isConfirm: false, message: "Jour invalide." };
  }

  const nomsTrimmed = professeursNoms.map(n => n.trim());
  const placeholders = nomsTrimmed.map(() => '?').join(',');

  const getProfIdsSql = `
    SELECT p.id AS professeur_id, CONCAT(TRIM(p.prenom), ' ', TRIM(p.nom)) AS nom
    FROM professeurs p
    WHERE CONCAT(TRIM(p.prenom), ' ', TRIM(p.nom)) IN (${placeholders})
      AND p.status_id = 5
  `;

  try {
    const profRows = await new Promise<any[]>((resolve, reject) => {
      mysqlConnector.query(getProfIdsSql, nomsTrimmed, (error, results) => {
        if (error) return reject(error);
        resolve(results);
      });
    });

    if (profRows.length === 0) {
      return { isConfirm: false, message: "Aucun professeur correspondant trouvé." };
    }

    const messages: string[] = [];
    let suppressionOk = false;

    for (const prof of profRows) {
      console.log(prof.professeur_id, jourNum);
      const deleteSql = `
        DELETE crp
        FROM cours_recurrent_professeur crp
        JOIN cours_recurrent cr ON crp.cours_recurrent_id = cr.id
        WHERE crp.professeur_id = ?
          AND cr.jour_semaine = ?
      `;

      const result = await new Promise<number>((resolve, reject) => {
        mysqlConnector.query(deleteSql, [prof.professeur_id, jourNum], (error, results: any) => {
          if (error) return reject(error);
          resolve(results.affectedRows); // nombre de lignes supprimées
        });
      });

      console.log(result)

      if (result > 0) {
        messages.push(`${prof.nom} : ${result} association(s) supprimée(s)`);
        suppressionOk = true;
      } else {
        messages.push(`${prof.nom} : Aucune association trouvée pour ce jour`);
      }
    }

    return {
      isConfirm: suppressionOk,
      message: messages.join('\n')
    };
  } finally {
    mysqlConnector.close();
  }
}






  ajouterCoursRecurrent(data: AjoutCours): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
  
      const joursDeSemaine: { [key: string]: number } = {
        lundi: 1,
        mardi: 2,
        mercredi: 3,
        jeudi: 4,
        vendredi: 5,
        samedi: 6,
        dimanche: 7
      };
  
      const jourSemaine = joursDeSemaine[data.jour_semaine.toLowerCase()];
      console.log(jourSemaine);
  
      if (!jourSemaine) {
        reject("Jour de la semaine invalide");
        return;
      }
  
      const start_date = new Date('2024-01-01');
      const dayOfWeek = start_date.getDay(); 
      const daysUntilTargetDay = (jourSemaine - dayOfWeek + 7) % 7;  
      start_date.setDate(start_date.getDate() + daysUntilTargetDay); 
  
      const end_date = new Date(start_date);
      end_date.setFullYear(start_date.getFullYear() + 1);
      end_date.setDate(31);
  
      const formattedEndDate = end_date.toISOString().split('T')[0];
      console.log(daysUntilTargetDay);
  
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
  
            // 🔥 Récupérer l’ID du cours récurrent ajouté
            const coursRecurrentId = results.insertId;
  
            console.log("Initialisation de la variable @row");
            mysqlConnector.query(`SET @row := -1`, [], (setVarError) => {
              if (setVarError) {
                console.error('Erreur lors de l’initialisation de la variable @row : ' + setVarError.message);
                mysqlConnector.close();
                reject(setVarError);
              } else {
                console.log("Insertion des cours générés entre", start_date.toISOString().split('T')[0], "et", formattedEndDate);
  
                const insertCoursSql = `
                  INSERT INTO cours (date_cours, type_cours, heure_debut, heure_fin, cours_recurrent_id)
                  SELECT 
                    DATE_ADD(?, INTERVAL (7 * n) DAY) AS date_cours, 
                    ?, 
                    ?, 
                    ?,
                    ?
                  FROM 
                    (SELECT @row := @row + 1 AS n FROM seq_0_to_52) t
                  WHERE 
                    DATE_ADD(?, INTERVAL (7 * n) DAY) BETWEEN ? AND ?
                `;
  
                const params = [
                  start_date.toISOString().split('T')[0], 
                  data.type_cours, 
                  data.heure_debut, 
                  data.heure_fin,
                  coursRecurrentId, // 👈 On insère bien l’ID ici
                  start_date.toISOString().split('T')[0], 
                  start_date.toISOString().split('T')[0], 
                  formattedEndDate
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

  associerProfesseursAuCoursRecurrent(coursRecurrentId: number, professeursIds: number[]): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
  
      if (professeursIds.length === 0) {
        reject("Aucun professeur à associer");
        return;
      }
  
      // Construire les valeurs pour l'INSERT MULTIPLE
      const values = professeursIds.map(() => '(?, ?)').join(', '); // Ex: "(?, ?), (?, ?), (?, ?)"
      const params: any[] = [];
  
      professeursIds.forEach(profId => {
        params.push(coursRecurrentId, profId);
      });
  
      const insertSql = `
        INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
        VALUES ${values}
      `;
  
      mysqlConnector.query(insertSql, params, (error, results) => {
        if (error) {
          console.error('Erreur lors de l’association des professeurs : ' + error.message);
          mysqlConnector.close();
          reject(error);
        } else {
          console.log('Professeurs associés avec succès :', results);
          mysqlConnector.close();
          resolve(results);
        }
      });
    });
  }
  
  
  
  
  
   

  // Récupérer tous les cours à partir d'aujourd'hui (limités à 12)
  obtenirTousLesCours(): Promise<CoursData[]> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();

      const sql = `
        SELECT *
        FROM cours
        WHERE date_cours >= CURRENT_DATE
        ORDER BY date_cours ASC
        LIMIT 12;
      `;

      console.log("Exécution de la requête pour obtenir tous les cours à venir.");

      mysqlConnector.query(sql, [],(error, results: any[]) => {
        if (error) {
          console.error('Erreur lors de la récupération de tous les cours : ' + error.message);
          reject(error);
        } else {
          const cours: CoursData[] = results.map(row => ({
            id: row.id,
            date_cours: row.date_cours,
            type_cours: row.type_cours,
            heure_debut: row.heure_debut,
            heure_fin: row.heure_fin,
          }));

          console.log('Cours à venir récupérés avec succès :', cours);
          resolve(cours);
        }

        mysqlConnector.close();
      });
    });
  }

  obtenirUtilisateursParticipantsParCours(coursId: number): Promise<UtilisateursParCours> {
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

  obtenirIdParticipantParNomPrenom(nom: string, prenom: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const mysqlConnector = new MysqlConnector();

    const sql = `SELECT id FROM utilisateurs WHERE last_name = ? AND first_name = ?`;

    mysqlConnector.query(sql, [nom, prenom], (error, results) => {
      if (error) {
        console.error('Erreur lors de la récupération de l\'ID de l\'utilisateur : ' + error.message);
        reject(error);
      } else if (results.length === 0) {
        reject(new Error('Aucun utilisateur trouvé avec ce nom et prénom'));
      } else {
        resolve(results[0].id);
      }

      mysqlConnector.close();
    });
  });
}


  async verifierParticipant(data: { nom: string; prenom: string }): Promise<Array<CoursData>> {
  try {
    const participantId = await this.obtenirIdParticipantParNomPrenom(data.nom, data.prenom);
    const cours = await this.obtenirLesCoursPourParticipant(participantId);
    return cours;
  } catch (error) {
    console.error('Erreur dans verifierParticipant:', error);
    throw error;
  }
}

  async modifierCoursRecurrentAvecProfesseurs(data: AjoutCours): Promise<ConfirmationResult> {
    const mysqlConnector = new MysqlConnector();

    // Map des jours de la semaine
    const joursDeSemaine: { [key: string]: number } = {
      lundi: 1,
      mardi: 2,
      mercredi: 3,
      jeudi: 4,
      vendredi: 5,
      samedi: 6,
      dimanche: 7
    };

    // Normalisation du jour
    let jourSemaineRaw = data.jour_semaine;
    if (!jourSemaineRaw || typeof jourSemaineRaw !== 'string') {
      jourSemaineRaw = (data as any).jour;
    }
    if (!jourSemaineRaw || typeof jourSemaineRaw !== 'string') {
      mysqlConnector.close();
      throw new Error("Jour de la semaine invalide");
    }
    const jourSemaineKey = jourSemaineRaw.toLowerCase().trim();
    const jourSemaine = joursDeSemaine[jourSemaineKey];
    if (!jourSemaine) {
      mysqlConnector.close();
      throw new Error("Jour de la semaine invalide");
    }

    // Trouve l'id du cours récurrent à modifier
    const findRecurrentSql = `
      SELECT id FROM cours_recurrent
      WHERE jour_semaine = ? AND type_cours = ? AND heure_debut = ? AND heure_fin = ?
      LIMIT 1
    `;
    const [recurrentRows]: any[] = await new Promise((resolve, reject) => {
      mysqlConnector.query(findRecurrentSql, [jourSemaine, data.type_cours, data.heure_debut, data.heure_fin], (error, results) => {
        if (error) return reject(error);
        resolve([results]);
      });
    });

    if (!recurrentRows || recurrentRows.length === 0) {
      mysqlConnector.close();
      throw new Error("Cours récurrent à modifier non trouvé.");
    }
    const coursRecurrentId = recurrentRows[0].id;

    // Met à jour le cours récurrent
    // Correction : retire le champ 'nom' du SET car il n'existe pas dans la table
    const updateRecurrentSql = `
      UPDATE cours_recurrent
      SET type_cours = ?, jour_semaine = ?, heure_debut = ?, heure_fin = ?
      WHERE id = ?
    `;
    await new Promise((resolve, reject) => {
      mysqlConnector.query(
        updateRecurrentSql,
        [data.type_cours, jourSemaine, data.heure_debut, data.heure_fin, coursRecurrentId],
        (error) => {
          if (error) return reject(error);
          resolve(true);
        }
      );
    });

    // Met à jour les professeurs associés
    // 1. Supprime les associations existantes
    await new Promise((resolve, reject) => {
      mysqlConnector.query(
        `DELETE FROM cours_recurrent_professeur WHERE cours_recurrent_id = ?`,
        [coursRecurrentId],
        (error) => {
          if (error) return reject(error);
          resolve(true);
        }
      );
    });

    // 2. Ajoute les nouvelles associations
    if (data.professeurs && data.professeurs.length > 0) {
      // Récupère les IDs des professeurs à partir des noms complets
      const placeholders = data.professeurs.map(() => '?').join(',');
      const getProfIdsSql = `
        SELECT id FROM professeurs
        WHERE CONCAT(TRIM(prenom), ' ', TRIM(nom)) IN (${placeholders})
      `;
      const [profRows]: any[] = await new Promise((resolve, reject) => {
        mysqlConnector.query(getProfIdsSql, data.professeurs, (error, results) => {
          if (error) return reject(error);
          resolve([results]);
        });
      });
      const professeurIds = profRows.map((row: any) => row.id);

      if (professeurIds.length > 0) {
        const values = professeurIds.map(() => '(?, ?)').join(', ');
        const profParams: any[] = [];
        professeurIds.forEach((profId: number) => {
          profParams.push(coursRecurrentId, profId);
        });

        const insertProfSql = `
          INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
          VALUES ${values}
        `;
        await new Promise((resolve, reject) => {
          mysqlConnector.query(insertProfSql, profParams, (error) => {
            if (error) return reject(error);
            resolve(true);
          });
        });
      }
    }

    mysqlConnector.close();
    return { isConfirm: true, message: "Cours récurrent modifié avec succès." };
  }

  // Récupérer les cours à venir où l'utilisateur est inscrit (retourne aussi l'utilisateur)
  obtenirCoursInscritsParUtilisateur(userId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `
        SELECT
          c.id AS id,
          DATE_FORMAT(c.date_cours, '%Y-%m-%dT%H:%i:%sZ') AS date_cours,
          c.type_cours,
          c.heure_debut,
          c.heure_fin,
          u.id AS utilisateurId,
          u.last_name AS utilisateurNom,
          u.first_name AS utilisateurPrenom
        FROM cours c
        INNER JOIN inscriptions i ON c.id = i.cours_id
        INNER JOIN utilisateurs u ON i.utilisateur_id = u.id
        WHERE u.id = ?
          AND c.date_cours >= CURDATE()
        ORDER BY c.date_cours ASC, c.heure_debut ASC
        LIMIT 12;
      `;
      mysqlConnector.query(sql, [userId], (error, results: any[]) => {
        if (error) {
          console.error('Erreur lors de la récupération des cours inscrits : ' + error.message);
          reject(error);
        } else {
          const cours = results.map(row => ({
            id: row.id,
            date_cours: row.date_cours,
            type_cours: row.type_cours,
            heure_debut: row.heure_debut,
            heure_fin: row.heure_fin,
            utilisateur: {
              id: row.utilisateurId,
              nom: row.utilisateurNom,
              prenom: row.utilisateurPrenom
            }
          }));
          resolve(cours);
        }
        mysqlConnector.close();
      });
    });
  }
}

