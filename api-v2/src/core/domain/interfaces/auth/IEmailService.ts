/**
 * Interface: IEmailService
 * Service d'envoi d'emails pour l'authentification
 */

export interface PasswordResetEmailData {
  email: string;
  firstName: string;
  resetToken: string;
  expiresInHours: number;
}

export interface WelcomeEmailData {
  email: string;
  firstName: string;
  verificationToken?: string;
}

export interface EmailVerificationData {
  email: string;
  firstName: string;
  verificationToken: string;
}

export interface PasswordChangedEmailData {
  email: string;
  firstName: string;
  changedAt: Date;
  ipAddress?: string;
}

/**
 * Interface pour le service d'envoi d'emails
 * Utilisée par les Use Cases pour envoyer des notifications par email
 */
export interface IEmailService {
  /**
   * Envoie un email de réinitialisation de mot de passe
   * @param data Données pour l'email de reset
   * @returns Promise<void>
   */
  sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void>;

  /**
   * Envoie un email de bienvenue après inscription
   * @param data Données pour l'email de bienvenue
   * @returns Promise<void>
   */
  sendWelcomeEmail(data: WelcomeEmailData): Promise<void>;

  /**
   * Envoie un email de vérification d'adresse email
   * @param data Données pour l'email de vérification
   * @returns Promise<void>
   */
  sendEmailVerification(data: EmailVerificationData): Promise<void>;

  /**
   * Envoie un email de notification de changement de mot de passe
   * @param data Données pour l'email de notification
   * @returns Promise<void>
   */
  sendPasswordChangedNotification(data: PasswordChangedEmailData): Promise<void>;

  /**
   * Envoie un email de notification de nouvelle connexion
   * @param email Email du destinataire
   * @param firstName Prénom de l'utilisateur
   * @param loginData Données de connexion (IP, device, etc.)
   * @returns Promise<void>
   */
  sendNewLoginNotification(
    email: string,
    firstName: string,
    loginData: {
      ipAddress?: string;
      userAgent?: string;
      location?: string;
      timestamp: Date;
    }
  ): Promise<void>;
}
