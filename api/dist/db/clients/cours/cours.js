import MysqlConnector from '../../connector/mysqlconnector.js';
export class Cours {
    // Récupérer les cours avec le participant //
    obtenirLesCoursPourParticipant(participantId) {
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
            mysqlConnector.query(sql, [participantId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des cours du participant : ' + error.message);
                    reject(error);
                }
                else {
                    // Map les résultats bruts en CoursData (selon ta structure)
                    const cours = results.map(row => ({
                        id: row.id,
                        date_cours: row.date_cours, // vérifier que c’est un string ISO ou le formater si nécessaire
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
    obtenirUtilisateursParCours(coursId) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `
        SELECT u.first_name, u.last_name
        FROM utilisateurs u
        JOIN inscriptions i ON i.utilisateur_id = u.id
        WHERE i.cours_id = ?
      `;
            mysqlConnector.query(sql, [coursId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des utilisateurs pour le cours : ' + error.message);
                    reject(error);
                }
                else {
                    const utilisateurs = results.map(row => ({
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
    async obtenirCoursAvecUtilisateurs(participantId) {
        const client = new Cours();
        // Récupérer les cours du participant
        const cours = await client.obtenirLesCoursPourParticipant(participantId);
        // Pour chaque cours, récupérer les utilisateurs associés
        const coursAvecUtilisateurs = await Promise.all(cours.map(async (cour) => {
            const { utilisateurs } = await client.obtenirUtilisateursParCours(cour.id);
            return {
                ...cour,
                utilisateurs,
            };
        }));
        return coursAvecUtilisateurs;
    }
    obtenirLesJoursDeCours() {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `
        SELECT DISTINCT 
            CASE DAYNAME(c.date_cours)
                WHEN 'Monday' THEN 'Lundi'
                WHEN 'Tuesday' THEN 'Mardi'
                WHEN 'Wednesday' THEN 'Mercredi'
                WHEN 'Thursday' THEN 'Jeudi'
                WHEN 'Friday' THEN 'Vendredi'
                WHEN 'Saturday' THEN 'Samedi'
                WHEN 'Sunday' THEN 'Dimanche'
            END AS jour, 
            c.type_cours, 
            DATE_FORMAT(c.heure_debut, '%H:%i') AS heure_debut, 
            DATE_FORMAT(c.heure_fin, '%H:%i') AS heure_fin, 
            GROUP_CONCAT(DISTINCT CONCAT(p.prenom, ' ', p.nom) ORDER BY p.nom ASC SEPARATOR ', ') AS professeurs
        FROM cours c 
        LEFT JOIN cours_recurrent_professeur crp ON c.cours_recurrent_id = crp.cours_recurrent_id 
        LEFT JOIN professeurs p ON crp.professeur_id = p.id 
        GROUP BY jour, c.type_cours, c.heure_debut, c.heure_fin 
        ORDER BY FIELD(DAYOFWEEK(c.date_cours), 2, 3, 4, 5, 6, 7, 1);

      `;
            console.log("Exécution de la requête pour obtenir les jours de cours avec les professeurs...");
            mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des jours de cours : ' + error.message);
                    reject(error);
                }
                else {
                    // Si on a des résultats, on les formate en fonction de JourCours
                    const joursDeCours = results.map((result) => ({
                        jour: result.jour,
                        type_cours: result.type_cours,
                        heure_debut: result.heure_debut,
                        heure_fin: result.heure_fin,
                        professeurs: result.professeurs ? result.professeurs.split(',') : [] // Séparation des noms des professeurs
                    }));
                    console.log('Cours récupérés avec succès:', joursDeCours);
                    resolve(joursDeCours); // On renvoie les résultats formatés en type JourCours[]
                }
                mysqlConnector.close();
            });
        });
    }
    ajouterCoursRecurrentAvecProfesseurs(data) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const joursDeSemaine = {
                lundi: 1,
                mardi: 2,
                mercredi: 3,
                jeudi: 4,
                vendredi: 5,
                samedi: 6,
                dimanche: 7
            };
            const jourSemaine = joursDeSemaine[data.jour_semaine.toLowerCase()];
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
            mysqlConnector.query(insertRecurrentSql, [data.type_cours, jourSemaine, data.heure_debut, data.heure_fin], (error, results) => {
                if (error) {
                    console.error('Erreur lors de l’ajout du cours récurrent : ' + error.message);
                    mysqlConnector.close();
                    reject(error);
                }
                else {
                    const coursRecurrentId = results.insertId;
                    mysqlConnector.query(`SET @row := -1`, [], (setVarError) => {
                        if (setVarError) {
                            console.error('Erreur lors de l’initialisation de la variable @row : ' + setVarError.message);
                            mysqlConnector.close();
                            reject(setVarError);
                        }
                        else {
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
                            mysqlConnector.query(insertCoursSql, params, (insertError, insertResults) => {
                                if (insertError) {
                                    console.error('Erreur lors de la génération des cours : ' + insertError.message);
                                    mysqlConnector.close();
                                    reject(insertError);
                                }
                                else {
                                    // 🔥 Gestion des professeurs
                                    const utilisateursIds = data.professeurs;
                                    if (!utilisateursIds || utilisateursIds.length === 0) {
                                        console.warn('Aucun professeur à associer');
                                        mysqlConnector.close();
                                        resolve(insertResults);
                                    }
                                    else {
                                        // 🔥 On récupère les bons IDs de la table professeur
                                        const getProfIdsSql = `
                                            SELECT p.id AS professeur_id 
                                            FROM professeurs p
                                            JOIN utilisateurs u ON p.email = u.email
                                            WHERE u.id IN (${utilisateursIds.map(() => '?').join(', ')})
                                        `;
                                        mysqlConnector.query(getProfIdsSql, utilisateursIds, (getProfError, profRows) => {
                                            if (getProfError) {
                                                console.error('Erreur lors de la récupération des IDs professeur : ' + getProfError.message);
                                                mysqlConnector.close();
                                                reject(getProfError);
                                            }
                                            else {
                                                const professeurIdsCorrects = profRows.map((row) => row.professeur_id);
                                                if (professeurIdsCorrects.length === 0) {
                                                    console.warn('Aucun professeur correspondant trouvé');
                                                    mysqlConnector.close();
                                                    resolve(insertResults);
                                                }
                                                else {
                                                    const values = professeurIdsCorrects.map(() => '(?, ?)').join(', ');
                                                    const profParams = [];
                                                    professeurIdsCorrects.forEach((profId) => {
                                                        profParams.push(coursRecurrentId, profId);
                                                    });
                                                    const insertProfSql = `
                                                        INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
                                                        VALUES ${values}
                                                    `;
                                                    mysqlConnector.query(insertProfSql, profParams, (profError, profResults) => {
                                                        mysqlConnector.close();
                                                        if (profError) {
                                                            console.error('Erreur lors de l’association des professeurs : ' + profError.message);
                                                            reject({ isConfirm: false, message: "Cours récurrent + cours générés + professeurs associés n'ont pas été générés et associés avec succès" });
                                                        }
                                                        else {
                                                            console.log('Cours récurrent + cours générés + professeurs associés avec succès');
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
            });
        });
    }
    supprimerJourDeCours(joursSemaine) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            mysqlConnector.beginTransaction((beginError, connection) => {
                if (beginError || !connection) {
                    console.error('Erreur lors de la création de la transaction : ' + beginError?.message);
                    mysqlConnector.close();
                    reject(beginError);
                }
                else {
                    const deleteRecurrentSql = `
            DELETE FROM cours_recurrent WHERE jour_semaine = ?
          `;
                    mysqlConnector.query(deleteRecurrentSql, [joursSemaine], (recurrentError) => {
                        if (recurrentError) {
                            console.error('Erreur lors de la suppression des cours récurrents : ' + recurrentError.message);
                            mysqlConnector.rollback(connection, () => {
                                mysqlConnector.close();
                            });
                            reject(recurrentError);
                        }
                        else {
                            mysqlConnector.commit(connection, (commitError) => {
                                if (commitError) {
                                    mysqlConnector.rollback(connection, () => {
                                        mysqlConnector.close();
                                    });
                                    reject(commitError);
                                }
                                else {
                                    console.log('Cours récurrents et toutes les dépendances supprimés avec succès pour les jours : ' + joursSemaine);
                                    resolve({ isConfirm: true, message: `Cours récurrents et toutes les dépendances supprimés avec succès pour les jours ${joursSemaine}` });
                                    mysqlConnector.close();
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    ajouterCoursRecurrent(data) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const joursDeSemaine = {
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
            mysqlConnector.query(insertRecurrentSql, [data.type_cours, jourSemaine, data.heure_debut, data.heure_fin], (error, results) => {
                if (error) {
                    console.error('Erreur lors de l’ajout du cours récurrent : ' + error.message);
                    mysqlConnector.close();
                    reject(error);
                }
                else {
                    console.log('Cours récurrent ajouté avec succès :', results);
                    // 🔥 Récupérer l’ID du cours récurrent ajouté
                    const coursRecurrentId = results.insertId;
                    console.log("Initialisation de la variable @row");
                    mysqlConnector.query(`SET @row := -1`, [], (setVarError) => {
                        if (setVarError) {
                            console.error('Erreur lors de l’initialisation de la variable @row : ' + setVarError.message);
                            mysqlConnector.close();
                            reject(setVarError);
                        }
                        else {
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
                                }
                                else {
                                    console.log('Cours générés avec succès :', insertResults);
                                    mysqlConnector.close();
                                    resolve(insertResults);
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    associerProfesseursAuCoursRecurrent(coursRecurrentId, professeursIds) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            if (professeursIds.length === 0) {
                reject("Aucun professeur à associer");
                return;
            }
            // Construire les valeurs pour l'INSERT MULTIPLE
            const values = professeursIds.map(() => '(?, ?)').join(', '); // Ex: "(?, ?), (?, ?), (?, ?)"
            const params = [];
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
                }
                else {
                    console.log('Professeurs associés avec succès :', results);
                    mysqlConnector.close();
                    resolve(results);
                }
            });
        });
    }
    // Récupérer tous les cours à partir d'aujourd'hui (limités à 12)
    obtenirTousLesCours() {
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
            mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération de tous les cours : ' + error.message);
                    reject(error);
                }
                else {
                    const cours = results.map(row => ({
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
    obtenirUtilisateursParticipantsParCours(coursId) {
        return new Promise((resolve, reject) => {
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
                }
                else {
                    // Filtrer les utilisateurs ayant un ID valide
                    const utilisateurs = results
                        .filter((row) => row.utilisateurId !== null) // Exclure les utilisateurs dont l'ID est null
                        .map((row) => ({
                        nom: row.nom,
                        prenom: row.prenom,
                        presence: row.status_id
                    }));
                    // Construire un objet UtilisateursParCours avec les utilisateurs
                    const coursAvecUtilisateurs = {
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
    verifierInscriptionUtilisateur(data) {
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
                }
                else {
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
                        }
                        else {
                            const message = `L'utilisateur n'est pas encore inscrit au cours.`;
                            console.log(message);
                            resolve({
                                isBooked: false,
                                isFind: true,
                                message,
                                data: { userId, inscriptionId: null },
                            });
                        }
                    }
                    else {
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
    inscrireUtilisateurAuCours(data) {
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
                }
                else {
                    const message = `L'utilisateur avec l'ID ${data.utilisateur_id} a été inscrit au cours ${data.cours_id} avec succès.`;
                    console.log(message);
                    mysqlConnector.close(); // Fermeture de la connexion après réussite
                    resolve({ isConfirm: true, message });
                }
            });
        });
    }
    desinscrireUtilisateurDuCours(data) {
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
                }
                else if (results.affectedRows === 0) {
                    console.warn("Aucune inscription trouvée.");
                    mysqlConnector.close();
                    resolve({ isConfirm: false, message: "Aucune inscription trouvée pour cet utilisateur et ce cours." });
                }
                else {
                    console.log(`L'utilisateur ${data.utilisateur_nom} ${data.utilisateur_prenom} a été désinscrit du cours ${data.cours_id}.`);
                    mysqlConnector.close();
                    resolve({ isConfirm: true, message: `L'utilisateur ${data.utilisateur_nom} ${data.utilisateur_prenom} a été désinscrit du cours ${data.cours_id}.` });
                }
            });
        });
    }
    validerUtilisateurAuCours(data) {
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
                }
                else if (results.affectedRows === 0) {
                    console.warn("Aucune inscription trouvée.");
                    mysqlConnector.close();
                    resolve({ isConfirm: false, message: "Aucune inscription trouvée pour cet utilisateur et ce cours." });
                }
                else {
                    console.log(`L'inscription de ${data.utilisateur_nom} ${data.utilisateur_prenom} a été validée.`);
                    mysqlConnector.close();
                    resolve({ isConfirm: true, message: `L'inscription de ${data.utilisateur_nom} ${data.utilisateur_prenom} a été validée.` });
                }
            });
        });
    }
    annulerUtilisateurAuCours(data) {
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
                }
                else if (results.affectedRows === 0) {
                    console.warn("Aucune inscription trouvée.");
                    mysqlConnector.close();
                    resolve({ isConfirm: false, message: "Aucune inscription trouvée pour cet utilisateur et ce cours." });
                }
                else {
                    console.log(`L'inscription de ${data.utilisateur_nom} ${data.utilisateur_prenom} a été annulée.`);
                    mysqlConnector.close();
                    resolve({ isConfirm: true, message: `L'inscription de ${data.utilisateur_nom} ${data.utilisateur_prenom} a été annulée.` });
                }
            });
        });
    }
    obtenirIdParticipantParNomPrenom(nom, prenom) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `SELECT id FROM utilisateurs WHERE last_name = ? AND first_name = ?`;
            mysqlConnector.query(sql, [nom, prenom], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération de l\'ID de l\'utilisateur : ' + error.message);
                    reject(error);
                }
                else if (results.length === 0) {
                    reject(new Error('Aucun utilisateur trouvé avec ce nom et prénom'));
                }
                else {
                    resolve(results[0].id);
                }
                mysqlConnector.close();
            });
        });
    }
    async verifierParticipant(data) {
        try {
            const participantId = await this.obtenirIdParticipantParNomPrenom(data.nom, data.prenom);
            const cours = await this.obtenirLesCoursPourParticipant(participantId);
            return cours;
        }
        catch (error) {
            console.error('Erreur dans verifierParticipant:', error);
            throw error;
        }
    }
}
