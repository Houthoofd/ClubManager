import { prisma } from "@/infrastructure/database/prisma-client.js";
import { getStripeService } from "./stripe.service.js";

/**
 * Service pour gérer la logique métier des paiements
 * Gère la confirmation, l'enregistrement en DB, et la mise à jour des statuts
 */

export interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
  [key: string]: any;
}

export interface PaymentRecord {
  paiement_id: number;
  statut: string;
  montant: number;
}

/**
 * Service Payment
 */
export class PaymentServiceClass {
  constructor() {
    console.log("✅ [Service Payment] Service initialisé");
  }

  /**
   * Vérifier qu'une échéance existe et appartient à l'utilisateur
   */
  async verifierEcheance(
    echeanceId: number,
    userId: number,
  ): Promise<{ valid: boolean; echeance?: any; error?: string }> {
    console.log(
      `🔍 [Service Payment] Vérification échéance ${echeanceId} pour utilisateur ${userId}`,
    );

    try {
      // Récupérer l'échéance directement avec Prisma
      const echeance = await prisma.echeances_paiements.findUnique({
        where: { id: echeanceId },
      });

      if (!echeance) {
        return {
          valid: false,
          error: "Échéance introuvable",
        };
      }

      // Vérifier ownership
      if (echeance.utilisateur_id !== userId) {
        return {
          valid: false,
          error: "Cette échéance ne vous appartient pas",
        };
      }

      // Vérifier statut (enum values: pay_, en_attente)
      if (echeance.statut === "pay_") {
        return {
          valid: false,
          error: "Cette échéance est déjà payée",
        };
      }

      return {
        valid: true,
        echeance,
      };
    } catch (error) {
      console.error(
        `❌ [Service Payment] Erreur vérification échéance:`,
        error,
      );
      return {
        valid: false,
        error: "Erreur lors de la vérification de l'échéance",
      };
    }
  }

  /**
   * Vérifier qu'une commande existe et appartient à l'utilisateur
   */
  async verifierCommande(
    commandeId: number,
    userId: number,
  ): Promise<{ valid: boolean; commande?: any; error?: string }> {
    console.log(
      `🔍 [Service Payment] Vérification commande ${commandeId} pour utilisateur ${userId}`,
    );

    try {
      const commande = await prisma.commandes.findUnique({
        where: { id: commandeId },
        include: {
          commande_articles: true,
        },
      });

      if (!commande) {
        return {
          valid: false,
          error: "Commande introuvable",
        };
      }

      // Vérifier ownership
      if (commande.utilisateur_id !== userId) {
        return {
          valid: false,
          error: "Cette commande ne vous appartient pas",
        };
      }

      // Vérifier que la commande a des articles
      if (
        !commande.commande_articles ||
        commande.commande_articles.length === 0
      ) {
        return {
          valid: false,
          error: "La commande ne contient aucun article",
        };
      }

      return {
        valid: true,
        commande,
      };
    } catch (error) {
      console.error(
        `❌ [Service Payment] Erreur vérification commande:`,
        error,
      );
      return {
        valid: false,
        error: "Erreur lors de la vérification de la commande",
      };
    }
  }

  /**
   * Créer une commande si nécessaire
   */
  async creerCommandeSiNecessaire(
    commande: any,
    userId: number,
  ): Promise<{ commandeId: number; created: boolean }> {
    // Si c'est un ID, on le retourne directement
    if (typeof commande === "number") {
      return { commandeId: commande, created: false };
    }

    // Si c'est un objet avec un ID, on le retourne
    if (commande.id) {
      return { commandeId: commande.id, created: false };
    }

    // Sinon, créer une nouvelle commande
    console.log(
      `📦 [Service Payment] Création nouvelle commande pour utilisateur ${userId}`,
    );

    try {
      const nouvelleCommande = await prisma.commandes.create({
        data: {
          utilisateur_id: userId,
          total: commande.total || 0,
          statut: "en_attente",
          date_commande: new Date(),
        },
      });

      console.log(
        `✅ [Service Payment] Commande créée: ${nouvelleCommande.id}`,
      );

      return {
        commandeId: nouvelleCommande.id,
        created: true,
      };
    } catch (error) {
      console.error(`❌ [Service Payment] Erreur création commande:`, error);
      throw new Error("Impossible de créer la commande");
    }
  }

