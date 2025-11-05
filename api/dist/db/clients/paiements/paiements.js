import MysqlConnector from '../../connector/mysqlconnector.js';
export class Paiements {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    obtenirLesTousLesPaiements() {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT paiements.*, 
          utilisateurs.first_name, 
           utilisateurs.last_name, 
        plans_tarifaires.nom_plan
      FROM paiements
      INNER JOIN utilisateurs ON paiements.utilisateur_id = utilisateurs.id
      INNER JOIN plans_tarifaires ON paiements.abonnement_id = plans_tarifaires.id;
      `;
            console.log("Exécution de la requête pour obtenir les paiements");
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des paiements : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('cours récupérés avec succès :', results);
                    resolve(results);
                }
            });
        });
    }
    /**
     * Récupère les paiements pour un utilisateur spécifique
     * @param utilisateurId - L'ID de l'utilisateur
     * @returns Une promesse qui résout avec la liste des paiements de l'utilisateur
     */
    obtenirPaiementsParUtilisateur(utilisateurId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT paiements.*, 
          utilisateurs.first_name, 
          utilisateurs.last_name, 
          plans_tarifaires.nom_plan
        FROM paiements
        INNER JOIN utilisateurs ON paiements.utilisateur_id = utilisateurs.id
        INNER JOIN plans_tarifaires ON paiements.abonnement_id = plans_tarifaires.id
        WHERE paiements.utilisateur_id = ?;
      `;
            console.log(`Exécution de la requête pour obtenir les paiements de l'utilisateur ID ${utilisateurId}`);
            this.mysqlConnector.query(sql, [utilisateurId], (error, results) => {
                if (error) {
                    console.error(`Erreur lors de la récupération des paiements pour l'utilisateur ${utilisateurId}: ${error.message}`);
                    reject(error);
                }
                else {
                    console.log(`Paiements récupérés avec succès pour l'utilisateur ${utilisateurId}:`, results);
                    resolve(results);
                }
            });
        });
    }
    // Méthode pour obtenir les échéances d'un utilisateur
    obtenirEcheancesUtilisateur(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT 
          e.id,
          e.utilisateur_id,
          e.montant,
          e.date_echeance,
          e.statut,
          u.first_name,
          u.last_name,
          pt.nom_plan as abonnement_nom
        FROM echeances_paiements e
        LEFT JOIN utilisateurs u ON e.utilisateur_id = u.id
        LEFT JOIN plans_tarifaires pt ON u.abonnement_id = pt.id
        WHERE e.utilisateur_id = ?
        ORDER BY e.date_echeance DESC
      `;
            this.mysqlConnector.query(sql, [userId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des échéances:', error);
                    reject(error);
                }
                else {
                    const echeances = results.map((row) => ({
                        id: row.id,
                        utilisateur_id: row.utilisateur_id,
                        montant: row.montant,
                        date_echeance: row.date_echeance,
                        statut: row.statut,
                        description: null, // Valeur par défaut puisque la colonne n'existe pas
                        utilisateur: {
                            first_name: row.first_name,
                            last_name: row.last_name
                        },
                        abonnement_nom: row.abonnement_nom
                    }));
                    resolve(echeances);
                }
            });
        });
    }
    /**
     * Récupère les échéances de paiement pour un utilisateur spécifique
     * @param utilisateurId - L'ID de l'utilisateur
     * @returns Une promesse qui résout avec la liste des échéances
     */
    obtenirEcheancesPourUtilisateur(utilisateurId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT 
          id,
          abonnement_id,
          date_echeance,
          montant,
          statut
        FROM echeance_paiement
        WHERE utilisateur_id = ?
        ORDER BY date_echeance DESC;
      `;
            console.log('SQL pour échéances:', sql);
            console.log('Param utilisateur_id:', utilisateurId);
            this.mysqlConnector.query(sql, [utilisateurId], (error, results) => {
                if (error) {
                    console.error('Erreur SQL échéances:', error);
                    reject(error);
                }
                else {
                    console.log('Résultats échéances:', results);
                    resolve(results);
                }
            });
        });
    }
    enregistrerPaiement(paiementData) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO paiements (utilisateur_id, montant, methode_paiement, date_paiement, status_id)
        VALUES (?, ?, ?, NOW(), 1)
      `;
            this.mysqlConnector.query(sql, [
                paiementData.utilisateur_id,
                paiementData.montant,
                paiementData.methode_paiement
            ], (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'enregistrement du paiement :', error);
                    reject(error);
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Paiement enregistré avec succès'
                    });
                }
            });
        });
    }
    annulerPaiement(paiementId) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE paiements 
        SET status_id = 0
        WHERE id = ? AND status_id = 1
      `;
            this.mysqlConnector.query(sql, [paiementId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'annulation du paiement :', error);
                    reject(error);
                }
                else if (results.affectedRows === 0) {
                    resolve({
                        isConfirm: false,
                        message: 'Paiement non trouvé ou déjà annulé'
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Paiement annulé avec succès'
                    });
                }
            });
        });
    }
    /**
     * Crée un nouveau paiement (version complète pour tous les types de paiement)
     * @param paiementData - Les données du paiement à créer
     * @returns Une promesse qui résout avec les données du paiement créé
     */
    creerPaiement(paiementData) {
        return new Promise((resolve, reject) => {
            const dateActuelle = new Date().toISOString().slice(0, 19).replace('T', ' ');
            // Si c'est un paiement de commande (pas d'abonnement), utiliser une période unique
            if (paiementData.commande_id && !paiementData.abonnement_id) {
                // Utiliser un timestamp unique pour éviter les conflits
                const periodeUnique = new Date(Date.now() + Math.random() * 1000).toISOString().slice(0, 10);
                const sql = `
          INSERT INTO paiements 
            (commande_id, utilisateur_id, montant, methode_paiement, stripe_payment_intent_id, 
             paypal_order_id, bitcoin_address, statut, description, date_paiement, periode_debut, periode_fin)
          VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
                const values = [
                    paiementData.commande_id,
                    paiementData.utilisateur_id || null,
                    paiementData.montant,
                    paiementData.methode_paiement,
                    paiementData.stripe_payment_intent_id || null,
                    paiementData.paypal_order_id || null,
                    paiementData.bitcoin_address || null,
                    paiementData.statut,
                    paiementData.description || null,
                    dateActuelle,
                    periodeUnique, // Période de début unique
                    periodeUnique // Période de fin unique
                ];
                console.log("Création d'un paiement de commande avec période unique:", values);
                this.mysqlConnector.query(sql, values, (error, results) => {
                    if (error) {
                        console.error('Erreur lors de la création du paiement : ' + error.message);
                        reject(error);
                    }
                    else {
                        console.log('Paiement créé avec succès, ID:', results.insertId);
                        const createdPaiement = {
                            id: results.insertId,
                            ...paiementData,
                            date_paiement: dateActuelle
                        };
                        resolve(createdPaiement);
                    }
                });
            }
            else {
                // Code existant pour les paiements d'abonnement
                const sql = `
          INSERT INTO paiements 
            (commande_id, utilisateur_id, montant, methode_paiement, stripe_payment_intent_id, 
             paypal_order_id, bitcoin_address, statut, description, date_paiement, abonnement_id, periode_debut, periode_fin)
          VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
                const values = [
                    paiementData.commande_id || null,
                    paiementData.utilisateur_id || null,
                    paiementData.montant,
                    paiementData.methode_paiement,
                    paiementData.stripe_payment_intent_id || null,
                    paiementData.paypal_order_id || null,
                    paiementData.bitcoin_address || null,
                    paiementData.statut,
                    paiementData.description || null,
                    dateActuelle,
                    paiementData.abonnement_id || null,
                    dateActuelle, // periode_debut
                    dateActuelle // periode_fin
                ];
                console.log("Création d'un paiement d'abonnement:", values);
                this.mysqlConnector.query(sql, values, (error, results) => {
                    if (error) {
                        console.error('Erreur lors de la création du paiement : ' + error.message);
                        reject(error);
                    }
                    else {
                        console.log('Paiement créé avec succès, ID:', results.insertId);
                        const createdPaiement = {
                            id: results.insertId,
                            ...paiementData,
                            date_paiement: dateActuelle
                        };
                        resolve(createdPaiement);
                    }
                });
            }
        });
    }
    /**
     * Modifie un paiement existant
     * @param paiementId - L'ID du paiement à modifier
     * @param paiementData - Les nouvelles données du paiement
     * @returns Une promesse qui résout avec les données mises à jour
     */
    modifierPaiement(paiementId, paiementData) {
        return new Promise((resolve, reject) => {
            const fieldsToUpdate = [];
            const values = [];
            // Construire dynamiquement la requête UPDATE
            Object.keys(paiementData).forEach(key => {
                if (paiementData[key] !== undefined) {
                    fieldsToUpdate.push(`${key} = ?`);
                    values.push(paiementData[key]);
                }
            });
            if (fieldsToUpdate.length === 0) {
                resolve({
                    isConfirm: false,
                    message: 'Aucune donnée à mettre à jour'
                });
                return;
            }
            values.push(paiementId);
            const sql = `
        UPDATE paiements 
        SET ${fieldsToUpdate.join(', ')}
        WHERE id = ?
      `;
            this.mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de la modification du paiement :', error);
                    reject(error);
                }
                else if (results.affectedRows === 0) {
                    resolve({
                        isConfirm: false,
                        message: 'Paiement non trouvé'
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Paiement modifié avec succès'
                    });
                }
            });
        });
    }
    /**
     * Met à jour le statut d'un paiement
     * @param paiementId - L'ID du paiement
     * @param statut - Le nouveau statut
     * @returns Une promesse qui résout avec le résultat
     */
    mettreAJourStatutPaiement(paiementId, statut) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE paiements 
        SET statut = ?, date_modification = NOW()
        WHERE id = ?
      `;
            this.mysqlConnector.query(sql, [statut, paiementId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la mise à jour du statut :', error);
                    reject(error);
                }
                else if (results.affectedRows === 0) {
                    resolve({
                        isConfirm: false,
                        message: 'Paiement non trouvé'
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: `Statut du paiement mis à jour : ${statut}`
                    });
                }
            });
        });
    }
    /**
     * Supprime un paiement
     * @param paiementId - L'ID du paiement à supprimer
     * @returns Une promesse qui résout avec le résultat
     */
    supprimerPaiement(paiementId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM paiements WHERE id = ?`;
            this.mysqlConnector.query(sql, [paiementId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la suppression du paiement :', error);
                    reject(error);
                }
                else if (results.affectedRows === 0) {
                    resolve({
                        isConfirm: false,
                        message: 'Paiement non trouvé'
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Paiement supprimé avec succès'
                    });
                }
            });
        });
    }
    /**
     * NOUVELLE MÉTHODE: Traiter une commande après paiement réussi
     */
    async traiterCommandeApresPayment(paymentIntentId) {
        return new Promise((resolve, reject) => {
            // 1. Trouver le paiement associé au PaymentIntent
            const findPaiementSql = `
        SELECT id, commande_id, utilisateur_id, montant 
        FROM paiements 
        WHERE stripe_payment_intent_id = ?
      `;
            this.mysqlConnector.query(findPaiementSql, [paymentIntentId], (error, paiementResults) => {
                if (error) {
                    console.error('❌ Erreur recherche paiement:', error);
                    reject(error);
                    return;
                }
                if (paiementResults.length === 0) {
                    console.warn(`⚠️ Aucun paiement trouvé pour PaymentIntent: ${paymentIntentId}`);
                    resolve({
                        isConfirm: false,
                        message: 'Aucun paiement trouvé'
                    });
                    return;
                }
                const paiement = paiementResults[0];
                if (!paiement.commande_id) {
                    console.log(`ℹ️ Pas de commande associée au paiement ${paiement.id}`);
                    resolve({
                        isConfirm: true,
                        message: 'Paiement confirmé - pas de commande à traiter'
                    });
                    return;
                }
                // 2. Mettre à jour le statut de la commande
                const updateCommandeSql = `
          UPDATE commandes 
          SET statut = 'payée' 
          WHERE id = ? AND statut = 'en attente'
        `;
                this.mysqlConnector.query(updateCommandeSql, [paiement.commande_id], (updateError, updateResults) => {
                    if (updateError) {
                        console.error('❌ Erreur mise à jour commande:', updateError);
                        reject(updateError);
                        return;
                    }
                    console.log(`✅ Commande ${paiement.commande_id} marquée comme payée`);
                    resolve({
                        isConfirm: true,
                        message: `Commande ${paiement.commande_id} traitée avec succès`
                    });
                });
            });
        });
    }
    /**
     * NOUVELLE MÉTHODE: Confirmer un paiement Stripe
     */
    async confirmerPaiementStripe(paymentIntentId, statut) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE paiements 
        SET statut = ?, date_confirmation = NOW()
        WHERE stripe_payment_intent_id = ?
      `;
            this.mysqlConnector.query(sql, [statut, paymentIntentId], (error, results) => {
                if (error) {
                    console.error('❌ Erreur confirmation paiement Stripe:', error);
                    reject(error);
                }
                else {
                    const success = results.affectedRows > 0;
                    console.log(`${success ? '✅' : '⚠️'} Paiement Stripe ${paymentIntentId} ${success ? 'confirmé' : 'non trouvé'}`);
                    resolve({
                        isConfirm: success,
                        message: success
                            ? `Paiement confirmé avec statut: ${statut}`
                            : 'Paiement non trouvé'
                    });
                }
            });
        });
    }
    /**
     * NOUVELLE MÉTHODE: Créer une commande
     */
    async creerCommande(utilisateurId, articles) {
        return new Promise((resolve, reject) => {
            // 1. Créer la commande
            const createCommandeSql = `
        INSERT INTO commandes (utilisateur_id, statut, date_commande)
        VALUES (?, 'en attente', NOW())
      `;
            this.mysqlConnector.query(createCommandeSql, [utilisateurId], (error, commandeResults) => {
                if (error) {
                    console.error('❌ Erreur création commande:', error);
                    reject(error);
                    return;
                }
                const commandeId = commandeResults.insertId;
                console.log(`✅ Commande créée avec ID: ${commandeId}`);
                // 2. Ajouter les articles si fournis
                if (articles && articles.length > 0) {
                    const insertArticlePromises = articles.map((article) => {
                        return new Promise((resolveArticle, rejectArticle) => {
                            const insertArticleSql = `
                INSERT INTO commande_articles (commande_id, article_id, taille_id, quantite, prix)
                VALUES (?, ?, ?, ?, ?)
              `;
                            this.mysqlConnector.query(insertArticleSql, [
                                commandeId,
                                article.article_id,
                                article.taille_id,
                                article.quantite,
                                article.prix
                            ], (articleError) => {
                                if (articleError) {
                                    console.error('❌ Erreur ajout article à la commande:', articleError);
                                    rejectArticle(articleError);
                                }
                                else {
                                    resolveArticle();
                                }
                            });
                        });
                    });
                    Promise.all(insertArticlePromises)
                        .then(() => {
                        console.log(`✅ ${articles.length} articles ajoutés à la commande ${commandeId}`);
                        resolve(commandeId);
                    })
                        .catch(reject);
                }
                else {
                    resolve(commandeId);
                }
            });
        });
    }
    /**
     * MODIFIÉ: Marque une échéance comme payée dans la table echeances_paiements
     */
    async marquerEcheancePayee(echeanceId) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE echeances_paiements 
        SET 
          statut = 'payé', 
          date_paiement = CURDATE() 
        WHERE id = ? AND statut != 'payé'
      `;
            this.mysqlConnector.query(sql, [echeanceId], (error, results) => {
                if (error) {
                    console.error('❌ Erreur marquage échéance payée:', error);
                    reject(error);
                }
                else {
                    const success = results.affectedRows > 0;
                    console.log(`${success ? '✅' : '⚠️'} Échéance ${echeanceId} - Affected rows: ${results.affectedRows}`);
                    if (success) {
                        console.log(`✅ [Paiements] Échéance ${echeanceId} marquée comme payée avec date_paiement = aujourd'hui`);
                    }
                    else {
                        console.warn(`⚠️ [Paiements] Échéance ${echeanceId} non mise à jour (peut-être déjà payée ou inexistante)`);
                    }
                    resolve({
                        isConfirm: success,
                        message: success
                            ? `Échéance ${echeanceId} marquée comme payée`
                            : `Échéance ${echeanceId} non trouvée ou déjà payée`
                    });
                }
            });
        });
    }
    /**
     * Enregistre un paiement d'échéance avec tous les détails - VERSION COMPLÈTE
     */
    async enregistrerPaiementEcheance(paiementData) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO paiements (
          utilisateur_id, montant, methode_paiement, 
          stripe_payment_intent_id, paypal_order_id, bitcoin_address,
          date_paiement, statut, description, abonnement_id, 
          periode_debut, periode_fin
        ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?)
      `;
            const values = [
                paiementData.utilisateur_id,
                paiementData.montant,
                paiementData.methode_paiement,
                paiementData.stripe_payment_intent_id || null,
                paiementData.paypal_order_id || null,
                paiementData.bitcoin_address || null,
                paiementData.statut,
                paiementData.description || null,
                paiementData.abonnement_id || null,
                paiementData.periode_debut || null,
                paiementData.periode_fin || null
            ];
            this.mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('❌ Erreur enregistrement paiement échéance:', error);
                    reject(error);
                }
                else {
                    console.log('✅ Paiement échéance enregistré avec ID:', results.insertId);
                    resolve({
                        isConfirm: true,
                        message: 'Paiement enregistré avec succès',
                        id: results.insertId
                    });
                }
            });
        });
    }
    /**
     * Vérifie si c'est le premier paiement réussi d'un utilisateur
     */
    async estPremierPaiement(utilisateurId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT COUNT(*) as count 
        FROM paiements 
        WHERE utilisateur_id = ? AND statut IN ('reussi', 'confirme')
      `;
            this.mysqlConnector.query(sql, [utilisateurId], (error, results) => {
                if (error) {
                    console.error('❌ Erreur vérification premier paiement:', error);
                    reject(error);
                }
                else {
                    const count = results[0]?.count || 0;
                    const premierPaiement = count <= 1; // 1 car on vient d'enregistrer le paiement
                    console.log(`🔍 Premier paiement pour utilisateur ${utilisateurId}: ${premierPaiement} (total: ${count})`);
                    // Si c'est le premier paiement, mettre à jour le statut de l'utilisateur
                    if (premierPaiement) {
                        this.mettreAJourStatutUtilisateur(utilisateurId, 'utilisateur')
                            .then(() => {
                            console.log(`✅ Statut utilisateur ${utilisateurId} mis à jour vers 'utilisateur'`);
                        })
                            .catch((updateError) => {
                            console.error(`❌ Erreur mise à jour statut utilisateur ${utilisateurId}:`, updateError);
                        });
                    }
                    resolve(premierPaiement);
                }
            });
        });
    }
    /**
     * Met à jour le statut d'un utilisateur
     */
    async mettreAJourStatutUtilisateur(utilisateurId, nouveauStatut) {
        return new Promise((resolve, reject) => {
            // CORRIGÉ: Utiliser le bon nom de colonne
            const getStatusIdSql = `SELECT id FROM status WHERE nom_role = ?`; // CHANGÉ: nom_status → nom_role
            this.mysqlConnector.query(getStatusIdSql, [nouveauStatut], (error, statusResults) => {
                if (error) {
                    console.error('❌ Erreur récupération ID statut:', error);
                    reject(error);
                    return;
                }
                if (statusResults.length === 0) {
                    console.warn(`⚠️ Statut '${nouveauStatut}' non trouvé en base`);
                    resolve(); // Ne pas rejeter, juste continuer
                    return;
                }
                const statusId = statusResults[0].id;
                // CORRIGÉ: Utiliser le bon nom de colonne pour l'utilisateur
                const updateUserSql = `
          UPDATE utilisateurs 
          SET status_id = ? 
          WHERE id = ?
        `; // CHANGÉ: status → status_id
                this.mysqlConnector.query(updateUserSql, [statusId, utilisateurId], (updateError, updateResults) => {
                    if (updateError) {
                        console.error('❌ Erreur mise à jour statut utilisateur:', updateError);
                        reject(updateError);
                    }
                    else {
                        console.log(`✅ Utilisateur ${utilisateurId} - statut mis à jour vers '${nouveauStatut}' (ID: ${statusId})`);
                        resolve();
                    }
                });
            });
        });
    }
    /**
     * MÉTHODE UTILITAIRE: Pour les requêtes avec Promise
     */
    queryAsync(sql, values) {
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, values, (err, results) => {
                if (err)
                    reject(err);
                else
                    resolve(results);
            });
        });
    }
    /**
     * NOUVELLE MÉTHODE: Récupérer les détails d'un paiement par PaymentIntent ID
     */
    async obtenirDetailsPaiementStripe(paymentIntentId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT 
          p.*,
          u.first_name,
          u.last_name,
          u.email,
          ep.id as echeance_id,
          ep.statut as echeance_statut,
          ep.date_echeance
        FROM paiements p
        LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
        LEFT JOIN echeances_paiements ep ON u.id = ep.utilisateur_id
        WHERE p.stripe_payment_intent_id = ?
        ORDER BY p.date_paiement DESC
        LIMIT 1
      `;
            this.mysqlConnector.query(sql, [paymentIntentId], (error, results) => {
                if (error) {
                    console.error('❌ Erreur récupération détails paiement Stripe:', error);
                    reject(error);
                }
                else if (results.length === 0) {
                    console.warn(`⚠️ Aucun paiement trouvé pour PaymentIntent: ${paymentIntentId}`);
                    resolve({
                        isFind: false,
                        message: 'Paiement non trouvé',
                        data: null
                    });
                }
                else {
                    const paiementDetails = results[0];
                    console.log(`🔍 Détails paiement trouvés:`, {
                        paiement_id: paiementDetails.id,
                        utilisateur_id: paiementDetails.utilisateur_id,
                        montant: paiementDetails.montant,
                        statut: paiementDetails.statut,
                        echeance_id: paiementDetails.echeance_id,
                        echeance_statut: paiementDetails.echeance_statut
                    });
                    resolve({
                        isFind: true,
                        message: 'Détails du paiement récupérés',
                        data: paiementDetails
                    });
                }
            });
        });
    }
    /**
     * NOUVELLE MÉTHODE: Mettre à jour le statut d'une échéance avec vérifications
     */
    async mettreAJourStatutEcheance(echeanceId, nouveauStatut, details) {
        return new Promise((resolve, reject) => {
            // D'abord vérifier l'état actuel de l'échéance
            const checkSql = `
        SELECT id, utilisateur_id, montant, statut, date_echeance, date_paiement
        FROM echeances_paiements 
        WHERE id = ?
      `;
            this.mysqlConnector.query(checkSql, [echeanceId], (checkError, checkResults) => {
                if (checkError) {
                    console.error('❌ Erreur vérification échéance:', checkError);
                    reject(checkError);
                    return;
                }
                if (checkResults.length === 0) {
                    console.error(`❌ Échéance ${echeanceId} non trouvée`);
                    resolve({
                        isConfirm: false,
                        message: `Échéance ${echeanceId} non trouvée`
                    });
                    return;
                }
                const echeanceActuelle = checkResults[0];
                console.log(`🔍 État actuel échéance ${echeanceId}:`, {
                    statut_actuel: echeanceActuelle.statut,
                    nouveau_statut: nouveauStatut,
                    utilisateur_id: echeanceActuelle.utilisateur_id,
                    montant: echeanceActuelle.montant
                });
                // Si l'échéance est déjà dans le bon statut, ne rien faire
                if (echeanceActuelle.statut === nouveauStatut) {
                    console.log(`ℹ️ Échéance ${echeanceId} déjà dans le statut '${nouveauStatut}'`);
                    resolve({
                        isConfirm: true,
                        message: `Échéance déjà dans le statut '${nouveauStatut}'`
                    });
                    return;
                }
                // Construire la requête de mise à jour
                let updateSql;
                let updateValues;
                if (nouveauStatut === 'payé') {
                    updateSql = `
            UPDATE echeances_paiements 
            SET statut = ?, date_paiement = CURDATE()
            WHERE id = ?
          `;
                    updateValues = [nouveauStatut, echeanceId];
                }
                else {
                    updateSql = `
            UPDATE echeances_paiements 
            SET statut = ?, date_paiement = NULL
            WHERE id = ?
          `;
                    updateValues = [nouveauStatut, echeanceId];
                }
                // Exécuter la mise à jour
                this.mysqlConnector.query(updateSql, updateValues, (updateError, updateResults) => {
                    if (updateError) {
                        console.error('❌ Erreur mise à jour statut échéance:', updateError);
                        reject(updateError);
                    }
                    else {
                        const success = updateResults.affectedRows > 0;
                        if (success) {
                            console.log(`✅ Échéance ${echeanceId} mise à jour: ${echeanceActuelle.statut} → ${nouveauStatut}`);
                            // Log détaillé pour debug
                            if (details) {
                                console.log(`📝 Détails mise à jour:`, details);
                            }
                        }
                        else {
                            console.warn(`⚠️ Échéance ${echeanceId} non mise à jour`);
                        }
                        resolve({
                            isConfirm: success,
                            message: success
                                ? `Échéance ${echeanceId} mise à jour vers '${nouveauStatut}'`
                                : `Échéance ${echeanceId} non mise à jour`
                        });
                    }
                });
            });
        });
    }
    /**
     * NOUVELLE MÉTHODE: Diagnostiquer les problèmes de paiement
     */
    async diagnostiquerPaiement(paymentIntentId) {
        try {
            console.log(`🔍 [Diagnostic] Analyse du PaymentIntent: ${paymentIntentId}`);
            // 1. Vérifier si le paiement existe en base
            const detailsPaiement = await this.obtenirDetailsPaiementStripe(paymentIntentId);
            // CORRIGÉ: Interface complète pour le diagnostic
            const diagnostic = {
                paymentIntentId,
                timestamp: new Date().toISOString(),
                paiement_en_base: detailsPaiement.isFind,
                details_paiement: detailsPaiement.data,
                problemes_detectes: [],
                suggestions: []
            };
            // 2. Analyser les problèmes potentiels
            if (!detailsPaiement.isFind) {
                diagnostic.problemes_detectes.push('PaymentIntent non trouvé en base de données');
                diagnostic.suggestions.push('Vérifier que le PaymentIntent a été correctement enregistré lors de la création');
            }
            else {
                const paiement = detailsPaiement.data;
                // Vérifier le statut du paiement
                if (paiement.statut === 'en_attente') {
                    diagnostic.problemes_detectes.push('Paiement encore en attente en base');
                    diagnostic.suggestions.push('Le webhook Stripe n\'a peut-être pas été reçu ou traité');
                }
                // Vérifier l'échéance associée
                if (paiement.echeance_id && paiement.echeance_statut !== 'payé') {
                    diagnostic.problemes_detectes.push(`Échéance ${paiement.echeance_id} pas marquée comme payée`);
                    diagnostic.suggestions.push('Mettre à jour manuellement le statut de l\'échéance');
                }
                // Vérifier l'utilisateur
                if (!paiement.utilisateur_id) {
                    diagnostic.problemes_detectes.push('Aucun utilisateur associé au paiement');
                    diagnostic.suggestions.push('Vérifier l\'intégrité des données utilisateur');
                }
            }
            // 3. Vérifier les échéances en attente pour cet utilisateur
            if (detailsPaiement.isFind && detailsPaiement.data?.utilisateur_id) {
                try {
                    const echeances = await this.obtenirEcheancesUtilisateur(detailsPaiement.data.utilisateur_id);
                    const echeancesEnAttente = echeances.filter(e => e.statut === 'en attente' || e.statut === 'échu');
                    diagnostic.echeances_en_attente = echeancesEnAttente.length;
                    diagnostic.echeances_details = echeancesEnAttente;
                    if (echeancesEnAttente.length > 0) {
                        diagnostic.suggestions.push(`${echeancesEnAttente.length} échéance(s) en attente trouvée(s)`);
                        // Ajouter des détails sur chaque échéance en attente
                        echeancesEnAttente.forEach((echeance) => {
                            diagnostic.suggestions.push(`Échéance ${echeance.id}: ${echeance.montant}€ due le ${echeance.date_echeance} (statut: ${echeance.statut})`);
                        });
                    }
                }
                catch (echeanceError) {
                    console.error('❌ Erreur récupération échéances:', echeanceError);
                    diagnostic.problemes_detectes.push('Erreur lors de la récupération des échéances utilisateur');
                    diagnostic.suggestions.push('Vérifier la connectivité base de données');
                }
            }
            // 4. Ajouter des suggestions générales
            if (diagnostic.problemes_detectes.length === 0) {
                diagnostic.suggestions.push('Aucun problème détecté côté base de données');
                diagnostic.suggestions.push('Vérifier le statut côté Stripe avec l\'API');
            }
            console.log(`📊 [Diagnostic] Résultats:`, diagnostic);
            return {
                isFind: true,
                message: 'Diagnostic terminé',
                data: diagnostic
            };
        }
        catch (error) {
            console.error('❌ Erreur lors du diagnostic:', error);
            return {
                isFind: false,
                message: 'Erreur lors du diagnostic',
                data: {
                    error: error.message,
                    paymentIntentId,
                    timestamp: new Date().toISOString(),
                    paiement_en_base: false,
                    details_paiement: null,
                    problemes_detectes: ['Erreur technique lors du diagnostic'],
                    suggestions: ['Contacter le support technique']
                }
            };
        }
    }
}
