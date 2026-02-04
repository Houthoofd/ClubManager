import { EmailService, EmailOptions } from "../../../services/emailService.js";
import { emailTemplateService } from "../../../services/emailTemplateService.js";

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details: any;
}

export class EmailClient {
  private static instance: EmailClient | null = null;
  private emailService: EmailService;
  private templatesInitialized: boolean = false;

  private constructor() {
    this.emailService = new EmailService();
  }

  static getInstance(): EmailClient {
    if (!EmailClient.instance) {
      EmailClient.instance = new EmailClient();
    }
    return EmailClient.instance;
  }

  // Méthode pour envoyer un email simple
  async envoyerEmail(options: {
    destinataires: string | string[];
    sujet: string;
    message: string;
    isHtml?: boolean;
    cc?: string | string[];
    bcc?: string | string[];
  }): Promise<EmailResult> {
    try {
      const emailOptions: EmailOptions = {
        to: options.destinataires,
        subject: options.sujet,
        cc: options.cc,
        bcc: options.bcc,
      };

      if (options.isHtml) {
        emailOptions.html = options.message;
      } else {
        emailOptions.text = options.message;
      }

      return await this.emailService.sendEmail(emailOptions);
    } catch (error: any) {
      console.error("❌ [EmailClient] Erreur envoi email:", error);
      return {
        success: false,
        error: error.message,
        details: { step: "email_client_send", originalError: error },
      };
    }
  }