  /**
   * Vérifier si c'est le premier paiement de l'utilisateur
   */
  async estPremierPaiement(userId: number): Promise<boolean> {
    console.log(
      `🔍 [Service Payment] Vérification premier paiement utilisateur ${userId}`,
    );

    try {
      const paiementsCount = await prisma.paiements.count({
        where: {
          utilisateur_id: userId,
          statut: "reussi",
        },
      });
      const premierPaiement = paiementsCount === 0;
      console.log(
        `${premierPaiement ? "🎉" : "✅"} [Service Payment] Premier paiement: ${premierPaiement}`,
      );
      return premierPaiement;
    } catch (error) {
      console.error(
        `❌ [Service Payment] Erreur vérification premier paiement:`,
        error,
      );
      // En cas d'erreur, on considère que ce n'est pas le premier
      return false;
    }
  }

  /**
   * Marquer une échéance comme payée
   */
  async marquerEcheancePayee(
    echeanceId: number,
    paymentIntentId: string,
  ): Promise<void> {
    console.log(
      `✅ [Service Payment] Marquage échéance ${echeanceId} comme payée`,
    );

    try {
      await prisma.echeances_paiements.update({
        where: { id: echeanceId },
        data: {
          statut: "pay_", // Enum value from Prisma schema: pay_ = "payé"
          date_paiement: new Date(),
        },
      });
      console.log(
        `✅ [Service Payment] Échéance ${echeanceId} marquée comme payée`,
      );
    } catch (error) {
      console.error(`❌ [Service Payment] Erreur marquage échéance:`, error);
      throw error;
    }
  }

