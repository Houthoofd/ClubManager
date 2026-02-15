/**
 * Service pour gérer les notifications email de paiement
 * Utilise le EmailClient existant
 */

export interface EmailResult {
  sent: boolean;
  message: string;
  error?: string;
}

export class EmailNotificationServiceClass {
  constructor() {
    console.log("✅ [Service Email Notification] Service initialisé");
  }

  /**
   * Envoyer une confirmation de paiement par email
   */
  async envoyerConfirmationPaiement(data: {
    email: string;
    userId: number;
    userName: string;
    amount: number;
    paymentIntentId: string;
    premierPaiement: boolean;
    statusUpgrade?: {
      upgraded: boolean;
      ancien_statut?: string;
      nouveau_statut?: string;
    };
  }): Promise<EmailResult> {
    console.log(
      `📧 [Service Email Notification] Envoi confirmation à ${data.email}`,
    );

    try {
      // Import du EmailClient depuis l'infrastructure
      const { EmailClient } =
        await import("@/infrastructure/external-services/emailClient.js");
      const emailClient = new EmailClient();

      // Préparer les variables du template
      const emailVariables = {
        userName: data.userName,
        amount: {
          style: "currency",
          currency: "EUR",
          value: data.amount,
        },
        paymentDate: new Date().toLocaleDateString("fr-FR"),
        currency: "EUR",
        datePaiement: new Date().toLocaleDateString("fr-FR"),
        paymentIntentId: data.paymentIntentId,
        premierPaiement: data.premierPaiement,
      };

      // Déterminer le type de template
      let templateType = "paiement";
      const templateVariables: any = {
        ...emailVariables,
        statusUpgrade: data.statusUpgrade?.upgraded || false,
        newStatus: data.statusUpgrade?.nouveau_statut || null,
        oldStatus: data.statusUpgrade?.ancien_statut || null,
        welcomeMessage: data.premierPaiement
          ? "Bienvenue ! Ceci est votre premier paiement."
          : null,
      };

      // Si c'est le premier paiement et qu'il y a un upgrade, ajouter des infos
      if (data.premierPaiement && data.statusUpgrade?.upgraded) {
        templateVariables.transactionId = data.paymentIntentId;
        templateVariables.isFirstPayment = true;
        templateVariables.premierPaiement = true;
        templateVariables.statutAncien = data.statusUpgrade.ancien_statut;
        templateVariables.statutNouveau = data.statusUpgrade.nouveau_statut;
      } else {
        templateVariables.transactionId = data.paymentIntentId;
        templateVariables.isFirstPayment = false;
        templateVariables.premierPaiement = false;
      }

      // Envoyer l'email
      const emailResult = await emailClient.sendEmail({
        to: data.email,
        subject: data.premierPaiement
          ? "Bienvenue ! Confirmation de votre premier paiement"
          : "Confirmation de paiement",
        templateTitle: templateType,
        variables: templateVariables,
      });

      if (emailResult.success) {
        console.log(`✅ [Service Email Notification] Email envoyé avec succès`);
        return {
          sent: true,
          message: "Email de confirmation envoyé",
        };
      } else {
        console.warn(
          `⚠️ [Service Email Notification] Échec envoi email:`,
          emailResult.error,
        );
        return {
          sent: false,
          message: "Échec de l'envoi de l'email",
          error: emailResult.error,
        };
      }
    } catch (error) {
      console.error(
        `❌ [Service Email Notification] Erreur envoi email:`,
        error,
      );

      // Important : ne pas bloquer le paiement si l'email échoue
      return {
        sent: false,
        message: "Erreur lors de l'envoi de l'email (paiement confirmé)",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Préparer les données utilisateur pour l'email
   */
  async preparerDonneesUtilisateur(userId: number): Promise<{
    nom: string;
    prenom: string;
    email: string;
  } | null> {
    try {
      // Utiliser Prisma au lieu du connector MySQL
      const { prisma } =
        await import("@/infrastructure/database/prisma-client.js");

      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { id: userId },
        select: {
          nom_utilisateur: true,
          first_name: true,
          email: true,
        },
      });

      if (!utilisateur) {
        return null;
      }

      return {
        nom: utilisateur.nom_utilisateur,
        prenom: utilisateur.first_name,
        email: utilisateur.email,
      };
    } catch (error) {
      console.error(
        `❌ [Service Email Notification] Erreur récupération utilisateur:`,
        error,
      );
      return null;
    }
  }
}

// Export class et singleton
export { EmailNotificationServiceClass as EmailNotificationService };

let emailNotificationServiceInstance: EmailNotificationServiceClass | null =
  null;

export function getEmailNotificationService(): EmailNotificationServiceClass {
  if (!emailNotificationServiceInstance) {
    emailNotificationServiceInstance = new EmailNotificationServiceClass();
  }
  return emailNotificationServiceInstance;
}

// Méthode getInstance pour compatibilité
(EmailNotificationServiceClass as any).getInstance =
  function (): EmailNotificationServiceClass {
    return getEmailNotificationService();
  };

export default getEmailNotificationService;
