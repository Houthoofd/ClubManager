/**
 * Types GraphQL pour Inscription (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module inscription/graphql.types
 */

/**
 * Résultat de la vérification d'email (GraphQL)
 */
export interface EmailVerificationResult {
  exists: boolean;
  message?: string;
}

/**
 * Résultat de l'inscription d'un utilisateur (GraphQL)
 */
export interface InscriptionResult {
  success: boolean;
  message: string;
  userId?: number;
}

/**
 * Force du mot de passe (score de 0 à 4) (GraphQL)
 */
export interface PasswordStrength {
  score: number;
  feedback: string;
}

/**
 * Input pour vérifier la disponibilité d'un email (GraphQL)
 */
export interface VerificationEmailInput {
  email: string;
}

/**
 * Input pour l'inscription d'un nouvel utilisateur (GraphQL)
 */
export interface InscriptionInput {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  date: string;
  abonnement: number;
  genre: number;
}

/**
 * Input pour évaluer la force d'un mot de passe (GraphQL)
 */
export interface EvaluerMotDePasseInput {
  password: string;
}

/**
 * Contexte GraphQL pour Inscription
 */
export interface InscriptionContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
