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
        FROM echeances_paiements
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
     * Confirme un paiement Stripe via webhook
     * @param stripePaymentIntentId - L'ID du PaymentIntent Stripe
     * @param statut - Le nouveau statut ('reussi' ou 'echec')
     * @returns Une promesse qui résout avec le résultat
     */
    confirmerPaiementStripe(stripePaymentIntentId, statut) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE paiements 
        SET statut = ?, date_confirmation = NOW()
        WHERE stripe_payment_intent_id = ?
      `;
            this.mysqlConnector.query(sql, [statut, stripePaymentIntentId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la confirmation du paiement Stripe :', error);
                    reject(error);
                }
                else if (results.affectedRows === 0) {
                    resolve({
                        isConfirm: false,
                        message: 'Paiement Stripe non trouvé'
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: `Paiement Stripe confirmé : ${statut}`
                    });
                }
            });
        });
    }
    /**
     * Récupère un paiement par son ID Stripe
     * @param stripePaymentIntentId - L'ID du PaymentIntent Stripe
     * @returns Une promesse qui résout avec les données du paiement
     */
    obtenirPaiementParStripeId(stripePaymentIntentId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT p.*, u.first_name, u.last_name, c.id as commande_id
        FROM paiements p
        LEFT JOIN utilisateurs u ON p.utilisateur_id = u.id
        LEFT JOIN commandes c ON p.commande_id = c.id
        WHERE p.stripe_payment_intent_id = ?
      `;
            this.mysqlConnector.query(sql, [stripePaymentIntentId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération du paiement Stripe :', error);
                    reject(error);
                }
                else {
                    resolve(results[0] || null);
                }
            });
        });
    }
    /**
     * Met à jour le statut d'une échéance de paiement
     * @param echeanceId - L'ID de l'échéance
     * @param statut - Le nouveau statut
     * @returns Une promesse qui résout avec le résultat
     */
    mettreAJourEcheance(echeanceId, statut) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE echeances_paiements 
        SET statut = ?, date_paiement = CASE WHEN ? = 'payé' THEN NOW() ELSE date_paiement END
        WHERE id = ?
      `;
            this.mysqlConnector.query(sql, [statut, statut, echeanceId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la mise à jour de l\'échéance :', error);
                    reject(error);
                }
                else if (results.affectedRows === 0) {
                    resolve({
                        isConfirm: false,
                        message: 'Échéance non trouvée'
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: `Échéance mise à jour : ${statut}`
                    });
                }
            });
        });
    }
    /**
     * Traite une commande après un paiement réussi
     * @param stripePaymentIntentId - L'ID du PaymentIntent Stripe
     */
    async traiterCommandeApresPayment(stripePaymentIntentId) {
        return new Promise(async (resolve, reject) => {
            try {
                // 1. Récupérer le paiement et la commande associée
                const paiement = await this.obtenirPaiementParStripeId(stripePaymentIntentId);
                if (!paiement || !paiement.commande_id) {
                    console.log('Aucune commande associée à ce paiement');
                    resolve(null);
                    return;
                }
                // 2. Mettre à jour le statut de la commande
                await this.mettreAJourStatutCommande(paiement.commande_id, 'payée');
                // 3. Récupérer les articles de la commande
                const articlesCommande = await this.obtenirArticlesCommande(paiement.commande_id);
                // 4. Mettre à jour les stocks pour chaque article
                for (const article of articlesCommande) {
                    await this.mettreAJourStock(article.article_id, article.taille_id, article.quantite);
                }
                console.log(`Commande ${paiement.commande_id} traitée avec succès`);
                resolve({ commandeId: paiement.commande_id, articlesTraites: articlesCommande.length });
            }
            catch (error) {
                console.error('Erreur lors du traitement de la commande:', error);
                reject(error);
            }
        });
    }
    /**
     * Crée une nouvelle commande avec ses articles
     * @param utilisateurId - L'ID de l'utilisateur
     * @param articles - Les articles de la commande
     * @returns L'ID de la commande créée
     */
    creerCommande(utilisateurId, articles) {
        return new Promise((resolve, reject) => {
            // 1. Créer la commande
            const sqlCommande = `
        INSERT INTO commandes (utilisateur_id, statut, date_commande)
        VALUES (?, 'en attente', NOW())
      `;
            this.mysqlConnector.query(sqlCommande, [utilisateurId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la création de la commande:', error);
                    reject(error);
                    return;
                }
                const commandeId = results.insertId;
                console.log('Commande créée avec ID:', commandeId);
                // 2. Ajouter les articles à la commande
                this.ajouterArticlesCommande(commandeId, articles)
                    .then(() => {
                    console.log(`Articles ajoutés à la commande ${commandeId}`);
                    resolve(commandeId);
                })
                    .catch(reject);
            });
        });
    }
    /**
     * Ajoute les articles à une commande
     * @param commandeId - L'ID de la commande
     * @param articles - Les articles à ajouter
     */
    ajouterArticlesCommande(commandeId, articles) {
        return new Promise((resolve, reject) => {
            if (!articles || articles.length === 0) {
                resolve();
                return;
            }
            const sqlArticles = `
        INSERT INTO commande_articles (commande_id, article_id, taille_id, quantite, prix)
        VALUES ?
      `;
            // Préparer les données pour l'insertion en lot
            const articlesData = articles.map(article => [
                commandeId,
                article.article_id,
                this.obtenirTailleId(article.taille), // Convertir la taille en ID
                article.quantite,
                article.prix
            ]);
            this.mysqlConnector.query(sqlArticles, [articlesData], (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'ajout des articles:', error);
                    reject(error);
                }
                else {
                    console.log(`${articles.length} articles ajoutés à la commande ${commandeId}`);
                    resolve();
                }
            });
        });
    }
    /**
     * Convertit une taille (string) en ID de taille
     * @param taille - La taille sous forme de string
     * @returns L'ID correspondant (temporaire, à améliorer)
     */
    obtenirTailleId(taille) {
        // Mapping temporaire - à remplacer par une vraie requête DB
        const tailleMapping = {
            'S': 1,
            'M': 2,
            'L': 3,
            'XL': 4
        };
        return tailleMapping[taille] || 2; // Par défaut M
    }
    /**
     * Met à jour le statut d'une commande
     * @param commandeId - L'ID de la commande
     * @param statut - Le nouveau statut
     */
    mettreAJourStatutCommande(commandeId, statut) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE commandes 
        SET statut = ?
        WHERE id = ?
      `;
            this.mysqlConnector.query(sql, [statut, commandeId], (error, results) => {
                if (error) {
                    reject(error);
                }
                else {
                    console.log(`Statut de la commande ${commandeId} mis à jour: ${statut}`);
                    resolve(results);
                }
            });
        });
    }
    /**
     * Récupère les articles d'une commande
     */
    obtenirArticlesCommande(commandeId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT ca.*, a.nom as nom_article, t.nom as nom_taille
        FROM commande_articles ca
        INNER JOIN articles a ON ca.article_id = a.id
        INNER JOIN tailles t ON ca.taille_id = t.id
        WHERE ca.commande_id = ?
      `;
            this.mysqlConnector.query(sql, [commandeId], (error, results) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    }
    /**
     * Met à jour le stock d'un article après achat
     */
    mettreAJourStock(articleId, tailleId, quantiteAchetee) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE stocks 
        SET quantite = GREATEST(0, quantite - ?)
        WHERE article_id = ? AND taille_id = ?
      `;
            this.mysqlConnector.query(sql, [quantiteAchetee, articleId, tailleId], (error, results) => {
                if (error) {
                    reject(error);
                }
                else {
                    console.log(`Stock mis à jour: Article ${articleId}, Taille ${tailleId}, Quantité réduite de ${quantiteAchetee}`);
                    resolve(results);
                }
            });
        });
    }
}
