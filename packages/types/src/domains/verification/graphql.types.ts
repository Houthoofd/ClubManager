/**
 * Types GraphQL pour Vérification (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module verification/graphql.types
 */

/**
 * Résultat standard d'une vérification (GraphQL)
 */
export interface VerificationResult {
  exists: boolean;
  message: string;
}

/**
 * Résultat du health check du service de vérification (GraphQL)
 */
export interface VerificationHealthResult {
  status: string;
  message: string;
  checks: VerificationChecks;
}

/**
 * Détails des vérifications du health check (GraphQL)
 */
export interface VerificationChecks {
  database: boolean;
  verification: boolean;
}

/**
 * Résultat de la vérification des professeurs (GraphQL)
 */
export interface VerifierProfesseursResult {
  professeurs: ProfesseurStatus[];
  message: string;
}

/**
 * Statut de professeur d'un utilisateur (GraphQL)
 */
export interface ProfesseurStatus {
  nom: string;
  prenom: string;
  isProf: boolean;
}

/**
 * Input pour vérifier un utilisateur par prénom et nom (GraphQL)
 */
export interface VerifierPrenomNomInput {
  prenom: string;
  nom: string;
}

/**
 * Input pour vérifier un utilisateur par email, prénom et nom (GraphQL)
 */
export interface VerifierEmailPrenomNomInput {
  email: string;
  prenom: string;
  nom: string;
}

/**
 * Input pour vérifier un cours dans le planning (GraphQL)
 */
export interface VerifierPlanningInput {
  jour: string;
  heureDebut: string;
  heureFin: string;
  typeCours: string;
}

/**
 * Input pour vérifier un article par nom et catégorie (GraphQL)
 */
export interface VerifierArticleCategorieInput {
  nom: string;
  categorieId: number;
}

/**
 * Input pour un utilisateur (nom et prénom) (GraphQL)
 */
export interface UtilisateurVerificationInput {
  nom: string;
  prenom: string;
}

/**
 * Input pour vérifier si des utilisateurs sont professeurs (GraphQL)
 */
export interface VerifierProfesseursInput {
  utilisateurs: UtilisateurVerificationInput[];
}

/**
 * Contexte GraphQL pour Vérification
 */
export interface VerificationContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
