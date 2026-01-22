import { EmailResult, CoursInfo, EmailAction } from "../shared/types/email.types.js";

export class EmailUtils {
  // Valider une adresse email
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Valider une liste d'emails
  static validateEmailList(emails: string[]): {
    valid: string[];
    invalid: string[];
  } {
    const valid: string[] = [];
    const invalid: string[] = [];

    emails.forEach((email) => {
      if (this.isValidEmail(email.trim())) {
        valid.push(email.trim());
      } else {
        invalid.push(email.trim());
      }
    });

    return { valid, invalid };
  }

  // Nettoyer et normaliser un email
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  // Formater une date pour l'affichage dans les emails
  static formatDateForEmail(date: string | Date): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Formater une heure pour l'affichage dans les emails
  static formatTimeForEmail(time: string): string {
    // Suppose un format HH:MM ou HH:MM:SS
    const timeParts = time.split(":");
    return `${timeParts[0]}h${timeParts[1]}`;
  }

  // Créer un récapitulatif des résultats d'email
  static summarizeEmailResults(results: EmailResult[]): {
    total: number;
    success: number;
    failed: number;
    successRate: number;
  } {
    const total = results.length;
    const success = results.filter((r) => r.success).length;
    const failed = total - success;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

    return { total, success, failed, successRate };
  }

  // Extraire le domaine d'un email
  static getEmailDomain(email: string): string {
    return email.split("@")[1] || "";
  }

  // Vérifier si un email est d'un domaine temporaire/jetable
  static isTemporaryEmail(email: string): boolean {
    const temporaryDomains = [
      "10minutemail.com",
      "guerrillamail.com",
      "mailinator.com",
      "tempmail.org",
      "yopmail.com",
      "maildrop.cc",
      "throwaway.email",
      "getnada.com",
      "temp-mail.org",
      "mohmal.com",
      "emailondeck.com",
    ];

    const domain = this.getEmailDomain(email.toLowerCase());
    return temporaryDomains.includes(domain);
  }

  // Générer un identifiant unique pour un email
  static generateEmailId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convertir du texte en HTML sécurisé
  static textToSafeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br>");
  }

  // Convertir du HTML en texte
  static htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Tronquer un texte pour les aperçus d'email
  static truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + "...";
  }

  // Calculer le délai optimal entre les emails groupés
  static calculateEmailDelay(emailCount: number): number {
    // Plus il y a d'emails, plus on espace pour éviter le spam
    if (emailCount <= 10) return 0;
    if (emailCount <= 50) return 1000; // 1 seconde
    if (emailCount <= 100) return 2000; // 2 secondes
    return 5000; // 5 secondes pour les gros volumes
  }

  // Diviser une liste d'emails en lots optimaux
  static chunkEmails(emails: string[], maxBatchSize: number = 50): string[][] {
    const chunks: string[][] = [];
    for (let i = 0; i < emails.length; i += maxBatchSize) {
      chunks.push(emails.slice(i, i + maxBatchSize));
    }
    return chunks;
  }

  // Créer un message d'erreur convivial
  static formatErrorMessage(error: string): string {
    const errorMappings: { [key: string]: string } = {
      EAUTH: "Problème d'authentification email. Vérifiez vos identifiants.",
      ENOTFOUND: "Serveur email introuvable. Vérifiez la configuration.",
      ECONNREFUSED: "Connexion refusée par le serveur email.",
      ETIMEDOUT: "Délai d'attente dépassé lors de l'envoi.",
      Unauthorized: "Clé API invalide ou expirée.",
    };

    for (const [key, message] of Object.entries(errorMappings)) {
      if (error.includes(key)) {
        return message;
      }
    }

    return "Erreur lors de l'envoi de l'email. Veuillez réessayer.";
  }

  // Créer une signature email standardisée
  static createEmailSignature(): string {
    return `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
        <p style="margin: 0;">
          <strong>Club Manager</strong><br>
          Votre plateforme de gestion de club martial
        </p>
        <p style="margin: 10px 0 0 0;">
          Cet email a été envoyé automatiquement. Pour toute question, contactez-nous.
        </p>
      </div>
    `;
  }

  // Logger les activités email de manière structurée
  static logEmailActivity(
    action: string,
    recipient: string | string[],
    success: boolean,
    details?: any,
  ): void {
    const timestamp = new Date().toISOString();
    const recipientCount = Array.isArray(recipient) ? recipient.length : 1;

    console.log(`📧 [EmailActivity] ${timestamp} - ${action}:`, {
      success,
      recipientCount,
      details: details
        ? { messageId: details.messageId, error: details.error }
        : undefined,
    });
  }
}