  // Email de bienvenue avec template DB
  async envoyerBienvenue(
    email: string,
    prenom: string,
    nom: string,
    userId?: string,
  ): Promise<EmailResult> {
    try {
      console.log("📧 [EmailClient] Envoi email de bienvenue avec template DB");

      const template = await emailTemplateService.getWelcomeTemplate({
        userName: `${prenom} ${nom}`,
        userId,
        loginUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pages/connexion`,
      });

      return await this.emailService.sendEmail({
        to: email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
    } catch (error: any) {
      console.error("❌ [EmailClient] Erreur envoi bienvenue:", error);
      return {
        success: false,
        error: error.message,
        details: { step: "welcome_email_db_template", originalError: error },
      };
    }
  }

  // Email de notification de cours avec template DB
  async envoyerNotificationCours(options: {
    email: string;
    prenom: string;
    nom: string;
    cours: {
      type: string;
      date: string;
      heure: string;
      action: "inscription" | "annulation" | "modification";
      professeur?: string;
    };
  }): Promise<EmailResult> {
    try {
      console.log("📧 [EmailClient] Envoi notification cours avec template DB");

      const actionTexts = {
        inscription: "Inscription confirmée",
        annulation: "Cours annulé",
        modification: "Cours modifié",
      };

      const template = await emailTemplateService.getCourseNotificationTemplate(
        {
          userName: `${options.prenom} ${options.nom}`,
          action: actionTexts[options.cours.action],
          courseType: options.cours.type,
          courseDate: options.cours.date,
          courseTime: options.cours.heure,
          instructor: options.cours.professeur,
        },
      );

      return await this.emailService.sendEmail({
        to: options.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
    } catch (error: any) {
      console.error("❌ [EmailClient] Erreur notification cours:", error);
      return {
        success: false,
        error: error.message,
        details: {
          step: "course_notification_db_template",
          originalError: error,
        },
      };
    }
  }

  // Email de réinitialisation de mot de passe avec template DB
  async envoyerResetPassword(
    email: string,
    prenom: string,
    resetToken: string,
  ): Promise<EmailResult> {
    try {
      console.log("📧 [EmailClient] Envoi reset password avec template DB");

      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/pages/reset-password?token=${resetToken}`;

      const template = await emailTemplateService.getPasswordResetTemplate({
        userName: prenom,
        resetUrl,
        expiryHours: "24",
      });

      return await this.emailService.sendEmail({
        to: email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
    } catch (error: any) {
      console.error("❌ [EmailClient] Erreur reset password:", error);
      return {
        success: false,
        error: error.message,
        details: { step: "password_reset_db_template", originalError: error },
      };
    }
  }

  // Email de rappel de paiement avec template DB
  async envoyerRappelPaiement(options: {
    email: string;
    prenom: string;
    nom: string;
    niveau: 1 | 2 | 3;
    montant?: string;
    dateEcheance?: string;
  }): Promise<EmailResult> {
    try {
      console.log(
        `📧 [EmailClient] Envoi rappel paiement niveau ${options.niveau} avec template DB`,
      );

      const template = await emailTemplateService.getPaymentReminderTemplate(
        options.niveau,
        {
          userName: `${options.prenom} ${options.nom}`,
          amount: options.montant,
          dueDate: options.dateEcheance,
        },
      );

      return await this.emailService.sendEmail({
        to: options.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
    } catch (error: any) {
      console.error("❌ [EmailClient] Erreur rappel paiement:", error);
      return {
        success: false,
        error: error.message,
        details: { step: "payment_reminder_db_template", originalError: error },
      };
    }
  }

  // Email de confirmation de paiement avec template DB
  async envoyerConfirmationPaiement(options: {
    email: string;
    prenom: string;
    nom: string;
    montant: string;
    datePaiement: string;
  }): Promise<EmailResult> {
    try {
      console.log(
        "📧 [EmailClient] Envoi confirmation paiement avec template DB",
      );

      const template =
        await emailTemplateService.getPaymentConfirmationTemplate({
          userName: `${options.prenom} ${options.nom}`,
          amount: options.montant,
          paymentDate: options.datePaiement,
        });

      return await this.emailService.sendEmail({
        to: options.email,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
    } catch (error: any) {
      console.error("❌ [EmailClient] Erreur confirmation paiement:", error);
      return {
        success: false,
        error: error.message,
        details: {
          step: "payment_confirmation_db_template",
          originalError: error,
        },
      };
    }
  }

  // Email avec template personnalisé depuis la DB
  async envoyerAvecTemplatePersonnalise(options: {
    destinataires: string | string[];
    templateId?: number;
    templateTitle?: string;
    variables: Record<string, string>;
  }): Promise<EmailResult> {
    try {
      console.log("📧 [EmailClient] Envoi avec template personnalisé DB");

      let dbTemplate;
      if (options.templateId) {
        dbTemplate = await emailTemplateService.getTemplateById(
          options.templateId,
        );
      } else if (options.templateTitle) {
        dbTemplate = await emailTemplateService.getTemplateByTitle(
          options.templateTitle,
        );
      } else {
        throw new Error("templateId ou templateTitle requis");
      }

      if (!dbTemplate) {
        throw new Error("Template non trouvé en base de données");
      }

      const processedTemplate = emailTemplateService.processTemplate(
        dbTemplate.content,
        options.variables,
      );

      return await this.emailService.sendEmail({
        to: options.destinataires,
        subject: processedTemplate.subject,
        text: processedTemplate.text,
        html: processedTemplate.html,
      });
    } catch (error: any) {
      console.error(
        "❌ [EmailClient] Erreur envoi template personnalisé:",
        error,
      );
      return {
        success: false,
        error: error.message,
        details: { step: "custom_template_db", originalError: error },
      };
    }
  }

  // Initialiser les templates par défaut
  async initialiserTemplates(): Promise<void> {
    if (this.templatesInitialized) {
      console.log("✅ [EmailClient] Templates déjà initialisés");
      return;
    }

    try {
      console.log("🔄 [EmailClient] Initialisation des templates...");
      await emailTemplateService.syncDefaultTemplates();
      this.templatesInitialized = true;
      console.log("✅ [EmailClient] Templates initialisés avec succès");
    } catch (error) {
      console.error("❌ [EmailClient] Erreur initialisation templates:", error);
    }
  }

  // Tester la configuration email
  async testerConfiguration(): Promise<EmailResult> {
    try {
      return await this.emailService.testerConfiguration();
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: { step: "config_test", originalError: error },
      };
    }
  }

  // Envoyer un email de test
  async envoyerEmailTest(to: string): Promise<EmailResult> {
    try {
      return await this.emailService.envoyerEmailTest(to);
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        details: { step: "test_email", originalError: error },
      };
    }
  }

  // Générer un template HTML pour notification de cours
  generateCourseNotificationTemplate(options: {
    prenom: string;
    nom: string;
    cours: {
      type: string;
      date: string;
      heure: string;
      action: "inscription" | "annulation" | "modification";
      professeur?: string;
    };
  }): string {
    const actionIcons = {
      inscription: "✅",
      annulation: "❌",
      modification: "📝",
    };

    const actionTexts = {
      inscription: "Votre inscription au cours a été confirmée",
      annulation: "Le cours suivant a été annulé",
      modification: "Le cours suivant a été modifié",
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 20px; margin-bottom: 20px;">
            <h2 style="color: #2c3e50; margin: 0;">
              ${actionIcons[options.cours.action]} Notification de cours
            </h2>
          </div>

          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
              Bonjour <strong>${options.prenom} ${options.nom}</strong>,
            </p>
            <p style="margin: 15px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
              ${actionTexts[options.cours.action]} :
            </p>

            <div style="background-color: #3498db; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">📅 ${options.cours.type}</p>
              <p style="margin: 5px 0; font-size: 16px;">🕒 ${options.cours.date} à ${options.cours.heure}</p>
              ${options.cours.professeur ? `<p style="margin: 5px 0; font-size: 14px;">👨‍🏫 Professeur: ${options.cours.professeur}</p>` : ""}
            </div>
          </div>

          <div style="border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 14px; text-align: center;">
            <p style="margin: 0;">Cet email a été envoyé automatiquement par Club Manager</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Club Manager - Tous droits réservés</p>
          </div>
        </div>
      </div>
    `;
  }

  // Générer un template HTML pour rappel de cours
  generateCourseReminderTemplate(options: {
    prenom: string;
    nom: string;
    cours: {
      type: string;
      date: string;
      heure: string;
      lieu?: string;
      professeur?: string;
    };
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; border-bottom: 2px solid #f39c12; padding-bottom: 20px; margin-bottom: 20px;">
            <h2 style="color: #2c3e50; margin: 0;">
              ⏰ Rappel de cours
            </h2>
          </div>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #856404;">
              Bonjour <strong>${options.prenom} ${options.nom}</strong>,
            </p>
            <p style="margin: 15px 0; font-size: 16px; line-height: 1.6; color: #856404;">
              N'oubliez pas votre cours de demain :
            </p>

            <div style="background-color: #f39c12; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; font-size: 18px;">📅 ${options.cours.type}</p>
              <p style="margin: 10px 0 5px 0; font-size: 16px;">🕒 ${options.cours.date} à ${options.cours.heure}</p>
              ${options.cours.lieu ? `<p style="margin: 5px 0; font-size: 14px;">📍 Lieu: ${options.cours.lieu}</p>` : ""}
              ${options.cours.professeur ? `<p style="margin: 5px 0; font-size: 14px;">👨‍🏫 Professeur: ${options.cours.professeur}</p>` : ""}
            </div>

            <p style="margin: 15px 0 0 0; font-size: 14px; color: #856404;">
              💡 N'oubliez pas d'apporter votre équipement !
            </p>
          </div>

          <div style="border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 14px; text-align: center;">
            <p style="margin: 0;">Cet email a été envoyé automatiquement par Club Manager</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Club Manager - Tous droits réservés</p>
          </div>
        </div>
      </div>
    `;
  }

  // Générer un template HTML pour réinitialisation de mot de passe
  generatePasswordResetTemplate(prenom: string, resetUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; border-bottom: 2px solid #e74c3c; padding-bottom: 20px; margin-bottom: 20px;">
            <h2 style="color: #2c3e50; margin: 0;">
              🔒 Réinitialisation de mot de passe
            </h2>
          </div>

          <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #721c24;">
              Bonjour <strong>${prenom}</strong>,
            </p>
            <p style="margin: 15px 0; font-size: 16px; line-height: 1.6; color: #721c24;">
              Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>

            <p style="margin: 15px 0 0 0; font-size: 14px; color: #721c24;">
              ⚠️ Ce lien expirera dans 24 heures pour votre sécurité.
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #721c24;">
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
          </div>

          <div style="border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 14px; text-align: center;">
            <p style="margin: 0;">Cet email a été envoyé automatiquement par Club Manager</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Club Manager - Tous droits réservés</p>
          </div>
        </div>
      </div>
    `;
  }

  // Générer un template HTML pour message de contact
  generateContactMessageTemplate(options: {
    expediteurNom: string;
    expediteurEmail: string;
    sujet: string;
    message: string;
  }): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="color: #333; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          📧 Nouveau message de contact - Club Manager
        </h3>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>👤 Expéditeur:</strong> ${options.expediteurNom}</p>
          <p><strong>📧 Email:</strong> ${options.expediteurEmail}</p>
          <p><strong>📋 Sujet:</strong> ${options.sujet}</p>
          <p><strong>📅 Date:</strong> ${new Date().toLocaleString("fr-FR")}</p>
        </div>

        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin: 20px 0;">
          <h4 style="color: #2c3e50; margin-top: 0;">💬 Message:</h4>
          <div style="line-height: 1.6; color: #2c3e50;">
            ${options.message.replace(/\n/g, "<br>")}
          </div>
        </div>

        <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 12px; color: #2980b9;">
            💡 Pour répondre, utilisez directement l'email: ${options.expediteurEmail}
          </p>
        </div>
      </div>
    </div>
    `;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "") // Supprimer les balises HTML
      .replace(/\s+/g, " ") // Normaliser les espaces
      .trim();
  }

  private textToHtml(text: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          ${text.replace(/\n/g, "<br>")}
        </div>
      </div>
    `;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export d'une fonction lazy pour obtenir l'instance
// Ceci évite l'instanciation automatique au chargement du module
let clientInstance: EmailClient | null = null;

export function getEmailClient(): EmailClient {
  if (!clientInstance) {
    clientInstance = EmailClient.getInstance();

    // Initialiser les templates seulement en production, pas en test
    if (process.env.NODE_ENV !== "test") {
      clientInstance.initialiserTemplates().catch(console.error);
    }
  }
  return clientInstance;
}

// Pour la rétrocompatibilité, exporter une propriété qui utilise le getter
export const emailClient = new Proxy({} as EmailClient, {
  get(target, prop) {
    return getEmailClient()[prop as keyof EmailClient];
  },
});
