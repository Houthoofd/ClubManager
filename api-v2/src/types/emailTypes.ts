export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export interface CoursInfo {
  type: string;
  date: string;
  heure: string;
  professeur?: string;
  lieu?: string;
}

export interface UtilisateurInfo {
  email: string;
  prenom: string;
  nom: string;
  userId?: string;
}

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export interface EmailBatchResult {
  total: number;
  reussites: number;
  echecs: number;
  details: EmailResult[];
}

export type EmailAction = 'inscription' | 'annulation' | 'modification';

export interface EmailNotificationOptions {
  utilisateur: UtilisateurInfo;
  cours: CoursInfo & { action: EmailAction };
}

export interface EmailRappelOptions {
  utilisateur: UtilisateurInfo;
  cours: CoursInfo;
}

export interface EmailContactOptions {
  expediteurEmail: string;
  expediteurNom: string;
  sujet: string;
  message: string;
  destinataire?: string;
}
