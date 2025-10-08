import MysqlConnector from '../../connector/mysqlconnector.js';
import { UserData, VerifyResultWithData, ConfirmationResult } from '@clubmanager/types';

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

  /**
   * MISE À JOUR: Enregistrer un paiement d'échéance avec interface corrigée
   */
  async enregistrerPaiementEcheance(paiementData: {
    utilisateur_id: number;
    montant: number;
    methode_paiement: string;
    stripe_payment_intent_id?: string;
    paypal_order_id?: string;
    bitcoin_address?: string;
    statut: string;
    description?: string;
    abonnement_id?: number;
    periode_debut?: Date;
    periode_fin?: Date;
  }): Promise<ConfirmationResult> {
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

      this.mysqlConnector.query(sql, values, (error: any, results: any) => {
        if (error) {
          console.error('❌ Erreur enregistrement paiement échéance:', error);
          reject(error);
        } else {
          console.log('✅ Paiement échéance enregistré avec ID:', results.insertId);
          resolve({
            isConfirm: true,
            message: 'Paiement enregistré avec succès'
          });
        }
      });
    });
  }

  /**
   * NOUVELLE MÉTHODE: Vérifier si c'est le premier paiement de l'utilisateur
   */
  async estPremierPaiement(utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count 
        FROM paiements 
        WHERE utilisateur_id = ? AND statut = 'validé'
      `;

      this.mysqlConnector.query(sql, [utilisateurId], (error: any, results: any[]) => {
        if (error) {
          console.error('❌ Erreur vérification premier paiement:', error);
          reject(error);
        } else {
          const count = results[0].count;
          resolve(count === 0);
        }
      });
    });
  }

  /**
   * NOUVELLE MÉTHODE: Exécuter une requête de manière asynchrone
   */
  async queryAsync(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(sql, params, (error: any, results: any) => {
        if (error) {
          console.error('❌ Erreur requête SQL:', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * NOUVELLE MÉTHODE: Marquer une échéance comme payée
   */
  async marquerEcheancePayee(echeanceId: number): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE echeances_paiements 
        SET statut = 'payé', date_paiement = CURDATE() 
        WHERE id = ?
      `;

      this.mysqlConnector.query(sql, [echeanceId], (error: any, results: any) => {
        if (error) {
          console.error('❌ Erreur marquage échéance payée:', error);
          reject(error);
        } else {
          resolve({
            isConfirm: results.affectedRows > 0,
            message: results.affectedRows > 0 
              ? 'Échéance marquée comme payée' 
              : 'Aucune échéance trouvée'
          });
        }
      });
    });
  }
}