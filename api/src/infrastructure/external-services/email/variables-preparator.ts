/**
 * Prépare les variables communes pour les templates d'emails
 */

import type { EmailTemplateVariables } from '@clubmanager/types';

export class VariablesPreparator {
  /**
   * Prépare les variables communes pour tous les templates
   */
  prepareCommonVariables(customVariables: Record<string, string> = {}): EmailTemplateVariables {
    return {
      clubName: process.env.CLUB_NAME || 'Club Manager',
      clubWebsite: process.env.CLUB_WEBSITE || 'http://localhost:5173',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@clubmanager.com',
      currentYear: new Date().getFullYear().toString(),
      currentDate: new Date().toLocaleDateString('fr-FR'),
      ...customVariables,
    };
  }

  /**
   * Prépare les variables pour un email de promotion
   */
  preparePromotionVariables(user: any, customVariables: Record<string, string> = {}): EmailTemplateVariables {
    return this.prepareCommonVariables({
      userName: `${user.first_name} ${user.last_name}`,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      email: user.email,
      userId: user.id?.toString() || '',
      customMessage: customVariables.customMessage || 'Bienvenue dans l\'équipe des professeurs !',
      promotionDate: new Date().toLocaleDateString('fr-FR'),
      ...customVariables,
    });
  }

  /**
   * Prépare les variables pour un email de bienvenue
   */
  prepareWelcomeVariables(user: any, customVariables: Record<string, string> = {}): EmailTemplateVariables {
    return this.prepareCommonVariables({
      userName: `${user.first_name} ${user.last_name}`,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      userId: user.id?.toString() || '',
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
    customVariables: Record<string, string> = {}
  ): EmailTemplateVariables {
    return this.prepareCommonVariables({
      userName,
      numeroCommande,
      dateCommande: details.dateCommande,
      statutCommande: details.statutCommande,
      nbArticles: details.nbArticles,
      totalCommande: details.totalCommande,
      ...customVariables,
    });
  }
}

export const variablesPreparator = new VariablesPreparator();
