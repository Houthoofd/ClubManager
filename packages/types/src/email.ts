/**
 * Types pour le système d'emails
 */

export interface EmailSendRequest {
  to: string;
  subject?: string;
  message?: string;
  templateId?: number;
  templateTitle?: string;
  variables?: Record<string, string>;
  isHtml?: boolean;
  saveToDb?: boolean;
  utilisateurId?: number;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export interface EmailValidationRequest {
  email: string;
  prenom: string;
  nom: string;
  userId: string;
  utilisateurId: number;
}

export interface EmailValidationResult {
  success: boolean;
  message: string;
  data?: any;
  details?: any;
}

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
}

export interface EmailTemplateVariables {
  clubName?: string;
  clubWebsite?: string;
  supportEmail?: string;
  currentYear?: string;
  currentDate?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: string | undefined;
}

export interface SendGridOptions {
  fallbackOnError?: boolean;
  saveToDb?: boolean;
  utilisateurId?: number;
}

export interface PromotionEmailOptions {
  templateName?: string;
  variables?: Record<string, string>;
}

export interface WelcomeEmailVariables {
  userName: string;
  email: string;
  userId: string;
}

export interface OrderConfirmationVariables {
  userName: string;
  numeroCommande: string;
  dateCommande: string;
  statutCommande: string;
  nbArticles: string;
  totalCommande: string;
}
