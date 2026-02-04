import nodemailer from "nodemailer";
import { promises as fs } from "fs";
import path from "path";
import sgMail from "@sendgrid/mail";
import MysqlConnector from "../db/connector/mysqlconnector.js";

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  message: string;
  isHtml?: boolean;
  saveToDb?: boolean;
  utilisateurId?: number;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details: any; // Rendu requis
}

export interface EmailTemplateOptions {
  templateName?: string;
  templatePath?: string;
  variables?: Record<string, string>;
  useInlineTemplate?: boolean;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private templatePath: string;
  private mysqlConnector: MysqlConnector;
  private initialized: boolean = false;

  constructor() {
    this.templatePath = path.join(process.cwd(), "src", "templates", "emails");
    this.mysqlConnector = MysqlConnector.getInstance();
    this.initializeTransporter();

    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log("📧 [EmailService] SendGrid configuré avec API Key");
    } else {
      console.warn("⚠️ [EmailService] SENDGRID_API_KEY manquante");
    }
  }

  /**
   * Initialise le transporteur email
   */
  private initializeTransporter(): void {
    try {
      if (process.env.EMAIL_SERVICE === "sendgrid") {
        console.log("📧 [EmailService] Configuration SendGrid activée");
        this.initialized = true;
        return;
      }

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn(
          "⚠️ [EmailService] Variables EMAIL_USER et EMAIL_PASS manquantes",
        );
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      this.verifyConnection();
      this.initialized = true;
      console.log("✅ [EmailService] Transporteur initialisé avec succès");
    } catch (error: any) {
      console.error(
        "❌ [EmailService] Erreur initialisation transporteur:",
        error,
      );
      this.initialized = false;
    }
  }

  /**
   * Vérifie la connexion email
   */
  private async verifyConnection(): Promise<void> {
    try {
      if (this.transporter) {
        await this.transporter.verify();
        console.log("✅ [EmailService] Connexion email vérifiée");
      }
    } catch (error: any) {
      console.error("❌ [EmailService] Erreur vérification connexion:", error);
      this.initialized = false;
    }
  }

  /**
   * Charge un template email depuis un fichier
   */
  private async loadTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): Promise<EmailTemplate> {
    try {
      const templateFile = path.join(this.templatePath, `${templateName}.html`);
      let htmlContent = await fs.readFile(templateFile, "utf-8");

      // Remplacer les variables
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        htmlContent = htmlContent.replace(regex, value);
      });

      // Extraire le sujet du template
      const subjectMatch = htmlContent.match(/<title>(.*?)<\/title>/);
      const subject = subjectMatch
        ? subjectMatch[1]
        : `Notification - ${templateName}`;

      // Version texte simplifiée
      const textContent = htmlContent
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      return { subject, text: textContent, html: htmlContent };
    } catch (error: any) {
      console.error(
        `❌ [EmailService] Erreur chargement template ${templateName}:`,
        error,
      );
      return this.getFallbackTemplate(templateName);
    }
  }

  /**
   * Retourne un template de fallback
   */
  private getFallbackTemplate(templateName: string): EmailTemplate {
    return {
      subject: `Notification - ${templateName}`,
      text: "Contenu du message non disponible.",
      html: `
        <html>
          <body>
            <h1>Notification</h1>
            <p>Le contenu du message n'est pas disponible.</p>
          </body>
        </html>
      `,
    };
  }

  /**
   * Charge un template générique depuis un fichier
   */
  private async loadGenericTemplate(emailData: {
    templateName?: string;
    templatePath?: string;
    variables?: Record<string, string>;
  }): Promise<string> {
    let templatePath: string;

    if (emailData.templatePath) {
      templatePath = emailData.templatePath;
    } else if (emailData.templateName) {
      templatePath = path.join(
        this.templatePath,
        `${emailData.templateName}.html`,
      );
    } else {
      throw new Error("Nom de template ou chemin requis");
    }

    // Lire le fichier template
    let htmlContent = await fs.readFile(templatePath, "utf-8");

    // Remplacer les variables si fournies
    if (emailData.variables) {
      Object.keys(emailData.variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        htmlContent = htmlContent.replace(regex, emailData.variables![key]);
      });
    }

    return htmlContent;
  }

  // Méthode principale d'envoi d'email
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      if (!this.transporter) {
        throw new Error(
          "Service email non configuré - vérifiez les variables EMAIL_USER et EMAIL_PASS",
        );
      }
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error(
          "Configuration email manquante - vérifiez EMAIL_USER et EMAIL_PASS",
        );
      }

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || "Club Manager",
          address: process.env.EMAIL_FROM || process.env.EMAIL_USER!,
        },
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(", ")
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(", ")
            : options.bcc
          : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      console.log(`📧 Envoi email vers: ${mailOptions.to}`);
      console.log(`📋 Sujet: ${mailOptions.subject}`);

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email envoyé avec succès - ID: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
        details: {
          statusCode: 200,
          timestamp: new Date().toISOString(),
          service: "smtp",
        },
      };
    } catch (error: any) {
      console.error("❌ Erreur envoi email:", error);
      return {
        success: false,
        error: error.message,
        details: {
          error: error,
          timestamp: new Date().toISOString(),
          service: "smtp",
        },
      };
    }
  }

  /**
   * Envoie un email de promotion
   */
  async sendPromotionEmail(
    utilisateur: any,
    templateOptions?: EmailTemplateOptions,
  ): Promise<EmailResult> {
    try {
      console.log(
        `📧 [EmailService] Envoi email de promotion à ${utilisateur.email}`,
      );

      let htmlContent: string;

      if (templateOptions?.templateName || templateOptions?.templatePath) {
        htmlContent = await this.loadPromotionTemplate(
          utilisateur,
          templateOptions,
        );
      } else {
        htmlContent = this.generatePromotionTemplate(utilisateur);
      }

      const emailOptions: EmailOptions = {
        to: utilisateur.email,
        subject: "🎉 Félicitations ! Vous êtes maintenant professeur",
        html: htmlContent,
      };

      const result = await this.sendEmail(emailOptions);

      if (result.success && result.messageId) {
        await this.saveEmailToDatabase(
          {
            to: utilisateur.email,
            subject: emailOptions.subject,
            message: "Email de promotion en professeur",
            isHtml: true,
            utilisateurId: utilisateur.id,
          },
          result.messageId,
        );
      }

      return result;
    } catch (error: any) {
      console.error(
        `❌ [EmailService] Erreur envoi email de promotion:`,
        error,
      );
      return {
        success: false,
        error:
          error.message || "Erreur lors de l'envoi de l'email de promotion",
        details: {
          error: error,
          timestamp: new Date().toISOString(),
          type: "promotion-email",
          recipient: utilisateur.email,
        },
      };
    }
  }

  /**
   * Envoie un message email personnalisé (méthode générique)
   */
  async envoyerMessage(emailData: EmailMessage): Promise<EmailResult> {
    try {
      if (!this.transporter && process.env.EMAIL_SERVICE !== "sendgrid") {
        throw new Error("Service email non configuré");
      }

      const emailOptions: EmailOptions = {
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.isHtml ? emailData.message : undefined,
        text: !emailData.isHtml ? emailData.message : undefined,
      };

      const result = await this.sendEmail(emailOptions);

      if (
        result.success &&
        emailData.saveToDb &&
        emailData.utilisateurId &&
        result.messageId
      ) {
        await this.saveEmailToDatabase(emailData, result.messageId);
      }

      return result;
    } catch (error: any) {
      console.error("❌ [EmailService] Erreur envoyerMessage:", error);

      if (emailData.saveToDb && emailData.utilisateurId) {
        await this.saveEmailErrorToDatabase(emailData, error.message);
      }

      return {
        success: false,
        error: error.message,
        details: error,
      };
    }
  }

  /**
   * Envoie un email personnalisé avec options étendues
   */
  async envoyerEmailPersonnalise(options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
      filename: string;
      path?: string;
      content?: Buffer | string;
      contentType?: string;
    }>;
  }): Promise<EmailResult> {
    try {
      const emailOptions: EmailOptions = {
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      };

      return await this.sendEmail(emailOptions);
    } catch (error: any) {
      console.error(
        "❌ [EmailService] Erreur envoyerEmailPersonnalise:",
        error,
      );
      return {
        success: false,
        error: error.message,
        details: error,
      };
    }
  }

  /**
   * Envoie un email de bienvenue
   */
  async envoyerEmailBienvenue(
    userEmail: string,
    userName: string,
    userId: string,
    tempPassword?: string,
  ): Promise<EmailResult> {
    try {
      const template = await this.loadTemplate("welcome", {
        userName,
        userId,
        tempPassword: tempPassword || "password123",
        loginUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/pages/connexion`,
        currentYear: new Date().getFullYear().toString(),
        clubName: process.env.CLUB_NAME || "Club Manager",
      });

      return this.sendEmail({
        to: userEmail,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
    } catch (error: any) {
      console.error("❌ [EmailService] Erreur envoyerEmailBienvenue:", error);
      return {
        success: false,
        error: error.message,
        details: {
          error: error,
          timestamp: new Date().toISOString(),
          type: "welcome-email",
        },
      };
    }
  }

  /**
   * Teste la configuration email
   */
  async testerConfiguration(): Promise<EmailResult> {
    try {
      if (process.env.EMAIL_SERVICE === "sendgrid") {
        if (!process.env.SENDGRID_API_KEY) {
          return {
            success: false,
            error: "SENDGRID_API_KEY manquante",
            details: {
              service: "sendgrid",
              timestamp: new Date().toISOString(),
              config: "missing-api-key",
            },
          };
        }
        return {
          success: true,
          messageId: "sendgrid-configured",
          details: {
            service: "sendgrid",
            timestamp: new Date().toISOString(),
            config: "api-key-present",
          },
        };
      }

      if (!this.transporter) {
        return {
          success: false,
          error: "Transporteur non initialisé",
          details: {
            service: "smtp",
            timestamp: new Date().toISOString(),
            config: "transporter-not-initialized",
          },
        };
      }

      await this.transporter.verify();
      return {
        success: true,
        messageId: "smtp-verified",
        details: {
          service: "smtp",
          timestamp: new Date().toISOString(),
          config: "verified",
        },
      };
    } catch (error: any) {
      console.error("❌ [EmailService] Erreur test configuration:", error);
      return {
        success: false,
        error: error.message,
        details: {
          error: error,
          timestamp: new Date().toISOString(),
          service: "smtp",
          config: "verification-failed",
        },
      };
    }
  }

  /**
   * Envoie un email de test
   */
  async envoyerEmailTest(to: string): Promise<EmailResult> {
    try {
      const testHtml = `
        <html>
          <body>
            <h1>🧪 Test Email - Club Manager</h1>
            <p>Ceci est un email de test envoyé le ${new Date().toLocaleString("fr-FR")}.</p>
            <p>Si vous recevez cet email, la configuration est correcte !</p>
            <hr>
            <p><small>Email de test automatique - Ne pas répondre</small></p>
          </body>
        </html>
      `;

      return await this.sendEmail({
        to: to,
        subject: "🧪 Test Email - Club Manager",
        html: testHtml,
        text: `Test Email - Club Manager. Envoyé le ${new Date().toLocaleString("fr-FR")}.`,
      });
    } catch (error: any) {
      console.error("❌ [EmailService] Erreur envoyerEmailTest:", error);
      return {
        success: false,
        error: error.message,
        details: {
          error: error,
          timestamp: new Date().toISOString(),
          type: "test-email",
          recipient: to,
        },
      };
    }
  }

  /**
   * Sauvegarde une erreur d'email en base de données
   */
  private async saveEmailErrorToDatabase(
    emailData: EmailMessage,
    errorMessage: string,
  ): Promise<void> {
    try {
      const sql = `
        INSERT INTO messages_personnalises
        (utilisateur_id, contenu, status_envoi, error_details, created_at)
        VALUES (?, ?, 'failed', ?, NOW())
      `;

      await new Promise<void>((resolve, reject) => {
        this.mysqlConnector.query(
          sql,
          [emailData.utilisateurId, emailData.message, errorMessage],
          (error) => {
            if (error) {
              console.error("❌ Erreur sauvegarde erreur email en DB:", error);
              reject(error);
            } else {
              console.log("📝 Erreur email sauvegardée en DB");
              resolve();
            }
          },
        );
      });
    } catch (error) {
      console.error(
        "❌ [EmailService] Erreur sauvegarde erreur email DB:",
        error,
      );
    }
  }

  /**
   * Charge un template de promotion depuis un fichier externe
   */
  private async loadPromotionTemplate(
    utilisateur: any,
    templateOptions: EmailTemplateOptions,
  ): Promise<string> {
    try {
      const defaultVariables: Record<string, string> = {
        firstName: utilisateur.first_name || "",
        lastName: utilisateur.last_name || "",
        clubName: process.env.CLUB_NAME || "Club Manager",
        frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        currentYear: new Date().getFullYear().toString(),
      };

      const allVariables: Record<string, string> = {
        ...defaultVariables,
        ...(templateOptions.variables || {}),
      };

      return await this.loadGenericTemplate({
        templateName: templateOptions.templateName,
        templatePath: templateOptions.templatePath,
        variables: allVariables,
      });
    } catch (error: any) {
      console.error(
        `❌ [EmailService] Erreur chargement template promotion:`,
        error,
      );
      return this.generatePromotionTemplate(utilisateur);
    }
  }

  /**
   * Génère le template HTML inline pour l'email de promotion
   */
  private generatePromotionTemplate(utilisateur: any): string {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const anneeActuelle = new Date().getFullYear();
    const clubName = process.env.CLUB_NAME || "Club Manager";

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="utf-8">
          <title>Promotion Professeur - ${clubName}</title>
      </head>
      <body>
          <h1>🎉 Félicitations !</h1>
          <p>Bonjour <strong>${utilisateur.first_name} ${utilisateur.last_name}</strong>,</p>
          <p>Vous avez été promu(e) au rang de <strong>Professeur</strong> !</p>
          <p><a href="${frontendUrl}">Accéder à mon espace professeur</a></p>
          <p>L'équipe ${clubName}</p>
      </body>
      </html>
    `;
  }

  /**
   * Sauvegarde un email en base de données
   */
  private async saveEmailToDatabase(
    emailData: EmailMessage,
    messageId: string,
  ): Promise<void> {
    try {
      const sql = `
        INSERT INTO messages_personnalises
        (utilisateur_id, contenu, status_envoi, sendgrid_message_id, created_at)
        VALUES (?, ?, 'sent', ?, NOW())
      `;

      await new Promise<void>((resolve, reject) => {
        this.mysqlConnector.query(
          sql,
          [emailData.utilisateurId, emailData.message, messageId],
          (error) => {
            if (error) {
              console.error("❌ Erreur sauvegarde email en DB:", error);
              reject(error);
            } else {
              console.log(
                "✅ Email sauvegardé en DB avec messageId:",
                messageId,
              );
              resolve();
            }
          },
        );
      });
    } catch (error) {
      console.error("❌ [EmailService] Erreur sauvegarde email DB:", error);
    }
  }

  /**
   * Vérifie si le service est prêt
   */
  isReady(): boolean {
    return this.initialized && this.transporter !== null;
  }

  /**
   * Réinitialise le transporteur
   */
  async reinitialize(): Promise<void> {
    this.initialized = false;
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Envoie une confirmation de paiement
   */
  static async sendPaymentConfirmation(
    utilisateur: any,
    premierPaiement: boolean,
    statutUpgrade?: string,
  ) {
    // Logique d'envoi d'email centralisée
  }
}

// Export de l'instance singleton
export const emailService = new EmailService();
