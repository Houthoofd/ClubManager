import nodemailer from "nodemailer";
import { prisma } from "../prisma/prisma.service.js";

/**
 * EmailService - Handle all email sending with nodemailer
 *
 * Features:
 * - Password reset emails
 * - Email verification
 * - Welcome emails
 * - Payment notifications
 * - Configurable SMTP settings per tenant
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}

interface WelcomeEmailData {
  userName: string;
  tenantName: string;
  loginUrl: string;
}

interface VerificationEmailData {
  userName: string;
  verificationUrl: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    // Configuration from environment variables
    const config = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    };

    // Create transporter
    this.transporter = nodemailer.createTransport(config);

    // Verify connection
    try {
      await this.transporter.verify();
      console.log("✅ Email service ready");
    } catch (error) {
      console.error("❌ Email service configuration error:", error);
      throw new Error("Email service not configured properly");
    }

    return this.transporter;
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const mailOptions = {
        from:
          process.env.SMTP_FROM || '"ClubManager" <noreply@clubmanager.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || "",
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("📧 Email sent:", info.messageId);

      return true;
    } catch (error) {
      console.error("❌ Failed to send email:", error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    data: PasswordResetEmailData,
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
          .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.userName}</strong>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            <div class="warning">
              <strong>⚠️ Important :</strong><br>
              Ce lien expire dans <strong>${data.expiresIn}</strong>.<br>
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${data.resetUrl}" style="color: #4F46E5; word-break: break-all;">${data.resetUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>ClubManager - Gestion de clubs simplifiée</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Bonjour ${data.userName},

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur ce lien pour définir un nouveau mot de passe :
${data.resetUrl}

⚠️ Important : Ce lien expire dans ${data.expiresIn}.
Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

---
ClubManager - Gestion de clubs simplifiée
    `;

    return this.sendEmail({
      to: email,
      subject: "🔐 Réinitialisation de votre mot de passe - ClubManager",
      html,
      text,
    });
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    email: string,
    data: WelcomeEmailData,
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
          .feature { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #10B981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue sur ClubManager !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.userName}</strong>,</p>
            <p>Nous sommes ravis de vous accueillir sur <strong>${data.tenantName}</strong> !</p>
            <p>Votre compte a été créé avec succès. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.</p>

            <div style="text-align: center;">
              <a href="${data.loginUrl}" class="button">Accéder à mon espace</a>
            </div>

            <h3>🚀 Fonctionnalités disponibles :</h3>
            <div class="feature">
              <strong>📅 Gestion des cours</strong><br>
              Inscrivez-vous aux cours et consultez votre planning.
            </div>
            <div class="feature">
              <strong>💳 Paiements en ligne</strong><br>
              Gérez vos abonnements et paiements en toute sécurité.
            </div>
            <div class="feature">
              <strong>📊 Suivi de progression</strong><br>
              Suivez vos progrès et vos statistiques personnelles.
            </div>

            <p>Si vous avez des questions, n'hésitez pas à contacter notre équipe de support.</p>
          </div>
          <div class="footer">
            <p>ClubManager - Gestion de clubs simplifiée</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `🎉 Bienvenue sur ${data.tenantName} - ClubManager`,
      html,
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(
    email: string,
    data: VerificationEmailData,
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Vérification de votre email</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.userName}</strong>,</p>
            <p>Merci de vous être inscrit sur ClubManager !</p>
            <p>Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>

            <div style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Vérifier mon email</a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${data.verificationUrl}" style="color: #3B82F6; word-break: break-all;">${data.verificationUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>ClubManager - Gestion de clubs simplifiée</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: "✉️ Vérifiez votre adresse email - ClubManager",
      html,
    });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    email: string,
    data: {
      userName: string;
      amount: number;
      currency: string;
      description: string;
      invoiceUrl?: string;
    },
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .amount { font-size: 32px; color: #059669; font-weight: bold; text-align: center; margin: 20px 0; }
          .details { background-color: white; padding: 15px; margin: 15px 0; border: 1px solid #e5e7eb; border-radius: 6px; }
          .button { display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Paiement confirmé</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.userName}</strong>,</p>
            <p>Nous avons bien reçu votre paiement. Merci pour votre confiance !</p>

            <div class="amount">
              ${data.amount.toFixed(2)} ${data.currency}
            </div>

            <div class="details">
              <strong>Détails du paiement :</strong><br>
              ${data.description}
            </div>

            ${
              data.invoiceUrl
                ? `
            <div style="text-align: center;">
              <a href="${data.invoiceUrl}" class="button">Télécharger la facture</a>
            </div>
            `
                : ""
            }

            <p>Ce paiement sera visible dans votre historique de transactions.</p>
          </div>
          <div class="footer">
            <p>ClubManager - Gestion de clubs simplifiée</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: "✅ Confirmation de paiement - ClubManager",
      html,
    });
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error("Email test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default EmailService;
