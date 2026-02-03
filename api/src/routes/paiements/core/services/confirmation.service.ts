import { StripeService } from "./stripe.service.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../../db/clients/messagerie/emailClient.js";
import Stripe from "stripe";

/**
 * Service de confirmation de paiement
 * Orchestre toutes les opérations nécessaires après un paiement réussi
 */
export class ConfirmationService {
  private stripeService: StripeService;

  constructor(
    private paiementsClient?: Paiements,
    private emailClient?: EmailClient,
  ) {
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
    console.log(
      "🔔 [Confirmation Service] Confirmation paiement échéance:",
      params,
    );

    const client = this.paiementsClient || new Paiements();

    try {
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
      const userInfo = await client.obtenirUtilisateurParId(params.userId);

      if (!userInfo) {
        throw new Error(`Utilisateur ${params.userId} introuvable`);
      }

      console.log("👤 [Confirmation Service] Utilisateur récupéré:", {
        id: userInfo.id,
        email: userInfo.email,
        status: userInfo.status_id,
      });

      // 3. Vérifier que l'échéance n'est pas déjà payée
      const echeance = await client.obtenirEcheance(params.echeanceId);

      if (!echeance) {
        throw new Error(`Échéance ${params.echeanceId} introuvable`);
      }

      const statutsPayes = ["payé", "paye", "completed", "paid"];
      if (statutsPayes.includes(echeance.statut?.toLowerCase())) {
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
            nom_complet: `${userInfo.first_name} ${userInfo.last_name}`,
          },
        };
      }

      // 4. Mettre à jour le statut de l'échéance
      await client.mettreAJourStatutEcheance(params.echeanceId, "payé");
      console.log("✅ [Confirmation Service] Échéance mise à jour");

      // 5. Vérifier si c'est le premier paiement
      const premierPaiement = await client.estPremierPaiement(params.userId);
      console.log(
        "🎯 [Confirmation Service] Premier paiement ?",
        premierPaiement,
      );

      let statutUpgrade: string | undefined;
      let promotionEffectuee = false;

      // 6. Upgrade du statut utilisateur si premier paiement
      if (premierPaiement) {
        console.log(
          "🎊 [Confirmation Service] Premier paiement détecté, upgrade statut...",
        );

        const statusActuel = userInfo.status_id;

        // Upgrade vers statut "Actif" (ID 5)
        const nouveauStatut = 5;

        await client.upgradeStatutUtilisateur(params.userId, nouveauStatut);

        statutUpgrade = "Actif";
        promotionEffectuee = true;

        console.log("✅ [Confirmation Service] Statut utilisateur upgradé:", {
          ancien: statusActuel,
          nouveau: nouveauStatut,
        });
      }

      // 7. Envoyer l'email de confirmation
      let emailEnvoye = false;

      try {
        const emailClientInstance = this.emailClient || new EmailClient();

        const templateVariables = {
          userName: `${userInfo.first_name} ${userInfo.last_name}`,
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

        const emailResult = await emailClientInstance.envoyerEmail({
          to: userInfo.email,
          templateTitle: "confirmation-paiement-echeance",
          variables: templateVariables,
          utilisateurId: params.userId,
        });

        emailEnvoye = emailResult.success;
        console.log("📧 [Confirmation Service] Email envoyé:", emailEnvoye);
      } catch (emailError) {
        console.error(
          "⚠️ [Confirmation Service] Erreur envoi email:",
          emailError,
        );
        // Ne pas bloquer le processus si l'email échoue
      }

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
          nom_complet: `${userInfo.first_name} ${userInfo.last_name}`,
          nouveau_statut: statutUpgrade,
        },
      };
    } catch (error) {
      console.error(
        "❌ [Confirmation Service] Erreur confirmation paiement échéance:",
        error,
      );
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
    console.log(
      "🔔 [Confirmation Service] Confirmation paiement commande:",
      params,
    );

    const client = this.paiementsClient || new Paiements();

    try {
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
      const commandeInfo = await client.obtenirCommandeAvecUtilisateur(
        params.commandeId,
      );

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
      if (statutsPayes.includes(commandeInfo.statut?.toLowerCase())) {
        console.warn("⚠️ [Confirmation Service] Commande déjà payée");
        return {
          success: true,
          message: "Paiement déjà enregistré",
          payment_intent_id: params.paymentIntentId,
          commande_id: params.commandeId,
          montant: params.amount,
          statut: commandeInfo.statut,
          date_confirmation: new Date(),
          email_envoye: false,
        };
      }

      // 4. Mettre à jour le statut de la commande
      await client.mettreAJourStatutCommande(params.commandeId, "payé");
      console.log("✅ [Confirmation Service] Commande mise à jour");

      // 5. Enregistrer le paiement
      await client.enregistrerPaiement({
        stripe_payment_intent_id: params.paymentIntentId,
        commande_id: params.commandeId,
        utilisateur_id: params.userId,
        montant: params.amount / 100,
        statut: "completed",
      });

      // 6. Envoyer l'email de confirmation
      let emailEnvoye = false;

      try {
        const emailClientInstance = this.emailClient || new EmailClient();

        const templateVariables = {
          userName: `${commandeInfo.utilisateur_first_name} ${commandeInfo.utilisateur_last_name}`,
          numeroCommande:
            commandeInfo.numero_commande || commandeInfo.unique_id,
          dateCommande: new Date().toLocaleDateString("fr-FR"),
          totalCommande: (params.amount / 100).toFixed(2),
          nbArticles: commandeInfo.articles_count || 0,
        };

        const emailResult = await emailClientInstance.envoyerEmail({
          to: commandeInfo.utilisateur_email,
          templateTitle: "confirmation-paiement-commande",
          variables: templateVariables,
          utilisateurId: params.userId,
        });

        emailEnvoye = emailResult.success;
        console.log("📧 [Confirmation Service] Email envoyé:", emailEnvoye);
      } catch (emailError) {
        console.error(
          "⚠️ [Confirmation Service] Erreur envoi email:",
          emailError,
        );
        // Ne pas bloquer le processus si l'email échoue
      }

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
          email: commandeInfo.utilisateur_email,
          nom_complet: `${commandeInfo.utilisateur_first_name} ${commandeInfo.utilisateur_last_name}`,
          numero_commande:
            commandeInfo.numero_commande || commandeInfo.unique_id,
        },
        articles_count: commandeInfo.articles_count,
      };
    } catch (error) {
      console.error(
        "❌ [Confirmation Service] Erreur confirmation paiement commande:",
        error,
      );
      throw error;
    }
  }
}
