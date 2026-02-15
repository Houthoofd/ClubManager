/**
 * Variables Preparator - Préparation et enrichissement des variables pour templates
 *
 * Améliorations v2.1 :
 * - Auto-injection des variables communes (clubName, currentYear, etc.)
 * - Helper fromUser() pour extraction automatique des données utilisateur
 * - Merge intelligent des variables
 * - Validation et normalisation
 */

import type { EmailTemplateVariables, UserEmailData } from "@clubmanager/types";

export class VariablesPreparator {
  /**
   * Variables communes injectées automatiquement dans tous les templates
   */
  private getCommonVariables(): Record<string, string> {
    return {
      clubName: process.env.CLUB_NAME || "Club Manager",
      clubWebsite: process.env.CLUB_WEBSITE || "http://localhost:5173",
      supportEmail: process.env.SUPPORT_EMAIL || "support@clubmanager.com",
      currentYear: new Date().getFullYear().toString(),
      currentDate: new Date().toLocaleDateString("fr-FR"),
      logoUrl: process.env.CLUB_LOGO_URL || "",
      companyAddress: process.env.CLUB_ADDRESS || "",
      unsubscribeUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/unsubscribe`
        : "",
    };
  }

  /**
   * Prépare les variables en injectant automatiquement les variables communes
   */
  prepare(
    customVariables: Record<string, string> = {},
  ): EmailTemplateVariables {
    const commonVars = this.getCommonVariables();

    // Merge : custom variables override common variables
    return {
      ...commonVars,
      ...customVariables,
    };
  }

  /**
   * Extrait les données d'un utilisateur pour les emails
   */
  fromUser(user: any): UserEmailData {
    if (!user) {
      throw new Error("User object is required");
    }

    const firstName = user.first_name || user.firstName || user.prenom || "";
    const lastName = user.last_name || user.lastName || user.nom || "";
    const email = user.email || "";
    const userId = user.id || user.utilisateurId || 0;

    return {
      email,
      userName: `${firstName} ${lastName}`.trim() || email,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      userId,
    };
  }

  /**
   * Prépare les variables communes pour tous les templates
   */
  prepareCommonVariables(
    customVariables: Record<string, string> = {},
  ): EmailTemplateVariables {
    return this.prepare(customVariables);
  }

  /**
   * Prépare les variables pour un email de promotion
   */
  preparePromotionVariables(
    user: any,
    customVariables: Record<string, string> = {},
  ): EmailTemplateVariables {
    const userData = this.fromUser(user);

    return this.prepare({
      userName: userData.userName,
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: userData.fullName,
      email: userData.email,
      userId: userData.userId.toString(),
      customMessage:
        customVariables.customMessage ||
        "Bienvenue dans l'équipe des professeurs !",
      promotionDate: new Date().toLocaleDateString("fr-FR"),
      ...customVariables,
    });
  }

  /**
   * Prépare les variables pour un email de bienvenue
   */
  prepareWelcomeVariables(
    user: any,
    customVariables: Record<string, string> = {},
  ): EmailTemplateVariables {
    const userData = this.fromUser(user);

    return this.prepare({
      userName: userData.userName,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      userId: userData.userId.toString(),
      loginUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/login`
        : "http://localhost:5173/login",
      ...customVariables,
    });
  }

  /**
   * Prépare les variables pour un email de confirmation de commande
   */
  prepareOrderVariables(
    userName: string,
    numeroCommande: string,
    details: {
      dateCommande: string;
      statutCommande: string;
      nbArticles: string;
      totalCommande: string;
    },
    customVariables: Record<string, string> = {},
  ): EmailTemplateVariables {
    return this.prepare({
      userName,
      numeroCommande,
      dateCommande: details.dateCommande,
      statutCommande: details.statutCommande,
      nbArticles: details.nbArticles,
      totalCommande: details.totalCommande,
      orderUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/orders/${numeroCommande}`
        : "",
      ...customVariables,
    });
  }

  /**
   * Prépare les variables pour un email de réinitialisation de mot de passe
   */
  preparePasswordResetVariables(
    userName: string,
    resetToken: string,
    customVariables: Record<string, string> = {},
  ): EmailTemplateVariables {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

    return this.prepare({
      userName,
      resetUrl,
      resetToken,
      expiresIn: customVariables.expiresIn || "1 heure",
      expirationTime: customVariables.expirationTime || "1 heure",
      ...customVariables,
    });
  }

  /**
   * Prépare les variables pour un email de notification de cours
   */
  prepareCourseNotificationVariables(
    user: any,
    coursDetails: {
      coursNom: string;
      dateHeure: string;
      lieu?: string;
      professeur?: string;
    },
    customVariables: Record<string, string> = {},
  ): EmailTemplateVariables {
    const userData = this.fromUser(user);

    return this.prepare({
      userName: userData.userName,
      coursNom: coursDetails.coursNom,
      dateHeure: coursDetails.dateHeure,
      lieu: coursDetails.lieu || "À confirmer",
      professeur: coursDetails.professeur || "À confirmer",
      coursUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/courses`
        : "",
      ...customVariables,
    });
  }

  /**
   * Prépare les variables pour un email de confirmation de paiement
   */
  preparePaymentConfirmationVariables(
    user: any,
    paymentDetails: {
      amount: string;
      date: string;
      method?: string;
      transactionId?: string;
    },
    customVariables: Record<string, string> = {},
  ): EmailTemplateVariables {
    const userData = this.fromUser(user);

    return this.prepare({
      userName: userData.userName,
      amount: paymentDetails.amount,
      date: paymentDetails.date,
      method: paymentDetails.method || "Carte bancaire",
      transactionId: paymentDetails.transactionId || "N/A",
      invoiceUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/invoices`
        : "",
      ...customVariables,
    });
  }

  /**
   * Prépare les variables pour un email d'échec de paiement
   */
  preparePaymentFailureVariables(
    user: any,
    paymentDetails: {
      amount: string;
      reason?: string;
    },
    customVariables: Record<string, string> = {},
  ): EmailTemplateVariables {
    const userData = this.fromUser(user);

    return this.prepare({
      userName: userData.userName,
      amount: paymentDetails.amount,
      reason: paymentDetails.reason || "Problème avec le mode de paiement",
      retryUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/payment/retry`
        : "",
      ...customVariables,
    });
  }

  /**
   * Prépare les variables pour un email d'abonnement
   */
  prepareSubscriptionVariables(
    user: any,
    subscriptionDetails: {
      planName: string;
      planPrice?: string;
      startDate?: string;
      endDate?: string;
    },
    customVariables: Record<string, string> = {},
  ): EmailTemplateVariables {
    const userData = this.fromUser(user);

    return this.prepare({
      userName: userData.userName,
      planName: subscriptionDetails.planName,
      planPrice: subscriptionDetails.planPrice || "N/A",
      startDate:
        subscriptionDetails.startDate || new Date().toLocaleDateString("fr-FR"),
      endDate: subscriptionDetails.endDate || "Indéterminée",
      dashboardUrl: process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/dashboard`
        : "",
      ...customVariables,
    });
  }

  /**
   * Normalise les variables (convertit tout en string, gère les valeurs null/undefined)
   */
  normalize(variables: Record<string, any>): Record<string, string> {
    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(variables)) {
      if (value === null || value === undefined) {
        normalized[key] = "";
      } else if (typeof value === "string") {
        normalized[key] = value;
      } else if (typeof value === "number" || typeof value === "boolean") {
        normalized[key] = String(value);
      } else if (value instanceof Date) {
        normalized[key] = value.toLocaleDateString("fr-FR");
      } else if (typeof value === "object") {
        // Serialiser les objets en JSON
        normalized[key] = JSON.stringify(value);
      } else {
        normalized[key] = String(value);
      }
    }

    return normalized;
  }

  /**
   * Valide que toutes les variables requises sont présentes
   */
  validate(
    variables: Record<string, string>,
    requiredVariables: string[],
  ): { isValid: boolean; missing: string[] } {
    const missing = requiredVariables.filter(
      (key) => !variables[key] || variables[key].trim() === "",
    );

    return {
      isValid: missing.length === 0,
      missing,
    };
  }

  /**
   * Merge plusieurs sets de variables (le dernier override les précédents)
   */
  merge(
    ...variableSets: Array<Record<string, string> | undefined>
  ): Record<string, string> {
    return variableSets.reduce<Record<string, string>>((acc, vars) => {
      if (!vars) return acc;
      return { ...acc, ...vars };
    }, {});
  }

  /**
   * Crée des variables à partir d'un template string avec interpolation
   */
  template(templateString: string, variables: Record<string, string>): string {
    return templateString.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }
}

// Instance singleton
export const variablesPreparator = new VariablesPreparator();
