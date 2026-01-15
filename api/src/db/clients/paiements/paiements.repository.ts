/**
 * Repository principal pour les opérations de base de données sur les Paiements
 * Responsabilité: Orchestration et délégation aux opérations de paiement
 * Pattern: Singleton
 */

import MysqlConnector from "../../connector/mysqlconnector.js";
import type {
  Paiement,
  PaiementAvecDetails,
  EcheancePaiement,
  EcheanceAvecDetails,
  Commande,
  CreatePaiementData,
  UpdatePaiementData,
  CreateEcheanceData,
  CreateCommandeData,
  CreateArticleCommandeData,
  ConfirmationResult,
  SearchResult,
  CreatePaiementResult,
  DetailsPaiementStripe,
  DiagnosticResult,
  PremierPaiementResult,
  StatistiquesPaiements,
  StatistiquesEcheances,
} from "./types.js";
import * as queries from "./queries/index.js";

/**
 * Repository principal pour la gestion des paiements
 */
export class PaiementsRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ==========================================================================
  // PAIEMENTS - LECTURE
  // ==========================================================================

  /**
   * Récupérer tous les paiements avec détails
   */
  async obtenirLesTousLesPaiements(): Promise<PaiementAvecDetails[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_PAIEMENTS,
        [],
        (error, results: any[]) => {
          if (error) {
            console.error(
              "Erreur lors de la récupération des paiements:",
              error,
            );
            reject(error);
          } else {
            resolve(results);
          }
        },
      );
    });
  }

  /**
   * Récupérer les paiements d'un utilisateur
   */
  async obtenirPaiementsParUtilisateur(
    utilisateurId: number,
  ): Promise<PaiementAvecDetails[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_PAIEMENTS_BY_USER,
        [utilisateurId],
        (error, results: any[]) => {
          if (error) {
            console.error(
              `Erreur lors de la récupération des paiements pour l'utilisateur ${utilisateurId}:`,
              error,
            );
            reject(error);
          } else {
            resolve(results);
          }
        },
      );
    });
  }

  /**
   * Récupérer un paiement par ID
   */
  async obtenirPaiementParId(paiementId: number): Promise<Paiement | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_PAIEMENT_BY_ID,
        [paiementId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0]);
          }
        },
      );
    });
  }

  /**
   * Récupérer les détails d'un paiement Stripe
   */
  async obtenirDetailsPaiementStripe(
    paymentIntentId: string,
  ): Promise<SearchResult<DetailsPaiementStripe | null>> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_PAIEMENT_STRIPE_DETAILS,
        [paymentIntentId],
        (error, results: any[]) => {
          if (error) {
            console.error(
              "Erreur lors de la récupération des détails Stripe:",
              error,
            );
            resolve({
              isFind: false,
              message: "Erreur lors de la récupération des détails",
              data: null,
            });
          } else if (results.length === 0) {
            resolve({
              isFind: false,
              message: "Paiement non trouvé",
              data: null,
            });
          } else {
            resolve({
              isFind: true,
              message: "Paiement trouvé",
              data: results[0],
            });
          }
        },
      );
    });
  }

  // ==========================================================================
  // PAIEMENTS - ÉCRITURE
  // ==========================================================================

  /**
   * Créer un nouveau paiement
   */
  async creerPaiement(data: CreatePaiementData): Promise<CreatePaiementResult> {
    try {
      const dateActuelle = new Date();
      const periodeUnique = data.periode_debut || dateActuelle;

      return new Promise((resolve, reject) => {
        this.mysqlConnector.query(
          queries.INSERT_PAIEMENT,
          [
            data.utilisateur_id,
            data.montant,
            data.date_paiement || dateActuelle,
            data.methode_paiement,
            data.statut || "valide",
            data.stripe_payment_intent_id || null,
            data.stripe_charge_id || null,
            data.abonnement_id || null,
            data.commande_id || null,
            data.echeance_id || null,
            data.periode_debut || null,
            data.periode_fin || null,
            data.notes || null,
          ],
          (error, results: any) => {
            if (error) {
              console.error("Erreur lors de la création du paiement:", error);
              resolve({
                isConfirm: false,
                message: "Erreur lors de la création du paiement",
              });
            } else {
              resolve({
                isConfirm: true,
                message: "Paiement créé avec succès",
                id: results.insertId,
                date_paiement: dateActuelle,
              });
            }
          },
        );
      });
    } catch (error) {
      console.error("Erreur lors de la création du paiement:", error);
      return {
        isConfirm: false,
        message: "Erreur lors de la création du paiement",
      };
    }
  }

  /**
   * Modifier un paiement
   */
  async modifierPaiement(
    paiementId: number,
    data: UpdatePaiementData,
  ): Promise<ConfirmationResult> {
    try {
      // Vérifier que le paiement existe
      const exists = await this.verifierPaiementExiste(paiementId);
      if (!exists) {
        return {
          isConfirm: false,
          message: "Paiement introuvable",
        };
      }

      return new Promise((resolve, reject) => {
        this.mysqlConnector.query(
          queries.UPDATE_PAIEMENT,
          [
            data.montant,
            data.methode_paiement,
            data.statut,
            data.stripe_payment_intent_id,
            data.stripe_charge_id,
            data.notes,
            paiementId,
          ],
          (error, results: any) => {
            if (error) {
              console.error(
                "Erreur lors de la modification du paiement:",
                error,
              );
              resolve({
                isConfirm: false,
                message: "Erreur lors de la modification",
              });
            } else {
              resolve({
                isConfirm: results.affectedRows > 0,
                message:
                  results.affectedRows > 0
                    ? "Paiement modifié avec succès"
                    : "Aucune modification effectuée",
              });
            }
          },
        );
      });
    } catch (error) {
      console.error("Erreur lors de la modification du paiement:", error);
      return {
        isConfirm: false,
        message: "Erreur lors de la modification du paiement",
      };
    }
  }

  /**
   * Mettre à jour le statut d'un paiement
   */
  async mettreAJourStatutPaiement(
    paiementId: number,
    statut: string,
  ): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_PAIEMENT_STATUS,
        [statut, paiementId],
        (error, results: any) => {
          if (error) {
            console.error("Erreur lors de la mise à jour du statut:", error);
            resolve({
              isConfirm: false,
              message: "Erreur lors de la mise à jour du statut",
            });
          } else {
            resolve({
              isConfirm: results.affectedRows > 0,
              message:
                results.affectedRows > 0
                  ? "Statut mis à jour avec succès"
                  : "Aucune modification effectuée",
            });
          }
        },
      );
    });
  }

  /**
   * Annuler un paiement
   */
  async annulerPaiement(paiementId: number): Promise<ConfirmationResult> {
    try {
      // Vérifier que le paiement peut être annulé
      const canCancel = await this.verifierPaiementPeutEtreAnnule(paiementId);
      if (!canCancel) {
        return {
          isConfirm: false,
          message: "Ce paiement ne peut pas être annulé",
        };
      }

      return new Promise((resolve, reject) => {
        this.mysqlConnector.query(
          queries.CANCEL_PAIEMENT,
          [paiementId],
          (error, results: any) => {
            if (error) {
              console.error("Erreur lors de l'annulation du paiement:", error);
              resolve({
                isConfirm: false,
                message: "Erreur lors de l'annulation",
              });
            } else {
              resolve({
                isConfirm: results.affectedRows > 0,
                message:
                  results.affectedRows > 0
                    ? "Paiement annulé avec succès"
                    : "Aucune modification effectuée",
              });
            }
          },
        );
      });
    } catch (error) {
      console.error("Erreur lors de l'annulation du paiement:", error);
      return {
        isConfirm: false,
        message: "Erreur lors de l'annulation du paiement",
      };
    }
  }

  /**
   * Supprimer un paiement
   */
  async supprimerPaiement(paiementId: number): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_PAIEMENT,
        [paiementId],
        (error, results: any) => {
          if (error) {
            console.error("Erreur lors de la suppression du paiement:", error);
            resolve({
              isConfirm: false,
              message: "Erreur lors de la suppression",
            });
          } else {
            resolve({
              isConfirm: results.affectedRows > 0,
              message:
                results.affectedRows > 0
                  ? "Paiement supprimé avec succès"
                  : "Paiement non trouvé",
            });
          }
        },
      );
    });
  }

  /**
   * Enregistrer un paiement simple
   */
  async enregistrerPaiement(
    utilisateurId: number,
    montant: number,
    methodePaiement: string,
  ): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_PAIEMENT_SIMPLE,
        [utilisateurId, montant, methodePaiement],
        (error, results: any) => {
          if (error) {
            console.error(
              "Erreur lors de l'enregistrement du paiement:",
              error,
            );
            resolve({
              isConfirm: false,
              message: "Erreur lors de l'enregistrement",
            });
          } else {
            resolve({
              isConfirm: true,
              message: "Paiement enregistré avec succès",
            });
          }
        },
      );
    });
  }

  /**
   * Confirmer un paiement Stripe
   */
  async confirmerPaiementStripe(
    paiementId: number,
    stripeChargeId: string,
    statut: string = "valide",
  ): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_PAIEMENT_STRIPE,
        [stripeChargeId, statut, paiementId],
        (error, results: any) => {
          if (error) {
            console.error(
              "Erreur lors de la confirmation du paiement Stripe:",
              error,
            );
            resolve({
              isConfirm: false,
              message: "Erreur lors de la confirmation",
            });
          } else {
            resolve({
              isConfirm: results.affectedRows > 0,
              message:
                results.affectedRows > 0
                  ? "Paiement Stripe confirmé avec succès"
                  : "Paiement non trouvé",
            });
          }
        },
      );
    });
  }

  // ==========================================================================
  // ÉCHÉANCES - LECTURE
  // ==========================================================================

  /**
   * Récupérer les échéances d'un utilisateur
   */
  async obtenirEcheancesUtilisateur(
    userId: number,
  ): Promise<EcheanceAvecDetails[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ECHEANCES_BY_USER,
        [userId],
        (error, results: any[]) => {
          if (error) {
            console.error(
              "Erreur lors de la récupération des échéances:",
              error,
            );
            reject(error);
          } else {
            const echeances = results.map((row) => ({
              id: row.id,
              utilisateur_id: row.utilisateur_id,
              montant: row.montant,
              date_echeance: row.date_echeance,
              statut: row.statut,
              description: row.description,
              utilisateur: {
                first_name: row.first_name,
                last_name: row.last_name,
              },
              abonnement_nom: row.abonnement_nom,
            }));
            resolve(echeances);
          }
        },
      );
    });
  }

  /**
   * Récupérer les échéances pour un utilisateur (alias)
   */
  async obtenirEcheancesPourUtilisateur(
    userId: number,
  ): Promise<EcheancePaiement[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ECHEANCES_BY_USER,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        },
      );
    });
  }

  // ==========================================================================
  // ÉCHÉANCES - ÉCRITURE
  // ==========================================================================

  /**
   * Marquer une échéance comme payée
   */
  async marquerEcheancePayee(echeanceId: number): Promise<ConfirmationResult> {
    try {
      // Vérifier que l'échéance existe et n'est pas déjà payée
      const isAlreadyPaid = await this.verifierEcheanceEstPayee(echeanceId);
      if (isAlreadyPaid) {
        return {
          isConfirm: false,
          message: "Cette échéance est déjà payée",
          alreadyPaid: true,
        };
      }

      return new Promise((resolve, reject) => {
        this.mysqlConnector.query(
          queries.MARK_ECHEANCE_PAYEE,
          [echeanceId],
          (error, results: any) => {
            if (error) {
              console.error(
                "Erreur lors du marquage de l'échéance comme payée:",
                error,
              );
              resolve({
                isConfirm: false,
                message: "Erreur lors de la mise à jour",
              });
            } else {
              resolve({
                isConfirm: results.affectedRows > 0,
                message:
                  results.affectedRows > 0
                    ? "Échéance marquée comme payée"
                    : "Échéance non trouvée",
                affectedRows: results.affectedRows,
              });
            }
          },
        );
      });
    } catch (error) {
      console.error(
        "Erreur lors du marquage de l'échéance comme payée:",
        error,
      );
      return {
        isConfirm: false,
        message: "Erreur lors du marquage de l'échéance",
      };
    }
  }

  /**
   * Mettre à jour le statut d'une échéance
   */
  async mettreAJourStatutEcheance(
    echeanceId: number,
    nouveauStatut: string,
  ): Promise<ConfirmationResult> {
    try {
      // Vérifier que l'échéance existe
      const exists = await this.verifierEcheanceExiste(echeanceId);
      if (!exists) {
        return {
          isConfirm: false,
          message: "Échéance introuvable",
        };
      }

      return new Promise((resolve, reject) => {
        this.mysqlConnector.query(
          queries.UPDATE_ECHEANCE_STATUS,
          [nouveauStatut, echeanceId],
          (error, results: any) => {
            if (error) {
              console.error(
                "Erreur lors de la mise à jour du statut de l'échéance:",
                error,
              );
              resolve({
                isConfirm: false,
                message: "Erreur lors de la mise à jour",
              });
            } else {
              resolve({
                isConfirm: results.affectedRows > 0,
                message:
                  results.affectedRows > 0
                    ? "Statut de l'échéance mis à jour"
                    : "Aucune modification effectuée",
              });
            }
          },
        );
      });
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut de l'échéance:",
        error,
      );
      return {
        isConfirm: false,
        message: "Erreur lors de la mise à jour de l'échéance",
      };
    }
  }

  // ==========================================================================
  // COMMANDES
  // ==========================================================================

  /**
   * Créer une commande avec articles
   */
  async creerCommande(data: CreateCommandeData): Promise<ConfirmationResult> {
    try {
      return new Promise((resolve, reject) => {
        this.mysqlConnector.query(
          queries.INSERT_COMMANDE,
          [
            data.utilisateur_id,
            data.montant_total,
            data.statut || "en_attente",
            null,
            data.notes || null,
          ],
          async (error, results: any) => {
            if (error) {
              console.error(
                "Erreur lors de la création de la commande:",
                error,
              );
              resolve({
                isConfirm: false,
                message: "Erreur lors de la création de la commande",
              });
            } else {
              const commandeId = results.insertId;

              // Insérer les articles
              if (data.articles && data.articles.length > 0) {
                try {
                  await this.insererArticlesCommande(commandeId, data.articles);
                } catch (articleError) {
                  console.error(
                    "Erreur lors de l'insertion des articles:",
                    articleError,
                  );
                }
              }

              resolve({
                isConfirm: true,
                message: "Commande créée avec succès",
                commandeId,
              });
            }
          },
        );
      });
    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error);
      return {
        isConfirm: false,
        message: "Erreur lors de la création de la commande",
      };
    }
  }

  /**
   * Traiter une commande après paiement
   */
  async traiterCommandeApresPayment(
    paiementId: number,
  ): Promise<ConfirmationResult> {
    try {
      // Récupérer le paiement
      const paiement = await this.obtenirPaiementParId(paiementId);
      if (!paiement) {
        return {
          isConfirm: false,
          message: "Paiement introuvable",
        };
      }

      if (!paiement.commande_id) {
        return {
          isConfirm: false,
          message: "Aucune commande associée à ce paiement",
        };
      }

      // Mettre à jour le statut de la commande
      return new Promise((resolve, reject) => {
        this.mysqlConnector.query(
          queries.UPDATE_COMMANDE_STATUS,
          ["confirmee", paiement.commande_id],
          (error, results: any) => {
            if (error) {
              console.error(
                "Erreur lors de la mise à jour de la commande:",
                error,
              );
              resolve({
                isConfirm: false,
                message: "Erreur lors de la mise à jour de la commande",
              });
            } else {
              resolve({
                isConfirm: results.affectedRows > 0,
                message: "Commande confirmée après paiement",
              });
            }
          },
        );
      });
    } catch (error) {
      console.error("Erreur lors du traitement de la commande:", error);
      return {
        isConfirm: false,
        message: "Erreur lors du traitement de la commande",
      };
    }
  }

  // ==========================================================================
  // VALIDATIONS PRIVÉES
  // ==========================================================================

  /**
   * Vérifier si un paiement existe
   */
  private async verifierPaiementExiste(paiementId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_PAIEMENT_EXISTS,
        [paiementId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si un paiement peut être annulé
   */
  private async verifierPaiementPeutEtreAnnule(
    paiementId: number,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_PAIEMENT_CAN_CANCEL,
        [paiementId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si une échéance existe
   */
  private async verifierEcheanceExiste(echeanceId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_ECHEANCE_EXISTS,
        [echeanceId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si une échéance est déjà payée
   */
  private async verifierEcheanceEstPayee(echeanceId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_ECHEANCE_IS_PAYEE,
        [echeanceId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count > 0);
          }
        },
      );
    });
  }

  /**
   * Vérifier si c'est le premier paiement d'un utilisateur
   */
  async estPremierPaiement(userId: number): Promise<PremierPaiementResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_IS_FIRST_PAIEMENT,
        [userId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            const count = results[0]?.count || 0;
            resolve({
              isPremier: count === 0,
              count,
            });
          }
        },
      );
    });
  }

  // ==========================================================================
  // UTILITAIRES PRIVÉS
  // ==========================================================================

  /**
   * Insérer les articles d'une commande
   */
  private async insererArticlesCommande(
    commandeId: number,
    articles: CreateArticleCommandeData[],
  ): Promise<void> {
    const promises = articles.map((article) => {
      return new Promise<void>((resolve, reject) => {
        this.mysqlConnector.query(
          queries.INSERT_ARTICLE_COMMANDE,
          [
            commandeId,
            article.article_id,
            article.quantite,
            article.prix_unitaire,
          ],
          (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          },
        );
      });
    });

    await Promise.all(promises);
  }

  /**
   * Query async helper
   */
  private queryAsync(sql: string, values: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(sql, values, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // ==========================================================================
  // DIAGNOSTIC
  // ==========================================================================

  /**
   * Diagnostiquer un paiement
   */
  async diagnostiquerPaiement(
    paymentIntentId: string,
  ): Promise<DiagnosticResult> {
    try {
      const detailsPaiement =
        await this.obtenirDetailsPaiementStripe(paymentIntentId);

      const diagnostic = {
        timestamp: new Date().toISOString(),
        paiement_en_base: detailsPaiement.isFind,
        details_paiement: detailsPaiement.data,
        problemes_detectes: [] as string[],
        suggestions: [] as string[],
      };

      if (!detailsPaiement.isFind) {
        diagnostic.problemes_detectes.push("Paiement non trouvé en base");
        diagnostic.suggestions.push("Vérifier le payment_intent_id");
      }

      return {
        isFind: true,
        message: "Diagnostic effectué",
        data: diagnostic,
      };
    } catch (error) {
      console.error("Erreur lors du diagnostic:", error);
      return {
        isFind: false,
        message: "Erreur lors du diagnostic",
        data: { error: String(error) },
      };
    }
  }
}

// ==========================================================================
// SINGLETON
// ==========================================================================

let repositoryInstance: PaiementsRepository | null = null;

/**
 * Récupérer l'instance singleton du repository Paiements
 */
export function getPaiementsRepository(): PaiementsRepository {
  if (!repositoryInstance) {
    repositoryInstance = new PaiementsRepository();
  }
  return repositoryInstance;
}

/**
 * Export par défaut
 */
export default PaiementsRepository;