  /**
   * Enregistrer un paiement dans la base de données
   */
  async enregistrerPaiement(data: {
    utilisateur_id: number;
    montant: number;
    methode_paiement: string;
    stripe_payment_intent_id?: string;
    statut: string;
    description: string;
    commande_id?: number;
    echeance_id?: number;
    abonnement_id?: number;
  }): Promise<number> {
    console.log(
      `💾 [Service Payment] Enregistrement paiement pour utilisateur ${data.utilisateur_id}`,
    );

    try {
      const paiement = await prisma.paiements.create({
        data: {
          utilisateur_id: data.utilisateur_id,
          montant: data.montant,
          statut: data.statut,
          stripe_payment_intent_id: data.stripe_payment_intent_id,
          description: data.description,
          date_paiement: new Date(),
        },
      });
      const paiementId = paiement.id;
      console.log(`✅ [Service Payment] Paiement enregistré: ${paiementId}`);
      return paiementId;
    } catch (error) {
      console.error(
        `❌ [Service Payment] Erreur enregistrement paiement:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Confirmer un paiement d'échéance
   */
  async confirmerPaiementEcheance(data: {
    paymentIntentId: string;
    echeanceId: number;
    userId: number;
    amount: number;
  }): Promise<ConfirmationResult> {
    console.log(
      `🔄 [Service Payment] Confirmation paiement échéance ${data.echeanceId}`,
    );

    try {
      // Vérifier le statut du paiement sur Stripe
      const stripeService = getStripeService();
      const paymentIntent = await stripeService.recupererPaymentIntent(
        data.paymentIntentId,
      );

      if (paymentIntent.status !== "succeeded") {
        return {
          isConfirm: false,
          message: `Le paiement n'est pas encore confirmé (statut: ${paymentIntent.status})`,
          stripeStatus: paymentIntent.status,
        };
      }

      // Vérifier l'échéance
      const verif = await this.verifierEcheance(data.echeanceId, data.userId);
      if (!verif.valid) {
        return {
          isConfirm: false,
          message: verif.error || "Échéance invalide",
        };
      }

      // Vérifier si c'est le premier paiement
      const premierPaiement = await this.estPremierPaiement(data.userId);

      // Marquer l'échéance comme payée
      await this.marquerEcheancePayee(data.echeanceId, data.paymentIntentId);

      // Enregistrer le paiement
      const paiementId = await this.enregistrerPaiement({
        utilisateur_id: data.userId,
        montant: data.amount,
        methode_paiement: "stripe",
        stripe_payment_intent_id: data.paymentIntentId,
        statut: "validé",
        description: `Paiement échéance #${data.echeanceId}`,
        echeance_id: data.echeanceId,
        abonnement_id: verif.echeance?.abonnement_id,
      });

      console.log(
        `✅ [Service Payment] Paiement échéance confirmé: ${paiementId}`,
      );

      return {
        isConfirm: true,
        message: "Paiement confirmé avec succès",
        paiement_id: paiementId,
        premier_paiement: premierPaiement,
        echeance_mise_a_jour: true,
      };
    } catch (error) {
      console.error(
        `❌ [Service Payment] Erreur confirmation paiement:`,
        error,
      );
      return {
        isConfirm: false,
        message: "Erreur lors de la confirmation du paiement",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Confirmer un paiement de commande
   */
  async confirmerPaiementCommande(data: {
    paymentIntentId: string;
    commandeId: number;
    userId: number;
    amount: number;
  }): Promise<ConfirmationResult> {
    console.log(
      `🔄 [Service Payment] Confirmation paiement commande ${data.commandeId}`,
    );

    try {
      // Vérifier le statut du paiement sur Stripe
      const stripeService = getStripeService();
      const paymentIntent = await stripeService.recupererPaymentIntent(
        data.paymentIntentId,
      );

      if (paymentIntent.status !== "succeeded") {
        return {
          isConfirm: false,
          message: `Le paiement n'est pas encore confirmé (statut: ${paymentIntent.status})`,
          stripeStatus: paymentIntent.status,
        };
      }

      // Vérifier la commande
      const verif = await this.verifierCommande(data.commandeId, data.userId);
      if (!verif.valid) {
        return {
          isConfirm: false,
          message: verif.error || "Commande invalide",
        };
      }

      // Vérifier si c'est le premier paiement
      const premierPaiement = await this.estPremierPaiement(data.userId);

      // Mettre à jour le statut de la commande
      await prisma.commandes.update({
        where: { id: data.commandeId },
        data: {
          statut: "pay_e", // Enum value from Prisma schema: pay_e = "payée"
        },
      });

      // Enregistrer le paiement
      const paiementId = await this.enregistrerPaiement({
        utilisateur_id: data.userId,
        montant: data.amount,
        methode_paiement: "stripe",
        stripe_payment_intent_id: data.paymentIntentId,
        statut: "validé",
        description: `Paiement commande #${data.commandeId}`,
        commande_id: data.commandeId,
      });

      console.log(
        `✅ [Service Payment] Paiement commande confirmé: ${paiementId}`,
      );

      return {
        isConfirm: true,
        message: "Paiement confirmé avec succès",
        paiement_id: paiementId,
        premier_paiement: premierPaiement,
        commande_statut: "payée",
      };
    } catch (error) {
      console.error(
        `❌ [Service Payment] Erreur confirmation paiement:`,
        error,
      );
      return {
        isConfirm: false,
        message: "Erreur lors de la confirmation du paiement",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }
}

// Export class et singleton
export { PaymentServiceClass as PaymentService };

let paymentServiceInstance: PaymentServiceClass | null = null;

export function getPaymentService(): PaymentServiceClass {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentServiceClass();
  }
  return paymentServiceInstance;
}

// Méthode getInstance pour compatibilité
(PaymentServiceClass as any).getInstance = function (): PaymentServiceClass {
  return getPaymentService();
};

export default getPaymentService;
