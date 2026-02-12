/**
 * Service de confirmation de paiement
 *
 * Orchestre toutes les opérations nécessaires après un paiement réussi :
 * - Vérification du payment intent Stripe
 * - Mise à jour du statut des échéances/commandes
 * - Upgrade du statut utilisateur (premier paiement)
 * - Envoi des emails de confirmation
 *
 * Migré vers Prisma avec intégration Sentry complète
 *
 * @module confirmation.service
 */

import { StripeService } from "./stripe.service.js";
import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import { emailClient } from "../../../../infrastructure/external-services/email/index.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "../../../../shared/config/sentry.config.js";
import Stripe from "stripe";

/**
 * Service de confirmation de paiement
 */
export class ConfirmationService {
  private stripeService: StripeService;

  constructor() {
    this.stripeService = StripeService.getInstance();
  }

  /**
   * Confirme un paiement d'échéance
   * Orchestre : vérification Stripe, mise à jour DB, upgrade statut, envoi email
   */
  public async confirmEcheancePayment(params: {
    paymentIntentId: string;
    echeanceId: number;
    userId: number;
    amount: number;
  }): Promise<{
    success: boolean;
    message: string;
    paiement_id?: string;
    echeance_id: number;
    premier_paiement: boolean;
    statut_upgrade?: string;
    promotion_effectuee: boolean;
    email_envoye: boolean;
    user_info?: {
      email: string;
      nom_complet: string;
      nouveau_statut?: string;
    };
  }> {
    try {
      addSentryBreadcrumb(
        `Confirmation paiement échéance: ${params.echeanceId}`,
        "payment.confirmation",
        "info",
        {
          echeanceId: params.echeanceId,
          userId: params.userId,
          paymentIntentId: params.paymentIntentId,
          amount: params.amount,
        },
      );

      console.log(
        "🔔 [Confirmation Service] Confirmation paiement échéance:",
        params,
      );

      // 1. Vérifier le payment intent sur Stripe
      const paymentIntent = await this.stripeService.retrievePaymentIntent(
        params.paymentIntentId,
      );

      console.log("✅ [Confirmation Service] Payment Intent vérifié:", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      });

      if (paymentIntent.status !== "succeeded") {
        throw new Error(
          `Payment Intent n'est pas en statut succeeded: ${paymentIntent.status}`,
        );
      }

      // 2. Récupérer les informations utilisateur
      const userInfo = await prisma.utilisateurs.findUnique({
        where: { id: params.userId },
        include: {
          status: true,
        },
      });

      if (!userInfo) {
        throw new Error(`Utilisateur ${params.userId} introuvable`);
      }

      console.log("👤 [Confirmation Service] Utilisateur récupéré:", {
        id: userInfo.id,
        email: userInfo.email,
        status: userInfo.status_id,
      });

      // 3. Vérifier que l'échéance n'est pas déjà payée
      const echeance = await prisma.echeances.findUnique({
        where: { id: params.echeanceId },
      });

      if (!echeance) {
        throw new Error(`Échéance ${params.echeanceId} introuvable`);
      }

      const statutsPayes = ["payé", "paye", "completed", "paid"];
      if (statutsPayes.includes(echeance.statut?.toLowerCase() || "")) {
        console.warn("⚠️ [Confirmation Service] Échéance déjà payée");
        return {
          success: true,
          message: "Paiement déjà enregistré",
          echeance_id: params.echeanceId,
          premier_paiement: false,
          promotion_effectuee: false,
          email_envoye: false,
          user_info: {
            email: userInfo.email,
            nom_complet: `${userInfo.prenom} ${userInfo.nom}`,
          },
        };
      }

      // 4. Mettre à jour le statut de l'échéance
      await prisma.echeances.update({
        where: { id: params.echeanceId },
        data: {
          statut: "payé",
          date_paiement: new Date(),
        },
      });

      console.log("✅ [Confirmation Service] Échéance mise à jour");

      // 5. Vérifier si c'est le premier paiement
      const paiementsCount = await prisma.echeances.count({
        where: {
          utilisateur_id: params.userId,
          statut: {
            in: ["payé", "paye"],
          },
        },
      });

      const premierPaiement = paiementsCount === 1; // Vient de payer la première échéance
      console.log(
        "🎯 [Confirmation Service] Premier paiement ?",
        premierPaiement,
      );

      let statutUpgrade: string | undefined;
      let promotionEffectuee = false;

      // 6. Upgrade du statut utilisateur si premier paiement
      if (premierPaiement && userInfo.status_id !== 5) {
        console.log(
          "🎊 [Confirmation Service] Premier paiement détecté, upgrade statut...",
        );

        const statusActuel = userInfo.status_id;

        // Upgrade vers statut "Actif" (ID 5)
        const nouveauStatut = 5;

        await prisma.utilisateurs.update({
          where: { id: params.userId },
          data: {
            status_id: nouveauStatut,
          },
        });

        statutUpgrade = "Actif";
        promotionEffectuee = true;

        addSentryBreadcrumb(
          `Promotion utilisateur ${params.userId} vers statut Actif`,
          "payment.promotion",
          "info",
          {
            userId: params.userId,
            ancienStatut: statusActuel,
            nouveauStatut,
          },
        );

        console.log("✅ [Confirmation Service] Statut utilisateur upgradé:", {
          ancien: statusActuel,
          nouveau: nouveauStatut,
        });
      }

      // 7. Envoyer l'email de confirmation
      let emailEnvoye = false;

      try {
        const templateVariables = {
          userName: `${userInfo.prenom} ${userInfo.nom}`,
          amount: (params.amount / 100).toFixed(2),
          paymentDate: new Date().toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          description: echeance.description || "Paiement échéance",
          dateEcheance: echeance.date_echeance
            ? new Date(echeance.date_echeance).toLocaleDateString("fr-FR")
            : "N/A",
          promotionMessage: promotionEffectuee
            ? "Félicitations ! Vous avez été promu au statut Actif."
            : "",
        };

        const emailResult = await emailClient.sendEmail({
          to: userInfo.email,
          subject: "Confirmation de paiement",
          templateTitle: "confirmation-paiement-echeance",
          variables: templateVariables,
        });

        emailEnvoye = emailResult.success;
        console.log("📧 [Confirmation Service] Email envoyé:", emailEnvoye);
      } catch (emailError: any) {
        console.error(
          "⚠️ [Confirmation Service] Erreur envoi email:",
          emailError,
        );

        captureException(emailError, {
          level: "warning",
          tags: {
            service: "confirmation",
            operation: "sendEmail",
            type: "echeance",
          },
          extra: {
            userId: params.userId,
            echeanceId: params.echeanceId,
          },
        });
        // Ne pas bloquer le processus si l'email échoue
      }

      addSentryBreadcrumb(
        `Paiement échéance confirmé avec succès: ${params.echeanceId}`,
        "payment.confirmation",
        "info",
        {
          echeanceId: params.echeanceId,
          premierPaiement,
          promotionEffectuee,
          emailEnvoye,
        },
      );

      return {
        success: true,
        message: "Paiement confirmé avec succès",
        paiement_id: paymentIntent.id,
        echeance_id: params.echeanceId,
        premier_paiement: premierPaiement,
        statut_upgrade: statutUpgrade,
        promotion_effectuee: promotionEffectuee,
        email_envoye: emailEnvoye,
        user_info: {
          email: userInfo.email,
          nom_complet: `${userInfo.prenom} ${userInfo.nom}`,
          nouveau_statut: statutUpgrade,
        },
      };
    } catch (error: any) {
      console.error(
        "❌ [Confirmation Service] Erreur confirmation paiement échéance:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "confirmation",
          operation: "confirmEcheancePayment",
        },
        extra: {
          paymentIntentId: params.paymentIntentId,
          echeanceId: params.echeanceId,
          userId: params.userId,
          amount: params.amount,
        },
      });

      throw error;
    }
  }

  /**
   * Confirme un paiement de commande
   * Orchestre : vérification Stripe, mise à jour DB, enregistrement paiement, envoi email
   */
  public async confirmCommandePayment(params: {
    paymentIntentId: string;
    commandeId: number;
    userId: number;
    amount: number;
  }): Promise<{
    success: boolean;
    message: string;
    payment_intent_id: string;
    commande_id: number;
    montant: number;
    statut: string;
    date_confirmation: Date;
    email_envoye: boolean;
    user_info?: {
      email: string;
      nom_complet: string;
      numero_commande: string;
    };
    articles_count?: number;
  }> {
    try {
      addSentryBreadcrumb(
        `Confirmation paiement commande: ${params.commandeId}`,
        "payment.confirmation",
        "info",
        {
          commandeId: params.commandeId,
          userId: params.userId,
          paymentIntentId: params.paymentIntentId,
          amount: params.amount,
        },
      );

      console.log(
        "🔔 [Confirmation Service] Confirmation paiement commande:",
        params,
      );

      // 1. Vérifier le payment intent sur Stripe
      const paymentIntent = await this.stripeService.retrievePaymentIntent(
        params.paymentIntentId,
      );

      console.log("✅ [Confirmation Service] Payment Intent vérifié:", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      });

      if (paymentIntent.status !== "succeeded") {
        throw new Error(
          `Payment Intent n'est pas en statut succeeded: ${paymentIntent.status}`,
        );
      }

      // 2. Récupérer les informations de la commande et de l'utilisateur
      const commandeInfo = await prisma.commandes.findUnique({
        where: { id: params.commandeId },
        include: {
          utilisateurs: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
          articles_commandes: {
            include: {
              articles: true,
            },
          },
        },
      });

      if (!commandeInfo) {
        throw new Error(`Commande ${params.commandeId} introuvable`);
      }

      console.log("📦 [Confirmation Service] Commande récupérée:", {
        id: commandeInfo.id,
        utilisateur_id: commandeInfo.utilisateur_id,
        statut: commandeInfo.statut,
      });

      // 3. Vérifier que la commande n'est pas déjà payée
      const statutsPayes = ["payé", "paye", "completed", "paid"];
      if (statutsPayes.includes(commandeInfo.statut?.toLowerCase() || "")) {
        console.warn("⚠️ [Confirmation Service] Commande déjà payée");
        return {
          success: true,
          message: "Paiement déjà enregistré",
          payment_intent_id: params.paymentIntentId,
          commande_id: params.commandeId,
          montant: params.amount,
          statut: commandeInfo.statut || "payé",
          date_confirmation: new Date(),
          email_envoye: false,
        };
      }

      // 4. Mettre à jour le statut de la commande
      await prisma.commandes.update({
        where: { id: params.commandeId },
        data: {
          statut: "payé",
          date_paiement: new Date(),
        },
      });

      console.log("✅ [Confirmation Service] Commande mise à jour");

      // 5. Enregistrer le paiement dans la table paiements
      await prisma.paiements.create({
        data: {
          utilisateur_id: params.userId,
          commande_id: params.commandeId,
          montant: params.amount / 100, // Convertir centimes en euros
          stripe_payment_intent_id: params.paymentIntentId,
          statut: "completed",
          date_paiement: new Date(),
        },
      });

      console.log("✅ [Confirmation Service] Paiement enregistré en DB");

      // 6. Envoyer l'email de confirmation
      let emailEnvoye = false;

      try {
        const templateVariables = {
          userName: `${commandeInfo.utilisateurs.prenom} ${commandeInfo.utilisateurs.nom}`,
          numeroCommande:
            commandeInfo.numero_commande || `CMD-${commandeInfo.id}`,
          dateCommande: new Date().toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          totalCommande: (params.amount / 100).toFixed(2),
          nbArticles: commandeInfo.articles_commandes.length,
        };

        const emailResult = await emailClient.sendEmail({
          to: commandeInfo.utilisateurs.email,
          subject: "Confirmation de paiement de commande",
          templateTitle: "confirmation-paiement-commande",
          variables: templateVariables,
        });

        emailEnvoye = emailResult.success;
        console.log("📧 [Confirmation Service] Email envoyé:", emailEnvoye);
      } catch (emailError: any) {
        console.error(
          "⚠️ [Confirmation Service] Erreur envoi email:",
          emailError,
        );

        captureException(emailError, {
          level: "warning",
          tags: {
            service: "confirmation",
            operation: "sendEmail",
            type: "commande",
          },
          extra: {
            userId: params.userId,
            commandeId: params.commandeId,
          },
        });
        // Ne pas bloquer le processus si l'email échoue
      }

      addSentryBreadcrumb(
        `Paiement commande confirmé avec succès: ${params.commandeId}`,
        "payment.confirmation",
        "info",
        {
          commandeId: params.commandeId,
          articlesCount: commandeInfo.articles_commandes.length,
          emailEnvoye,
        },
      );

      return {
        success: true,
        message: "Paiement commande confirmé avec succès",
        payment_intent_id: params.paymentIntentId,
        commande_id: params.commandeId,
        montant: params.amount,
        statut: "payé",
        date_confirmation: new Date(),
        email_envoye: emailEnvoye,
        user_info: {
          email: commandeInfo.utilisateurs.email,
          nom_complet: `${commandeInfo.utilisateurs.prenom} ${commandeInfo.utilisateurs.nom}`,
          numero_commande:
            commandeInfo.numero_commande || `CMD-${commandeInfo.id}`,
        },
        articles_count: commandeInfo.articles_commandes.length,
      };
    } catch (error: any) {
      console.error(
        "❌ [Confirmation Service] Erreur confirmation paiement commande:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "confirmation",
          operation: "confirmCommandePayment",
        },
        extra: {
          paymentIntentId: params.paymentIntentId,
          commandeId: params.commandeId,
          userId: params.userId,
          amount: params.amount,
        },
      });

      throw error;
    }
  }
}
