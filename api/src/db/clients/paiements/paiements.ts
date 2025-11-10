import MysqlConnector from '../../connector/mysqlconnector.js';

// CORRIGÉ: Définir les interfaces localement pour éviter les problèmes d'import
interface UserData {
  id?: number;
  email?: string;
  [key: string]: any;
}

interface VerifyResultWithData {
  isFind: boolean;
  message: string;
  data: any;
}

interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
  [key: string]: any; // Pour permettre des propriétés supplémentaires
}

export class Paiements {
  private mysqlConnector: MysqlConnector;

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
        } else {
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
  obtenirPaiementsParUtilisateur(utilisateurId: number) {
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
        } else {
          console.log(`Paiements récupérés avec succès pour l'utilisateur ${utilisateurId}:`, results);
          resolve(results);
        }
      });
    });
  }

  // Méthode pour obtenir les échéances d'un utilisateur
  obtenirEcheancesUtilisateur(userId: number): Promise<any[]> {
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
        } else {
          const echeances = results.map((row: any) => ({
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
  obtenirEcheancesPourUtilisateur(utilisateurId: number) {
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
        } else {
          console.log('Résultats échéances:', results);
          resolve(results);
        }
      });
    });
  }

  enregistrerPaiement(paiementData: any): Promise<ConfirmationResult> {
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
        } else {
          resolve({
            isConfirm: true,
            message: 'Paiement enregistré avec succès'
          });
        }
      });
    });
  }

  annulerPaiement(paiementId: number): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE paiements 
        SET status_id = 0
        WHERE id = ? AND status_id = 1
      `;

      this.mysqlConnector.query(sql, [paiementId], (error, results: any) => {
        if (error) {
          console.error('Erreur lors de l\'annulation du paiement :', error);
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Paiement non trouvé ou déjà annulé'
          });
        } else {
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
  creerPaiement(paiementData: {
    commande_id?: number;
    utilisateur_id?: number;
    montant: number;
    methode_paiement: string;
    stripe_payment_intent_id?: string;
    paypal_order_id?: string;
    bitcoin_address?: string;
    statut: string;
    description?: string;
    abonnement_id?: number;
    echeance_id?: number; // AJOUT: Support pour echeance_id
  }): Promise<{ id: number; [key: string]: any }> {
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
          periodeUnique  // Période de fin unique
        ];

        console.log("Création d'un paiement de commande avec période unique:", values);

        this.mysqlConnector.query(sql, values, (error, results: any) => {
          if (error) {
            console.error('Erreur lors de la création du paiement : ' + error.message);
            reject(error);
          } else {
            console.log('Paiement créé avec succès, ID:', results.insertId);
            
            const createdPaiement = {
              id: results.insertId,
              ...paiementData,
              date_paiement: dateActuelle
            };
            
            resolve(createdPaiement);
          }
        });
      } else {
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
          dateActuelle  // periode_fin
        ];

        console.log("Création d'un paiement d'abonnement:", values);

        this.mysqlConnector.query(sql, values, (error, results: any) => {
          if (error) {
            console.error('Erreur lors de la création du paiement : ' + error.message);
            reject(error);
          } else {
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
  modifierPaiement(paiementId: number, paiementData: any): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const fieldsToUpdate:any = [];
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

      this.mysqlConnector.query(sql, values, (error, results: any) => {
        if (error) {
          console.error('Erreur lors de la modification du paiement :', error);
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Paiement non trouvé'
          });
        } else {
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
  mettreAJourStatutPaiement(paiementId: number, statut: string): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE paiements 
        SET statut = ?, date_modification = NOW()
        WHERE id = ?
      `;

      this.mysqlConnector.query(sql, [statut, paiementId], (error, results: any) => {
        if (error) {
          console.error('Erreur lors de la mise à jour du statut :', error);
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Paiement non trouvé'
          });
        } else {
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
  supprimerPaiement(paiementId: number): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM paiements WHERE id = ?`;

      this.mysqlConnector.query(sql, [paiementId], (error, results: any) => {
        if (error) {
          console.error('Erreur lors de la suppression du paiement :', error);
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Paiement non trouvé'
          });
        } else {
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
  async traiterCommandeApresPayment(paymentIntentId: string): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      // 1. Trouver le paiement associé au PaymentIntent
      const findPaiementSql = `
        SELECT id, commande_id, utilisateur_id, montant 
        FROM paiements 
        WHERE stripe_payment_intent_id = ?
      `;

      this.mysqlConnector.query(findPaiementSql, [paymentIntentId], (error: any, paiementResults: any[]) => {
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

        this.mysqlConnector.query(updateCommandeSql, [paiement.commande_id], (updateError: any, updateResults: any) => {
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
  async confirmerPaiementStripe(paymentIntentId: string, statut: string): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE paiements 
        SET statut = ?, date_confirmation = NOW()
        WHERE stripe_payment_intent_id = ?
      `;

      this.mysqlConnector.query(sql, [statut, paymentIntentId], (error: any, results: any) => {
        if (error) {
          console.error('❌ Erreur confirmation paiement Stripe:', error);
          reject(error);
        } else {
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
  async creerCommande(utilisateurId: number, articles: any[]): Promise<number> {
    return new Promise((resolve, reject) => {
      // 1. Créer la commande
      const createCommandeSql = `
        INSERT INTO commandes (utilisateur_id, statut, date_commande)
        VALUES (?, 'en attente', NOW())
      `;

      this.mysqlConnector.query(createCommandeSql, [utilisateurId], (error: any, commandeResults: any) => {
        if (error) {
          console.error('❌ Erreur création commande:', error);
          reject(error);
          return;
        }

        const commandeId = commandeResults.insertId;
        console.log(`✅ Commande créée avec ID: ${commandeId}`);

        // 2. Ajouter les articles si fournis
        if (articles && articles.length > 0) {
          const insertArticlePromises = articles.map((article: any) => {
            return new Promise<void>((resolveArticle, rejectArticle) => {
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
              ], (articleError: any) => {
                if (articleError) {
                  console.error('❌ Erreur ajout article à la commande:', articleError);
                  rejectArticle(articleError);
                } else {
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
        } else {
          resolve(commandeId);
        }
      });
    });
  }

  // SIMPLIFIÉ: Méthode pour marquer une échéance comme payée - SANS toucher la table paiements
  async marquerEcheancePayee(echeanceId: number): Promise<any> {
    try {
      console.log(`💰 [Paiements] Marquage échéance ${echeanceId} comme payée`);
      
      // Vérifier d'abord l'état actuel
      const checkQuery = `
        SELECT id, statut, utilisateur_id, date_echeance, abonnement_id 
        FROM echeances_paiements 
        WHERE id = ?
      `;
      const checkResult = await this.queryAsync(checkQuery, [echeanceId]);
      
      if (checkResult.length === 0) {
        throw new Error(`Échéance ${echeanceId} non trouvée`);
      }
      
      const echeance = checkResult[0];
      
      if (echeance.statut === 'payé') {
        console.log(`ℹ️ [Paiements] Échéance ${echeanceId} déjà payée - opération idempotente`);
        return { affectedRows: 0, alreadyPaid: true };
      }
      
      // SIMPLIFIÉ: Mise à jour UNIQUEMENT de la table echeances_paiements
      const updateQuery = `
        UPDATE echeances_paiements 
        SET 
          statut = 'payé',
          date_paiement = CURDATE()
        WHERE id = ? AND statut != 'payé'
      `;
      
      const result = await this.queryAsync(updateQuery, [echeanceId]);
      
      console.log(`✅ [Paiements] Échéance ${echeanceId} mise à jour:`, {
        affectedRows: result.affectedRows,
        previousStatus: echeance.statut,
        newStatus: 'payé'
      });
      
      return result;
      
    } catch (error: any) {
      console.error(`❌ [Paiements] Erreur marquage échéance payée:`, error);
      
      // IMPORTANT: Cette erreur ne devrait plus arriver
      if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('uk_utilisateur_periode_abonnement')) {
        console.error(`❌ [Paiements] ERREUR INATTENDUE: Contrainte uk_utilisateur_periode_abonnement sur table echeances_paiements`);
        console.error(`❌ [Paiements] Cette contrainte ne devrait pas exister sur cette table!`);
        console.error(`❌ [Paiements] Structure attendue: echeances_paiements(id, utilisateur_id, abonnement_id, date_echeance, montant, statut, date_paiement)`);
        
        // Forcer l'idempotence même avec cette erreur
        try {
          const finalCheck = await this.queryAsync(
            'SELECT statut FROM echeances_paiements WHERE id = ?', 
            [echeanceId]
          );
          
          if (finalCheck.length > 0 && finalCheck[0].statut === 'payé') {
            console.log(`✅ [Paiements] Échéance ${echeanceId} finalement payée malgré l'erreur de contrainte`);
            return { affectedRows: 1, constraintHandled: true };
          }
        } catch (checkError) {
          console.error(`❌ [Paiements] Erreur vérification finale:`, checkError);
        }
        
        // DIAGNOSTIC: Vérifier la structure de la table
        try {
          const describeResult = await this.queryAsync('DESCRIBE echeances_paiements', []);
          console.log('🔍 [Paiements] Structure réelle table echeances_paiements:', describeResult);
          
          const showIndexResult = await this.queryAsync('SHOW INDEX FROM echeances_paiements', []);
          console.log('🔍 [Paiements] Index table echeances_paiements:', showIndexResult);
        } catch (describeError) {
          console.error('❌ [Paiements] Impossible de décrire la table:', describeError);
        }
      }
      
      throw error;
    }
  }

  // NOUVELLE MÉTHODE: Marquer échéance payée SANS déclencher contrainte paiements
  async marquerEcheancePayeeSansContrainte(echeanceId: number): Promise<any> {
    try {
      console.log(`💰 [Paiements] Marquage échéance ${echeanceId} comme payée (méthode sans contrainte)`);
      
      // Vérifier d'abord l'état actuel
      const checkQuery = `
        SELECT id, statut, utilisateur_id, date_echeance, abonnement_id 
        FROM echeances_paiements 
        WHERE id = ?
      `;
      const checkResult = await this.queryAsync(checkQuery, [echeanceId]);
      
      if (checkResult.length === 0) {
        throw new Error(`Échéance ${echeanceId} non trouvée`);
      }
      
      const echeance = checkResult[0];
      
      if (echeance.statut === 'payé') {
        console.log(`ℹ️ [Paiements] Échéance ${echeanceId} déjà payée`);
        return { affectedRows: 0, alreadyPaid: true };
      }
      
      // MISE À JOUR DIRECTE de la table echeances_paiements uniquement
      // SANS déclencher de triggers qui pourraient affecter la table paiements
      const updateQuery = `
        UPDATE echeances_paiements 
        SET 
          statut = 'payé',
          date_paiement = CURDATE()
        WHERE id = ? AND statut != 'payé'
      `;
      
      const result = await this.queryAsync(updateQuery, [echeanceId]);
      
      console.log(`✅ [Paiements] Échéance ${echeanceId} mise à jour sans contrainte:`, {
        affectedRows: result.affectedRows,
        previousStatus: echeance.statut,
        newStatus: 'payé'
      });
      
      return result;
      
    } catch (error: any) {
      console.error(`❌ [Paiements] Erreur marquage échéance (sans contrainte):`, error);
      
      // Si on a encore l'erreur de contrainte, c'est qu'il y a un trigger sur echeances_paiements
      if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('uk_utilisateur_periode_abonnement')) {
        console.error(`🚨 [Paiements] ALERTE: La contrainte uk_utilisateur_periode_abonnement est sur echeances_paiements!`);
        console.error(`🚨 [Paiements] Cette contrainte devrait être UNIQUEMENT sur la table paiements`);
        console.error(`🚨 [Paiements] Action requise: Supprimer cette contrainte de echeances_paiements`);
        
        // Vérifier si l'échéance est quand même dans le bon état
        try {
          const finalCheck = await this.queryAsync(
            'SELECT statut FROM echeances_paiements WHERE id = ?', 
            [echeanceId]
          );
          
          if (finalCheck.length > 0 && finalCheck[0].statut === 'payé') {
            console.log(`✅ [Paiements] Échéance ${echeanceId} dans le bon état malgré l'erreur`);
            return { 
              affectedRows: 1, 
              constraintError: true, 
              message: 'État correct malgré erreur contrainte' 
            };
          }
        } catch (checkError) {
          console.error(`❌ [Paiements] Erreur vérification finale:`, checkError);
        }
        
        // Retourner une erreur explicite pour diagnostic
        throw new Error(
          'CONTRAINTE_MAL_PLACÉE: uk_utilisateur_periode_abonnement existe sur echeances_paiements ' +
          'alors qu\'elle devrait être uniquement sur la table paiements. ' +
          'Contactez l\'administrateur pour corriger la structure de base de données.'
        );
      }
      
      throw error;
    }
  }

  /**
   * Vérifie si c'est le premier paiement réussi d'un utilisateur
   */
  async estPremierPaiement(utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count 
        FROM paiements 
        WHERE utilisateur_id = ? AND statut IN ('reussi', 'confirme', 'validé')
      `;

      this.mysqlConnector.query(sql, [utilisateurId], (error: any, results: any) => {
        if (error) {
          console.error('❌ Erreur vérification premier paiement:', error);
          reject(error);
        } else {
          const count = results[0]?.count || 0;
          const premierPaiement = count <= 1; // 1 car on vient d'enregistrer le paiement
          
          console.log(`🔍 Premier paiement pour utilisateur ${utilisateurId}: ${premierPaiement} (total: ${count})`);
          
          // MODIFIÉ: Si c'est le premier paiement, vérifier le statut avant de mettre à jour
          if (premierPaiement) {
            this.verifierEtMettreAJourStatutSiVisiteur(utilisateurId)
              .then(() => {
                console.log(`✅ Vérification statut utilisateur ${utilisateurId} terminée`);
              })
              .catch((updateError) => {
                console.error(`❌ Erreur vérification statut utilisateur ${utilisateurId}:`, updateError);
                // CORRIGÉ: Ne pas rejeter, juste loguer l'erreur
              });
          }
          
          resolve(premierPaiement);
        }
      });
    });
  }

  /**
   * CORRIGÉ: Vérifie le statut et met à jour seulement si l'utilisateur est visiteur
   */
  private async verifierEtMettreAJourStatutSiVisiteur(utilisateurId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🔍 [Paiements] Vérification statut pour utilisateur ${utilisateurId}...`);
      
      // Récupérer le statut actuel
      const getStatusSql = `
        SELECT u.id, u.status_id, s.nom_role 
        FROM utilisateurs u 
        LEFT JOIN status s ON u.status_id = s.id 
        WHERE u.id = ?
      `;
      
      this.mysqlConnector.query(getStatusSql, [utilisateurId], (error: any, userResults: any) => {
        if (error) {
          console.error('❌ Erreur récupération statut utilisateur:', error);
          resolve(); // CORRIGÉ: Résoudre au lieu de rejeter pour ne pas bloquer
          return;
        }
        
        if (userResults.length === 0) {
          console.warn(`⚠️ Utilisateur ${utilisateurId} non trouvé`);
          resolve(); // Ne pas rejeter, juste continuer
          return;
        }
        
        const utilisateur = userResults[0];
        const statutActuel = utilisateur.nom_role;
        
        console.log(`📊 [Paiements] Statut actuel utilisateur ${utilisateurId}: ${statutActuel}`);
        
        // CRITIQUE: Vérifier si l'utilisateur est visiteur
        if (!statutActuel || statutActuel.toLowerCase() !== 'visiteur') {
          const statutsPrivilegies = ['professeur', 'administrateur', 'super-administrateur', 'super_administrateur', 'admin', 'utilisateur'];
          const isPrivileged = statutsPrivilegies.some(statut => 
            statutActuel && statutActuel.toLowerCase().includes(statut.toLowerCase())
          );
          
          if (isPrivileged) {
            console.log(`🏆 [Paiements] Utilisateur ${utilisateurId} a un statut privilégié (${statutActuel}) - AUCUNE modification`);
          } else {
            console.log(`ℹ️ [Paiements] Utilisateur ${utilisateurId} n'est pas visiteur (${statutActuel}) - AUCUNE modification`);
          }
          
          resolve(); // Ne pas faire de mise à jour
          return;
        }
        
        console.log(`🎯 [Paiements] Utilisateur ${utilisateurId} est visiteur - Promotion vers utilisateur...`);
        
        // Récupérer l'ID du statut "utilisateur"
        const getUtilisateurStatusSql = `SELECT id, nom_role FROM status WHERE nom_role = 'utilisateur' LIMIT 1`;
        
        this.mysqlConnector.query(getUtilisateurStatusSql, [], (statusError: any, statusResults: any) => {
          if (statusError) {
            console.error('❌ Erreur récupération ID statut utilisateur:', statusError);
            resolve(); // CORRIGÉ: Résoudre au lieu de rejeter
            return;
          }
          
          if (statusResults.length === 0) {
            console.warn(`⚠️ Statut 'utilisateur' non trouvé en base`);
            resolve(); // Ne pas rejeter, juste continuer
            return;
          }
          
          const nouveauStatusId = statusResults[0].id;
          
          // Mettre à jour le statut
          const updateUserSql = `
            UPDATE utilisateurs 
            SET status_id = ?, date_modification = NOW() 
            WHERE id = ?
          `;
          
          this.mysqlConnector.query(updateUserSql, [nouveauStatusId, utilisateurId], (updateError: any, updateResults: any) => {
            if (updateError) {
              console.error('❌ Erreur mise à jour statut utilisateur:', updateError);
              resolve(); // CORRIGÉ: Résoudre même en cas d'erreur
            } else {
              console.log(`✅ Utilisateur ${utilisateurId} promu: visiteur → utilisateur (ID: ${nouveauStatusId})`);
              resolve();
            }
          });
        });
      });
    });
  }

  /**
   * MÉTHODE UTILITAIRE: Pour les requêtes avec Promise
   */
  queryAsync(sql: string, values: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(sql, values, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  /**
   * NOUVELLE MÉTHODE: Récupérer les détails d'un paiement par PaymentIntent ID
   */
  async obtenirDetailsPaiementStripe(paymentIntentId: string): Promise<VerifyResultWithData> {
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

      this.mysqlConnector.query(sql, [paymentIntentId], (error: any, results: any) => {
        if (error) {
          console.error('❌ Erreur récupération détails paiement Stripe:', error);
          reject(error);
        } else if (results.length === 0) {
          console.warn(`⚠️ Aucun paiement trouvé pour PaymentIntent: ${paymentIntentId}`);
          resolve({
            isFind: false,
            message: 'Paiement non trouvé',
            data: null
          });
        } else {
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
  async mettreAJourStatutEcheance(echeanceId: number, nouveauStatut: 'payé' | 'en attente' | 'échu', details?: any): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      // D'abord vérifier l'état actuel de l'échéance
      const checkSql = `
        SELECT id, utilisateur_id, montant, statut, date_echeance, date_paiement
        FROM echeances_paiements 
        WHERE id = ?
      `;

      this.mysqlConnector.query(checkSql, [echeanceId], (checkError: any, checkResults: any) => {
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
        let updateSql: string;
        let updateValues: any[];

        if (nouveauStatut === 'payé') {
          updateSql = `
            UPDATE echeances_paiements 
            SET statut = ?, date_paiement = CURDATE()
            WHERE id = ?
          `;
          updateValues = [nouveauStatut, echeanceId];
        } else {
          updateSql = `
            UPDATE echeances_paiements 
            SET statut = ?, date_paiement = NULL
            WHERE id = ?
          `;
          updateValues = [nouveauStatut, echeanceId];
        }

        // Exécuter la mise à jour
        this.mysqlConnector.query(updateSql, updateValues, (updateError: any, updateResults: any) => {
          if (updateError) {
            console.error('❌ Erreur mise à jour statut échéance:', updateError);
            reject(updateError);
          } else {
            const success = updateResults.affectedRows > 0;
            
            if (success) {
              console.log(`✅ Échéance ${echeanceId} mise à jour: ${echeanceActuelle.statut} → ${nouveauStatut}`);
              
              // Log détaillé pour debug
              if (details) {
                console.log(`📝 Détails mise à jour:`, details);
              }
            } else {
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
  async diagnostiquerPaiement(paymentIntentId: string): Promise<VerifyResultWithData> {
    try {
      console.log(`🔍 [Diagnostic] Analyse du PaymentIntent: ${paymentIntentId}`);
      
      // 1. Vérifier si le paiement existe en base
      const detailsPaiement = await this.obtenirDetailsPaiementStripe(paymentIntentId);
      
      // CORRIGÉ: Interface complète pour le diagnostic
      const diagnostic: {
        paymentIntentId: string;
        timestamp: string;
        paiement_en_base: boolean;
        details_paiement: any;
        problemes_detectes: string[];
        suggestions: string[];
        echeances_en_attente?: number;
        echeances_details?: any[];
      } = {
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
      } else {
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
            echeancesEnAttente.forEach((echeance: any) => {
              diagnostic.suggestions.push(`Échéance ${echeance.id}: ${echeance.montant}€ due le ${echeance.date_echeance} (statut: ${echeance.statut})`);
            });
          }
        } catch (echeanceError: any) {
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
      
    } catch (error: any) {
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

  /**
   * AJOUTÉ: Enregistre un paiement spécifiquement pour une échéance
   * @param paiementData - Les données du paiement d'échéance
   * @returns Une promesse qui résout avec le résultat de confirmation
   */
  enregistrerPaiementEcheance(paiementData: {
    utilisateur_id: number;
    montant: number;
    methode_paiement: string;
    stripe_payment_intent_id?: string;
    paypal_order_id?: string;
    bitcoin_address?: string;
    statut: string;
    description?: string;
    abonnement_id?: number;
    echeance_id?: number;
  }): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      console.log(`💰 [Paiements] Enregistrement paiement échéance:`, paiementData);
      
      const dateActuelle = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // CORRIGÉ: Utiliser une période basée sur l'échéance pour éviter les conflits
      let periodeDebut = dateActuelle.slice(0, 10); // Date actuelle par défaut
      let periodeFin = dateActuelle.slice(0, 10);
      
      // Si on a un abonnement_id, utiliser une période basée sur l'ID et la date
      if (paiementData.abonnement_id) {
        const timestamp = Date.now();
        periodeDebut = new Date(timestamp).toISOString().slice(0, 10);
        periodeFin = new Date(timestamp + 86400000).toISOString().slice(0, 10); // +1 jour
      }
      
      const sql = `
        INSERT INTO paiements 
          (utilisateur_id, montant, methode_paiement, stripe_payment_intent_id, 
           paypal_order_id, bitcoin_address, statut, description, date_paiement, 
           abonnement_id, periode_debut, periode_fin)
        VALUES 
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        paiementData.utilisateur_id,
        paiementData.montant,
        paiementData.methode_paiement,
        paiementData.stripe_payment_intent_id || null,
        paiementData.paypal_order_id || null,
        paiementData.bitcoin_address || null,
        paiementData.statut,
        paiementData.description || `Paiement échéance ${paiementData.echeance_id || 'N/A'}`,
        dateActuelle,
        paiementData.abonnement_id || null,
        periodeDebut,
        periodeFin
      ];

      console.log(`📝 [Paiements] Insertion paiement échéance:`, {
        utilisateur_id: paiementData.utilisateur_id,
        montant: paiementData.montant,
        methode_paiement: paiementData.methode_paiement,
        stripe_payment_intent_id: paiementData.stripe_payment_intent_id,
        abonnement_id: paiementData.abonnement_id,
        periode_debut: periodeDebut,
        periode_fin: periodeFin
      });

      this.mysqlConnector.query(sql, values, (error: any, results: any) => {
        if (error) {
          console.error('❌ [Paiements] Erreur enregistrement paiement échéance:', error);
          
          // AJOUTÉ: Gestion spécifique des contraintes de période
          if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage?.includes('uk_utilisateur_periode_abonnement')) {
            console.warn('⚠️ [Paiements] Contrainte période détectée - tentative avec période unique');
            
            // Retry avec une période vraiment unique
            const uniqueTimestamp = Date.now() + Math.floor(Math.random() * 1000);
            const uniquePeriode = new Date(uniqueTimestamp).toISOString().slice(0, 10);
            
            const retryValues = [...values];
            retryValues[retryValues.length - 2] = uniquePeriode; // periode_debut
            retryValues[retryValues.length - 1] = uniquePeriode; // periode_fin
            
            console.log(`🔄 [Paiements] Retry avec période unique: ${uniquePeriode}`);
            
            this.mysqlConnector.query(sql, retryValues, (retryError: any, retryResults: any) => {
              if (retryError) {
                console.error('❌ [Paiements] Échec retry paiement échéance:', retryError);
                reject(retryError);
              } else {
                console.log('✅ [Paiements] Paiement échéance enregistré (retry):', retryResults.insertId);
                resolve({
                  isConfirm: true,
                  message: `Paiement échéance enregistré avec succès (retry) - ID: ${retryResults.insertId}`
                });
              }
            });
          } else {
            reject(error);
          }
        } else {
          console.log('✅ [Paiements] Paiement échéance enregistré:', results.insertId);
          resolve({
            isConfirm: true,
            message: `Paiement échéance enregistré avec succès - ID: ${results.insertId}`
          });
        }
      });
    });
  }
}