/**
 * Types GraphQL pour le module Vérification
 * Types TypeScript correspondant aux schémas GraphQL
 */

/**
 * Résultat standard d'une vérification
 */
export interface VerificationResult {
  exists: boolean;
  message: string;
}

/**
 * Résultat du health check du service de vérification
 */
export interface VerificationHealthResult {
  status: string;
  message: string;
  checks: VerificationChecks;
}

/**
 * Détails des vérifications du health check
 */
export interface VerificationChecks {
  database: boolean;
  verification: boolean;
}

/**
 * Résultat de la vérification des professeurs
 */
export interface VerifierProfesseursResult {
  professeurs: ProfesseurStatus[];
  message: string;
}

/**
 * Statut de professeur d'un utilisateur
 */
export interface ProfesseurStatus {
  nom: string;
  prenom: string;
  isProf: boolean;
}

/**
 * Input pour vérifier un utilisateur par prénom et nom
 */
export interface VerifierPrenomNomInput {
  prenom: string;
  nom: string;
}

/**
 * Input pour vérifier un utilisateur par email, prénom et nom
 */
export interface VerifierEmailPrenomNomInput {
  email: string;
  prenom: string;
  nom: string;
}

/**
 * Input pour vérifier un cours dans le planning
 */
export interface VerifierPlanningInput {
  jour: string;
  heure_debut: string;
  heure_fin: string;
  type_cours: string;
}

/**
 * Input pour vérifier un article par nom et catégorie
 */
export interface VerifierArticleCategorieInput {
  nom: string;
  categorie_id: number;
}

/**
 * Input pour un utilisateur (nom et prénom)
 */
export interface UtilisateurInput {
  nom: string;
  prenom: string;
}

/**
 * Input pour vérifier si des utilisateurs sont professeurs
 */
export interface VerifierProfesseursInput {
  utilisateurs: UtilisateurInput[];
}

/**
 * Contexte GraphQL pour le module Vérification
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
