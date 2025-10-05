import MysqlConnector from '../../connector/mysqlconnector.js';
export class Cours {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    // Récupérer les cours pour un participant
    obtenirLesCoursPourParticipant(participantId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT c.*
        FROM cours c
        JOIN inscriptions i ON i.cours_id = c.id
        WHERE i.utilisateur_id = ?
          AND c.date_cours >= CURRENT_DATE
        ORDER BY c.date_cours ASC
        LIMIT 12;
      `;
            this.mysqlConnector.query(sql, [participantId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des cours du participant:', error.message);
                    reject(error);
                }
                else {
                    const cours = results.map((row) => ({
                        id: row.id,
                        date_cours: row.date_cours,
                        type_cours: row.type_cours,
                        heure_debut: row.heure_debut,
                        heure_fin: row.heure_fin,
                    }));
                    console.log('Cours du participant récupérés avec succès :', cours);
                    resolve(cours);
                }
            });
        });
    }
    // Récupérer les utilisateurs par cours
    obtenirUtilisateursParCours(coursId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT u.first_name, u.last_name, i.status_id as presence
        FROM utilisateurs u
        JOIN inscriptions i ON i.utilisateur_id = u.id
        WHERE i.cours_id = ?
      `;
            this.mysqlConnector.query(sql, [coursId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des utilisateurs pour le cours:', error.message);
                    reject(error);
                }
                else {
                    const utilisateurs = results.map(row => ({
                        nom: row.last_name,
                        prenom: row.first_name,
                        presence: row.presence
                    }));
                    resolve({ utilisateurs });
                }
            });
        });
    }
    // Obtenir les cours avec utilisateurs
    async obtenirCoursAvecUtilisateurs(participantId) {
        const cours = await this.obtenirLesCoursPourParticipant(participantId);
        const coursAvecUtilisateurs = await Promise.all(cours.map(async (cour) => {
            const { utilisateurs } = await this.obtenirUtilisateursParCours(cour.id);
            return { ...cour, utilisateurs };
        }));
        return coursAvecUtilisateurs;
    }
    // Obtenir les jours de cours
    obtenirLesJoursDeCours() {
        return new Promise((resolve, reject) => {
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
        LEFT JOIN cours_recurrent_professeur crp ON cr.id = crp.cours_recurrent_id
        LEFT JOIN professeurs p ON crp.professeur_id = p.id
        WHERE cr.active = 1
        GROUP BY cr.id, cr.type_cours, cr.heure_debut, cr.heure_fin, cr.jour_semaine
        ORDER BY cr.jour_semaine, cr.heure_debut;
      `;
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des jours de cours:', error);
                    reject(error);
                }
                else {
                    console.log('Résultats bruts de la DB:', results); // Log ajouté pour debug
                    const joursDeCours = results.map((result) => {
                        const professeursArray = result.professeurs
                            ? result.professeurs.split(',').map((p) => p.trim())
                            : [];
                        console.log(`Cours ${result.type_cours} ${result.jour} - Professeurs trouvés:`, professeursArray); // Log ajouté
                        return {
                            jour: result.jour,
                            type_cours: result.type_cours,
                            heure_debut: result.heure_debut,
                            heure_fin: result.heure_fin,
                            professeurs: Array.from(new Set(professeursArray))
                        };
                    });
                    resolve(joursDeCours);
                }
            });
        });
    }
    // Obtenir l'ID d'un participant par nom et prénom
    obtenirIdParticipantParNomPrenom(nom, prenom) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id FROM utilisateurs WHERE last_name = ? AND first_name = ? LIMIT 1`;
            this.mysqlConnector.query(sql, [nom, prenom], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération de l\'ID de l\'utilisateur:', error.message);
                    reject(error);
                }
                else if (results.length === 0) {
                    reject(new Error('Aucun utilisateur trouvé avec ce nom et prénom'));
                }
                else {
                    resolve(results[0].id);
                }
            });
        });
    }
    // Vérifier un participant
    async verifierParticipant(data) {
        try {
            const participantId = await this.obtenirIdParticipantParNomPrenom(data.nom, data.prenom);
            return this.obtenirLesCoursPourParticipant(participantId);
        }
        catch (error) {
            console.error('Erreur dans verifierParticipant:', error);
            throw error;
        }
    }
    // Ajouter un cours récurrent avec professeurs
    ajouterCoursRecurrentAvecProfesseurs(data) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Données reçues:", data);
                if (!data.jour_semaine) {
                    throw new Error(`jour_semaine manquant ou invalide: ${data.jour_semaine}`);
                }
                const result = await new Promise((res, rej) => {
                    const params = [
                        data.type_cours,
                        data.jour_semaine,
                        data.heure_debut,
                        data.heure_fin,
                        JSON.stringify(data.professeurs || [])
                    ];
                    console.log("Paramètres envoyés à la procédure:", params);
                    this.mysqlConnector.query('CALL ajouter_cours_recurrent_avec_professeurs(?, ?, ?, ?, ?)', params, (error, results) => {
                        if (error) {
                            console.error("Erreur SQL:", error);
                            rej(error);
                        }
                        else {
                            res(results);
                        }
                    });
                });
                if (result && result.length > 0 && result[0].length > 0) {
                    resolve({
                        isConfirm: true,
                        message: result[0][0].message
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: "Cours récurrent ajouté avec succès"
                    });
                }
            }
            catch (error) {
                console.error('Erreur lors de l\'ajout du cours récurrent:', error);
                reject(error);
            }
        });
    }
    // Nouvelle méthode pour modifier un cours récurrent avec la procédure optimisée
    modifierCoursRecurrentAvecProfesseurs(data) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Données reçues pour modification via procédure:", data);
                console.log("Professeurs reçus:", data.professeurs);
                // Debug: Vérifier ce qui existe en base
                const debugSql = `
          SELECT CONCAT(prenom, ' ', nom) as nom_complet, prenom, nom, id 
          FROM professeurs 
          WHERE status_id = 5
        `;
                this.mysqlConnector.query(debugSql, [], (debugError, debugResults) => {
                    if (!debugError) {
                        console.log("Professeurs disponibles en base:", debugResults);
                        console.log("Comparaison avec les noms reçus:");
                        data.professeurs.forEach(nomRecu => {
                            const found = debugResults.find((prof) => prof.nom_complet === nomRecu ||
                                `${prof.nom} ${prof.prenom}` === nomRecu ||
                                prof.prenom === nomRecu.split(' ')[0] ||
                                prof.nom === nomRecu.split(' ')[1]);
                            console.log(`- "${nomRecu}" -> ${found ? `Trouvé: ${found.nom_complet} (ID: ${found.id})` : 'NON TROUVÉ'}`);
                        });
                    }
                });
                const result = await new Promise((res, rej) => {
                    const params = [
                        data.cours_recurrent_id,
                        data.type_cours,
                        data.jour_semaine,
                        data.heure_debut,
                        data.heure_fin,
                        JSON.stringify(data.professeurs || [])
                    ];
                    console.log("Paramètres envoyés à la procédure de modification:", params);
                    this.mysqlConnector.query('CALL modifier_cours_recurrent_avec_professeurs(?, ?, ?, ?, ?, ?)', params, (error, results) => {
                        if (error) {
                            console.error("Erreur SQL lors de la modification:", error);
                            rej(error);
                        }
                        else {
                            res(results);
                        }
                    });
                });
                if (result && result.length > 0 && result[0].length > 0) {
                    resolve({
                        isConfirm: true,
                        message: result[0][0].message
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: "Cours récurrent modifié avec succès"
                    });
                }
            }
            catch (error) {
                console.error('Erreur lors de la modification du cours récurrent:', error);
                reject(error);
            }
        });
    }
    // Méthode pour obtenir l'ID d'un cours récurrent (helper pour la modification)
    obtenirIdCoursRecurrent(jour, type_cours, heure_debut, heure_fin) {
        return new Promise((resolve, reject) => {
            const joursDeSemaine = {
                lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 7
            };
            const jourNum = joursDeSemaine[jour.toLowerCase()];
            if (!jourNum) {
                reject(new Error('Jour invalide'));
                return;
            }
            const sql = `
        SELECT id FROM cours_recurrent 
        WHERE jour_semaine = ? 
        AND type_cours = ? 
        AND TIME_FORMAT(heure_debut, '%H:%i') = ? 
        AND TIME_FORMAT(heure_fin, '%H:%i') = ?
        LIMIT 1
      `;
            this.mysqlConnector.query(sql, [jourNum, type_cours, heure_debut, heure_fin], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la recherche du cours récurrent:', error);
                    reject(error);
                }
                else if (results.length === 0) {
                    reject(new Error('Cours récurrent non trouvé'));
                }
                else {
                    resolve(results[0].id);
                }
            });
        });
    }
    // Obtenir les jours de cours par semaine
    obtenirJoursDeCoursParSemaine(semaine) {
        return new Promise((resolve, reject) => {
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
        LEFT JOIN cours_recurrent_professeur crp ON cr.id = crp.cours_recurrent_id
        LEFT JOIN professeurs p ON crp.professeur_id = p.id
        WHERE cr.active = 1
          AND cr.id IN (
            SELECT DISTINCT cours_recurrent_id
            FROM cours
            WHERE WEEK(date_cours, 1) = ?
          )
        GROUP BY cr.id, cr.type_cours, cr.heure_debut, cr.heure_fin, cr.jour_semaine
        ORDER BY cr.jour_semaine, cr.heure_debut;
      `;
            this.mysqlConnector.query(sql, [semaine], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des jours de cours par semaine:', error);
                    reject(error);
                }
                else {
                    const joursDeCours = results.map((result) => {
                        const professeursArray = result.professeurs
                            ? result.professeurs.split(',').map((p) => p.trim())
                            : [];
                        return {
                            jour: result.jour,
                            type_cours: result.type_cours,
                            heure_debut: result.heure_debut,
                            heure_fin: result.heure_fin,
                            professeurs: Array.from(new Set(professeursArray))
                        };
                    });
                    resolve(joursDeCours);
                }
            });
        });
    }
    // Récupérer les cours d'une certaine semaine
    obtenirCoursParSemaine(participantId, semaine) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT c.*
        FROM cours c
        JOIN inscriptions i ON i.cours_id = c.id
        WHERE i.utilisateur_id = ?
          AND WEEK(c.date_cours, 1) = ?
        ORDER BY c.date_cours ASC
        LIMIT 12;
      `;
            this.mysqlConnector.query(sql, [participantId, semaine], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des cours de la semaine:', error.message);
                    reject(error);
                }
                else {
                    const cours = results.map((row) => ({
                        id: row.id,
                        date_cours: row.date_cours,
                        type_cours: row.type_cours,
                        heure_debut: row.heure_debut,
                        heure_fin: row.heure_fin,
                    }));
                    resolve(cours);
                }
            });
        });
    }
    // Récupérer les semaines avec des cours pour un participant
    obtenirSemainesAvecCours(participantId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT DISTINCT WEEK(c.date_cours, 1) AS semaine
        FROM cours c
        JOIN inscriptions i ON i.cours_id = c.id
        WHERE i.utilisateur_id = ?
          AND c.date_cours >= CURRENT_DATE
        ORDER BY semaine ASC;
      `;
            this.mysqlConnector.query(sql, [participantId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des semaines avec cours:', error.message);
                    reject(error);
                }
                else {
                    const semaines = results.map((row) => row.semaine);
                    resolve(semaines);
                }
            });
        });
    }
    // Obtenir les statistiques de présence par cours
    obtenirStatistiquesPresenceParCours(coursId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT
          u.id AS utilisateurId,
          u.last_name AS nom,
          u.first_name AS prenom,
          i.status_id,
          CASE i.status_id
            WHEN 1 THEN 'Présent'
            WHEN 2 THEN 'Absent Justifié'
            WHEN 3 THEN 'Absent Non Justifié'
            ELSE 'Inconnu'
          END AS statut
        FROM utilisateurs u
        JOIN inscriptions i ON i.utilisateur_id = u.id
        WHERE i.cours_id = ?
        ORDER BY u.last_name, u.first_name;
      `;
            this.mysqlConnector.query(sql, [coursId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des statistiques de présence:', error.message);
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    }
    // Obtenir les statistiques de présence par utilisateur
    obtenirStatistiquesPresenceParUtilisateur(utilisateurId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT
          c.id AS coursId,
          c.date_cours,
          c.type_cours,
          c.heure_debut,
          c.heure_fin,
          i.status_id,
          CASE i.status_id
            WHEN 1 THEN 'Présent'
            WHEN 2 THEN 'Absent Justifié'
            WHEN 3 THEN 'Absent Non Justifié'
            ELSE 'Inconnu'
          END AS statut
        FROM cours c
        JOIN inscriptions i ON i.cours_id = c.id
        WHERE i.utilisateur_id = ?
        ORDER BY c.date_cours DESC;
      `;
            this.mysqlConnector.query(sql, [utilisateurId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des statistiques de présence par utilisateur:', error.message);
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    }
    // Vérifier l'inscription d'un utilisateur
    verifierInscriptionUtilisateur(data) {
        return new Promise((resolve, reject) => {
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
            const values = [data.cours_id, data.utilisateur_nom, data.utilisateur_prenom];
            this.mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de la vérification de l\'inscription:', error.message);
                    reject(error);
                }
                else {
                    const isFind = results.length > 0;
                    if (isFind) {
                        const userId = results[0].userId;
                        const inscriptionId = results[0].inscriptionId;
                        if (inscriptionId) {
                            resolve({
                                isBooked: true,
                                isFind: true,
                                message: `L'utilisateur est déjà inscrit à ce cours.`,
                                data: { userId, inscriptionId },
                            });
                        }
                        else {
                            resolve({
                                isBooked: false,
                                isFind: true,
                                message: `L'utilisateur n'est pas encore inscrit au cours.`,
                                data: { userId, inscriptionId: null },
                            });
                        }
                    }
                    else {
                        resolve({
                            isBooked: false,
                            isFind: false,
                            message: `L'utilisateur n'a pas été trouvé.`,
                            data: null,
                        });
                    }
                }
            });
        });
    }
    // Inscrire un utilisateur à un cours
    inscrireUtilisateurAuCours(data) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO inscriptions (cours_id, utilisateur_id, date_inscription, status_id)
        VALUES (?, ?, NOW(), 1)
      `;
            const values = [data.cours_id, data.utilisateur_id];
            this.mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'inscription de l\'utilisateur au cours:', error.message);
                    reject({ message: 'Erreur lors de l\'inscription de l\'utilisateur au cours.', error: error.message });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: `L'utilisateur avec l'ID ${data.utilisateur_id} a été inscrit au cours ${data.cours_id} avec succès.`
                    });
                }
            });
        });
    }
    // Désinscrire un utilisateur d'un cours
    desinscrireUtilisateurDuCours(data) {
        return new Promise((resolve, reject) => {
            const sql = `
        DELETE FROM inscriptions
        WHERE cours_id = ?
        AND utilisateur_id = (SELECT id FROM utilisateurs WHERE last_name = ? AND first_name = ? LIMIT 1);
      `;
            const values = [data.cours_id, data.utilisateur_nom, data.utilisateur_prenom];
            this.mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error("Erreur lors de la désinscription:", error.message);
                    reject({ message: "Erreur lors de la désinscription.", error: error.message });
                }
                else if (results.affectedRows === 0) {
                    resolve({ isConfirm: false, message: "Aucune inscription trouvée pour cet utilisateur et ce cours." });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: `L'utilisateur ${data.utilisateur_nom} ${data.utilisateur_prenom} a été désinscrit du cours ${data.cours_id}.`
                    });
                }
            });
        });
    }
    // Valider un utilisateur à un cours
    validerUtilisateurAuCours(data) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE inscriptions
        SET status_id = 1
        WHERE cours_id = ?
        AND utilisateur_id = (SELECT id FROM utilisateurs WHERE last_name = ? AND first_name = ? LIMIT 1);
      `;
            const values = [data.cours_id, data.utilisateur_nom, data.utilisateur_prenom];
            this.mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error("Erreur lors de la validation:", error.message);
                    reject({ message: "Erreur lors de la validation.", error: error.message });
                }
                else if (results.affectedRows === 0) {
                    resolve({ isConfirm: false, message: "Aucune inscription trouvée pour cet utilisateur et ce cours." });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: `L'inscription de ${data.utilisateur_nom} ${data.utilisateur_prenom} a été validée.`
                    });
                }
            });
        });
    }
    // Annuler un utilisateur à un cours
    annulerUtilisateurAuCours(data) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE inscriptions
        SET status_id = 0
        WHERE cours_id = ?
        AND utilisateur_id = (SELECT id FROM utilisateurs WHERE last_name = ? AND first_name = ? LIMIT 1);
      `;
            const values = [data.cours_id, data.utilisateur_nom, data.utilisateur_prenom];
            this.mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error("Erreur lors de l'annulation:", error.message);
                    reject({ message: "Erreur lors de l'annulation.", error: error.message });
                }
                else if (results.affectedRows === 0) {
                    resolve({ isConfirm: false, message: "Aucune inscription trouvée pour cet utilisateur et ce cours." });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: `L'inscription de ${data.utilisateur_nom} ${data.utilisateur_prenom} a été annulée.`
                    });
                }
            });
        });
    }
    // Obtenir tous les cours à venir
    obtenirTousLesCours() {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT
          c.id,
          DATE_FORMAT(c.date_cours, '%Y-%m-%d') AS date_cours,
          DAYNAME(c.date_cours) AS jour_cours,
          (
            SELECT CASE cr.jour_semaine
              WHEN 1 THEN 'Lundi'
              WHEN 2 THEN 'Mardi'
              WHEN 3 THEN 'Mercredi'
              WHEN 4 THEN 'Jeudi'
              WHEN 5 THEN 'Vendredi'
              WHEN 6 THEN 'Samedi'
              WHEN 7 THEN 'Dimanche'
            END
            FROM cours_recurrent cr
            WHERE cr.id = c.cours_recurrent_id
          ) AS jour_semaine,
          c.type_cours,
          c.heure_debut,
          c.heure_fin,
          (
            SELECT GROUP_CONCAT(CONCAT(p.id, ':', p.nom, ':', p.prenom) SEPARATOR ',')
            FROM cours_recurrent_professeur crp
            JOIN professeurs p ON crp.professeur_id = p.id
            WHERE crp.cours_recurrent_id = c.cours_recurrent_id
          ) AS professeurs
        FROM cours c
        JOIN cours_recurrent cr ON cr.id = c.cours_recurrent_id
        WHERE c.date_cours >= CURDATE()
        ORDER BY c.date_cours ASC
        LIMIT 12;
      `;
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des cours:', error.message);
                    reject(error);
                }
                else {
                    const cours = results.map(row => {
                        let professeurs = [];
                        if (row.professeurs) {
                            professeurs = row.professeurs.split(',').map((profStr) => {
                                const [id, nom, prenom] = profStr.split(':');
                                return {
                                    id: parseInt(id),
                                    nom: nom || '',
                                    prenom: prenom || ''
                                };
                            });
                        }
                        return {
                            id: row.id,
                            date_cours: row.date_cours,
                            jour_cours: row.jour_cours,
                            jour_semaine: row.jour_semaine,
                            type_cours: row.type_cours,
                            heure_debut: row.heure_debut,
                            heure_fin: row.heure_fin,
                            professeurs
                        };
                    });
                    resolve(cours);
                }
            });
        });
    }
    // Obtenir les utilisateurs participants par cours
    obtenirUtilisateursParticipantsParCours(coursId) {
        return new Promise((resolve, reject) => {
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
        FROM cours c
        LEFT JOIN inscriptions i ON c.id = i.cours_id
        LEFT JOIN utilisateurs u ON u.id = i.utilisateur_id
        WHERE c.id = ?;
      `;
            this.mysqlConnector.query(sql, [coursId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des utilisateurs par cours:', error.message);
                    reject(error);
                }
                else {
                    const utilisateurs = results
                        .filter((row) => row.utilisateurId !== null)
                        .map((row) => ({
                        id: row.utilisateurId,
                        nom: row.nom,
                        prenom: row.prenom,
                        presence: row.status_id
                    }));
                    const coursAvecUtilisateurs = {
                        id: coursId,
                        date_cours: results.length > 0 ? results[0].date_cours : '',
                        type_cours: results.length > 0 ? results[0].type_cours : '',
                        heure_debut: results.length > 0 ? results[0].heure_debut : '',
                        heure_fin: results.length > 0 ? results[0].heure_fin : '',
                        utilisateurs: utilisateurs
                    };
                    resolve(coursAvecUtilisateurs);
                }
            });
        });
    }
    // Obtenir les cours inscrits par utilisateur
    obtenirCoursInscritsParUtilisateur(userId) {
        return new Promise((resolve, reject) => {
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
            this.mysqlConnector.query(sql, [userId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des cours inscrits:', error.message);
                    reject(error);
                }
                else {
                    const cours = results.map((row) => ({
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
            });
        });
    }
    // Ajouter un cours récurrent
    ajouterCoursRecurrent(data) {
        return new Promise((resolve, reject) => {
            const joursDeSemaine = {
                lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 7
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
            this.mysqlConnector.query(insertRecurrentSql, [data.type_cours, jourSemaine, data.heure_debut, data.heure_fin], (error, results) => {
                if (error) {
                    console.error("Erreur lors de l'ajout du cours récurrent:", error.message);
                    reject(error);
                }
                else {
                    const coursRecurrentId = results.insertId;
                    this.mysqlConnector.query(`SET @row := -1`, [], (setVarError) => {
                        if (setVarError) {
                            console.error("Erreur lors de l'initialisation de la variable @row:", setVarError.message);
                            reject(setVarError);
                        }
                        else {
                            const insertCoursSql = `
                  INSERT INTO cours (date_cours, type_cours, heure_debut, heure_fin, cours_recurrent_id)
                  SELECT
                    DATE_ADD(?, INTERVAL (7 * n) DAY) AS date_cours,
                    ?, ?, ?, ?
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
                                coursRecurrentId,
                                start_date.toISOString().split('T')[0],
                                start_date.toISOString().split('T')[0],
                                formattedEndDate
                            ];
                            this.mysqlConnector.query(insertCoursSql, params, (insertError, insertResults) => {
                                if (insertError) {
                                    console.error('Erreur lors de la génération des cours:', insertError.message);
                                    reject(insertError);
                                }
                                else {
                                    if (data.professeurs && data.professeurs.length > 0) {
                                        this.associerProfesseursAuCoursRecurrent(coursRecurrentId, data.professeurs)
                                            .then(() => resolve({ isConfirm: true, message: 'Cours récurrent ajouté avec succès avec professeurs.' }))
                                            .catch(reject);
                                    }
                                    else {
                                        resolve({ isConfirm: true, message: 'Cours récurrent ajouté avec succès.' });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    // Associer des professeurs à un cours récurrent
    associerProfesseursAuCoursRecurrent(coursRecurrentId, professeursNoms) {
        return new Promise(async (resolve, reject) => {
            if (professeursNoms.length === 0) {
                resolve();
                return;
            }
            try {
                const placeholders = professeursNoms.map(() => '?').join(',');
                const getProfIdsSql = `
          SELECT id FROM professeurs
          WHERE CONCAT(TRIM(prenom), ' ', TRIM(nom)) IN (${placeholders})
        `;
                const profRows = await new Promise((res, rej) => {
                    this.mysqlConnector.query(getProfIdsSql, professeursNoms, (error, results) => {
                        if (error)
                            return rej(error);
                        res(results);
                    });
                });
                const professeurIds = profRows.map((row) => row.id);
                if (professeurIds.length === 0) {
                    resolve();
                    return;
                }
                const values = professeurIds.map(() => '(?, ?)').join(', ');
                const profParams = [];
                professeurIds.forEach((profId) => {
                    profParams.push(coursRecurrentId, profId);
                });
                const insertProfSql = `
          INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
          VALUES ${values}
        `;
                this.mysqlConnector.query(insertProfSql, profParams, (error) => {
                    if (error) {
                        console.error("Erreur lors de l'association des professeurs:", error.message);
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    // Supprimer un jour de cours complet
    supprimerJourDeCours(jourNum) {
        return new Promise((resolve, reject) => {
            // Récupérer l'ID du cours récurrent
            this.mysqlConnector.query('SELECT id FROM cours_recurrent WHERE jour_semaine = ? LIMIT 1', [jourNum], (error, results) => {
                if (error) {
                    reject(error);
                }
                else if (results.length === 0) {
                    reject(new Error('Cours récurrent non trouvé'));
                }
                else {
                    const coursRecurrentId = results[0].id;
                    // Supprimer les associations professeurs
                    this.mysqlConnector.query('DELETE FROM cours_recurrent_professeur WHERE cours_recurrent_id = ?', [coursRecurrentId], (deleteAssocError) => {
                        if (deleteAssocError) {
                            reject(deleteAssocError);
                        }
                        else {
                            // Supprimer les cours individuels
                            this.mysqlConnector.query('DELETE FROM cours WHERE cours_recurrent_id = ?', [coursRecurrentId], (deleteCoursError) => {
                                if (deleteCoursError) {
                                    reject(deleteCoursError);
                                }
                                else {
                                    // Supprimer le cours récurrent
                                    this.mysqlConnector.query('DELETE FROM cours_recurrent WHERE id = ?', [coursRecurrentId], (deleteRecurrentError) => {
                                        if (deleteRecurrentError) {
                                            reject(deleteRecurrentError);
                                        }
                                        else {
                                            resolve({
                                                isConfirm: true,
                                                message: 'Cours supprimé avec succès'
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    // Supprimer des professeurs par nom et jour avec plus de spécificité
    supprimerProfesseursParNomEtJour(professeursNoms, jour, coursContext) {
        return new Promise((resolve, reject) => {
            const joursDeSemaine = {
                lundi: 1, mardi: 2, mercredi: 3, jeudi: 4,
                vendredi: 5, samedi: 6, dimanche: 7
            };
            const jourNum = joursDeSemaine[jour.toLowerCase()];
            if (!jourNum) {
                reject(new Error('Jour invalide'));
                return;
            }
            console.log(`🔍 Debug suppression - Jour: ${jour} (${jourNum}), Professeurs à retirer:`, professeursNoms);
            console.log(`🔍 Contexte cours:`, coursContext);
            // Construire la requête pour trouver le bon cours récurrent
            let coursQuery = 'SELECT id, type_cours, heure_debut, heure_fin FROM cours_recurrent WHERE jour_semaine = ?';
            let coursParams = [jourNum];
            if (coursContext?.type_cours) {
                coursQuery += ' AND type_cours = ?';
                coursParams.push(coursContext.type_cours);
            }
            if (coursContext?.heure_debut) {
                coursQuery += ' AND TIME_FORMAT(heure_debut, "%H:%i") = ?';
                coursParams.push(coursContext.heure_debut);
            }
            if (coursContext?.heure_fin) {
                coursQuery += ' AND TIME_FORMAT(heure_fin, "%H:%i") = ?';
                coursParams.push(coursContext.heure_fin);
            }
            console.log(`🔍 Requête cours récurrent:`, coursQuery, coursParams);
            this.mysqlConnector.query(coursQuery, coursParams, (error, results) => {
                if (error) {
                    reject(error);
                }
                else if (results.length === 0) {
                    reject(new Error('Cours récurrent non trouvé avec les critères fournis'));
                }
                else if (results.length > 1) {
                    console.log('🔍 Plusieurs cours trouvés:', results);
                    // Si plusieurs cours, prendre le premier ou demander plus de précision
                    resolve({
                        isConfirm: false,
                        message: `Plusieurs cours trouvés pour ${jour}. Veuillez être plus spécifique.`
                    });
                    return;
                }
                else {
                    const coursRecurrent = results[0];
                    console.log(`🔍 Cours récurrent trouvé:`, coursRecurrent);
                    // DEBUG: Vérifier les associations existantes pour ce cours spécifique
                    this.mysqlConnector.query(`SELECT crp.professeur_id, p.prenom, p.nom, CONCAT(TRIM(p.prenom), ' ', TRIM(p.nom)) as nom_complet
             FROM cours_recurrent_professeur crp 
             JOIN professeurs p ON crp.professeur_id = p.id 
             WHERE crp.cours_recurrent_id = ?`, [coursRecurrent.id], (assocError, assocResults) => {
                        if (!assocError) {
                            console.log(`🔍 Professeurs actuellement associés au cours ${coursRecurrent.type_cours} ${coursRecurrent.heure_debut}-${coursRecurrent.heure_fin}:`);
                            if (assocResults.length === 0) {
                                console.log("  ❌ Aucun professeur associé à ce cours !");
                            }
                            else {
                                assocResults.forEach((assoc) => {
                                    console.log(`  - ID: ${assoc.professeur_id}, Nom: "${assoc.nom_complet}"`);
                                });
                            }
                        }
                        // Continuer avec la suppression
                        const searchQueries = [
                            `SELECT id FROM professeurs WHERE CONCAT(TRIM(prenom), ' ', TRIM(nom)) IN (${professeursNoms.map(() => '?').join(',')}) AND status_id = 5`,
                            `SELECT id FROM professeurs WHERE CONCAT(TRIM(nom), ' ', TRIM(prenom)) IN (${professeursNoms.map(() => '?').join(',')}) AND status_id = 5`
                        ];
                        let professeurIds = [];
                        let strategyUsed = 0;
                        const tryNextStrategy = (strategyIndex) => {
                            if (strategyIndex >= searchQueries.length) {
                                // Aucune stratégie n'a fonctionné
                                console.log('❌ Aucun professeur trouvé avec toutes les stratégies');
                                resolve({
                                    isConfirm: false,
                                    message: `Aucun professeur trouvé parmi: ${professeursNoms.join(', ')}`
                                });
                                return;
                            }
                            console.log(`🔍 Essai stratégie ${strategyIndex + 1}`);
                            this.mysqlConnector.query(searchQueries[strategyIndex], professeursNoms, (getProfError, profResults) => {
                                if (getProfError) {
                                    reject(getProfError);
                                }
                                else if (profResults.length > 0) {
                                    // Stratégie réussie
                                    professeurIds = profResults.map((row) => row.id);
                                    strategyUsed = strategyIndex + 1;
                                    console.log(`✅ Stratégie ${strategyUsed} réussie - Professeurs trouvés:`, professeurIds);
                                    // Supprimer les associations du cours spécifique
                                    const deletePlaceholders = professeurIds.map(() => '?').join(',');
                                    this.mysqlConnector.query(`DELETE FROM cours_recurrent_professeur WHERE cours_recurrent_id = ? AND professeur_id IN (${deletePlaceholders})`, [coursRecurrent.id, ...professeurIds], (deleteError, deleteResults) => {
                                        if (deleteError) {
                                            reject(deleteError);
                                        }
                                        else {
                                            console.log(`✅ Suppression réussie - ${deleteResults.affectedRows} association(s) supprimée(s)`);
                                            resolve({
                                                isConfirm: true,
                                                message: `${deleteResults.affectedRows} professeur(s) retiré(s) avec succès du cours ${coursRecurrent.type_cours} ${coursRecurrent.heure_debut}-${coursRecurrent.heure_fin}`
                                            });
                                        }
                                    });
                                }
                                else {
                                    // Essayer la stratégie suivante
                                    tryNextStrategy(strategyIndex + 1);
                                }
                            });
                        };
                        tryNextStrategy(0);
                    });
                }
            });
        });
    }
    // Supprimer des professeurs par nom et jour avec résolution automatique
    async supprimerProfesseursParNomEtJourAvecResolution(professeursNoms, jour, coursContext) {
        // Si le contexte n'est pas fourni, essayer de le résoudre automatiquement
        if (!coursContext?.type_cours && !coursContext?.heure_debut && !coursContext?.heure_fin) {
            console.log('⚠️ Contexte manquant - tentative de résolution automatique...');
            try {
                const coursAuto = await this.trouverCoursAvecProfesseur(professeursNoms, jour);
                if (coursAuto) {
                    console.log('✅ Contexte résolu automatiquement:', coursAuto);
                    return this.supprimerProfesseursParNomEtJour(professeursNoms, jour, coursAuto);
                }
                else {
                    return {
                        isConfirm: false,
                        message: `Le professeur ${professeursNoms[0]} n'est associé à aucun cours du ${jour}`
                    };
                }
            }
            catch (error) {
                console.error('Erreur lors de la résolution automatique:', error);
                // Continuer avec la logique normale sans contexte
            }
        }
        // Utiliser la méthode normale si le contexte est fourni ou si la résolution automatique a échoué
        return this.supprimerProfesseursParNomEtJour(professeursNoms, jour, coursContext);
    }
    // Nouvelle méthode pour trouver automatiquement le cours contenant un professeur
    async trouverCoursAvecProfesseur(professeursNoms, jour) {
        const joursDeSemaine = {
            lundi: 1, mardi: 2, mercredi: 3, jeudi: 4,
            vendredi: 5, samedi: 6, dimanche: 7
        };
        const jourNum = joursDeSemaine[jour.toLowerCase()];
        if (!jourNum)
            return null;
        const coursQuery = `
      SELECT cr.id, cr.type_cours, cr.heure_debut, cr.heure_fin,
             GROUP_CONCAT(CONCAT(p.prenom, ' ', p.nom) SEPARATOR ', ') as professeurs
      FROM cours_recurrent cr
      LEFT JOIN cours_recurrent_professeur crp ON cr.id = crp.cours_recurrent_id
      LEFT JOIN professeurs p ON crp.professeur_id = p.id
      WHERE cr.jour_semaine = ?
      GROUP BY cr.id, cr.type_cours, cr.heure_debut, cr.heure_fin
    `;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(coursQuery, [jourNum], (error, results) => {
                if (error) {
                    reject(error);
                }
                else {
                    console.log('📋 Cours trouvés pour ce jour:', results);
                    // Trouver le cours qui contient le professeur à retirer
                    const coursAvecProfesseur = results.find((c) => c.professeurs && c.professeurs.includes(professeursNoms[0]));
                    if (coursAvecProfesseur) {
                        console.log('✅ Cours trouvé automatiquement:', coursAvecProfesseur);
                        resolve({
                            type_cours: coursAvecProfesseur.type_cours,
                            heure_debut: coursAvecProfesseur.heure_debut.substring(0, 5), // Format HH:MM
                            heure_fin: coursAvecProfesseur.heure_fin.substring(0, 5)
                        });
                    }
                    else {
                        console.log('❌ Aucun cours trouvé contenant ce professeur');
                        resolve(null);
                    }
                }
            });
        });
    }
}
// Export par défaut ET nommé pour la compatibilité
export default Cours;
