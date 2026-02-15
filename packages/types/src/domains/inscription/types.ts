/**
 * Types pour le service Inscription Utilisateur
 * Gestion de l'inscription des nouveaux utilisateurs
 */

/**
 * Résultat de la vérification d'email
 */
export interface EmailVerificationResult {
  exists: boolean;
  message?: string;
}

/**
 * Résultat de l'inscription d'un utilisateur
 */
export interface InscriptionUtilisateurResult {
  success: boolean;
  message: string;
  userId?: number;
}

/**
 * Input pour l'inscription d'un utilisateur
 */
export interface InscriptionUtilisateurInput {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  date: string;
  abonnement: number;
  genre: number;
}

/**
 * Input pour vérifier un email
 */
export interface VerificationEmailInput {
  email: string;
}

/**
 * Force du mot de passe
 */
export interface PasswordStrength {
  score: number;
  feedback: string;
}

/**
 * Input pour évaluer la force d'un mot de passe
 */
export interface EvaluerMotDePasseInput {
  password: string;
}

/**
 * Données d'inscription validées
 */
export interface InscriptionData {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  date: string;
  abonnement: number;
  genre: number;
}

/**
 * Données de vérification d'email
 */
export interface VerificationEmailData {
  email: string;
}
