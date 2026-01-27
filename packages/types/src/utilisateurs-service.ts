/**
 * Types pour le service Utilisateurs
 * Gestion des utilisateurs, authentification, profils et statistiques
 */

import { z } from 'zod';

/**
 * Statut d'un utilisateur
 */
export enum StatutUtilisateur {
  ACTIF = 1,
  INACTIF = 2,
  SUSPENDU = 3,
  EN_ATTENTE = 4,
  PROFESSEUR = 5
}

/**
 * Schéma Zod pour validation d'un utilisateur
 */
export const UtilisateurSchema = z.object({
  id: z.number().int().positive(),
  userId: z.string().optional(),
  first_name: z.string().min(1, 'Le prénom est requis'),
  last_name: z.string().min(1, 'Le nom est requis'),
  nom_utilisateur: z.string().optional(),
  email: z.string().email('Email invalide'),
  genre_id: z.number().int().positive().optional(),
  date_of_birth: z.date().nullable(),
  grade_id: z.number().int().positive().nullable(),
  abonnement_id: z.number().int().positive().nullable(),
  status_id: z.number().int().positive().default(1),
  active: z.boolean().default(true),
  date_inscription: z.date().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

/**
 * Type Utilisateur de base
 */
export type Utilisateur = z.infer<typeof UtilisateurSchema>;

/**
 * Utilisateur avec détails complets (relations)
 */
export interface UtilisateurAvecDetails extends Omit<Utilisateur, 'date_of_birth' | 'date_inscription' | 'created_at' | 'updated_at'> {
  date_of_birth: Date | null;
  date_inscription?: Date;
  created_at?: Date;
  updated_at?: Date;
  genre?: {
    id: number;
    nom: string;
  };
  grade?: {
    id: number;
    nom: string;
    niveau: number;
  };
  abonnement?: {
    id: number;
    nom: string;
    type: string;
  };
  status?: {
    id: number;
    nom: string;
  };
  age?: number;
  initiales?: string;
}

/**
 * Utilisateur pour recherche (version allégée)
 */
export interface UtilisateurRecherche {
  userId: string;
  prenom: string;
  nom: string;
  date_naissance: Date | null;
  nom_utilisateur?: string;
  age?: number;
  initiales?: string;
  relation_familiale?: string | null;
  est_responsable?: boolean;
}

/**
 * Input pour créer un utilisateur
 */
export const CreerUtilisateurInputSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis'),
  last_name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').optional(),
  date_of_birth: z.union([z.date(), z.string()]),
  genre_id: z.number().int().positive().optional(),
  abonnement_id: z.number().int().positive().optional(),
  grade_id: z.number().int().positive().optional(),
  nom_utilisateur: z.string().optional(),
  status_id: z.number().int().positive().optional()
});

export type CreerUtilisateurInput = z.infer<typeof CreerUtilisateurInputSchema>;

/**
 * Input pour modifier un utilisateur
 */
export const ModifierUtilisateurInputSchema = z.object({
  id: z.number().int().positive('ID utilisateur requis'),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  date_of_birth: z.union([z.date(), z.string()]).optional(),
  genre_id: z.number().int().positive().optional(),
  abonnement_id: z.number().int().positive().optional(),
  grade_id: z.number().int().positive().optional(),
  nom_utilisateur: z.string().optional(),
  status_id: z.number().int().positive().optional()
});

export type ModifierUtilisateurInput = z.infer<typeof ModifierUtilisateurInputSchema>;

/**
 * Input pour l'inscription d'un utilisateur
 */
export const InscrireUtilisateurInputSchema = z.object({
  first_name: z.string().min(1, 'Le prénom est requis'),
  last_name: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  date_of_birth: z.union([z.date(), z.string()]),
  genre_id: z.number().int().positive('Le genre est requis'),
  abonnement_id: z.number().int().positive().optional(),
  grade_id: z.number().int().positive().optional(),
  nom_utilisateur: z.string().optional()
});

export type InscrireUtilisateurInput = z.infer<typeof InscrireUtilisateurInputSchema>;

/**
 * Input pour la connexion
 */
export const ConnexionInputSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis')
});

export type ConnexionInput = z.infer<typeof ConnexionInputSchema>;

/**
 * Input pour la connexion par userId
 */
export const ConnexionParUserIdInputSchema = z.object({
  userId: z.string().min(1, 'Le userId est requis'),
  password: z.string().min(1, 'Le mot de passe est requis')
});

export type ConnexionParUserIdInput = z.infer<typeof ConnexionParUserIdInputSchema>;

/**
 * Résultat de connexion
 */
export interface ConnexionResult {
  success: boolean;
  message: string;
  utilisateur?: {
    id: number;
    userId?: string;
    prenom: string;
    nom: string;
    nom_utilisateur?: string;
    email: string;
    date_naissance: Date | null;
    status_id: number;
    grade_id: number | null;
    abonnement_id: number | null;
  };
}

/**
 * Statistiques des utilisateurs
 */
export interface StatistiquesUtilisateurs {
  totalUtilisateurs: number;
  utilisateursActifs: number;
  utilisateursInactifs: number;
  nouveauxUtilisateurs30Jours: number;
  utilisateursSuspendus: number;
  repartitionParGenre?: Array<{
    genre: string;
    count: number;
  }>;
  repartitionParGrade?: Array<{
    grade: string;
    count: number;
  }>;
  repartitionParAbonnement?: Array<{
    abonnement: string;
    count: number;
  }>;
  repartitionParAge?: Array<{
    trancheAge: string;
    count: number;
  }>;
  moyenneAge?: number;
}

/**
 * Statistiques par utilisateur
 */
export interface StatistiquesUtilisateur {
  utilisateurId: number;
  nombreCoursInscrits: number;
  nombreCoursAssistes: number;
  tauxPresence: number;
  tempsPratique: number;
  progression?: {
    gradeActuel: string;
    prochainGrade?: string;
    tempsDansGrade: number;
  };
  dernierCours?: Date;
  prochainCours?: Date;
}

/**
 * Options de filtrage pour les utilisateurs
 */
export interface UtilisateursFiltres {
  status_id?: number;
  grade_id?: number;
  genre_id?: number;
  abonnement_id?: number;
  recherche?: string;
  actif?: boolean;
  limit?: number;
  offset?: number;
  dateInscriptionDebut?: Date;
  dateInscriptionFin?: Date;
  ageMin?: number;
  ageMax?: number;
}

/**
 * Réponse paginée pour les utilisateurs
 */
export interface UtilisateursPaginatedResponse {
  utilisateurs: UtilisateurAvecDetails[];
  total: number;
  hasMore: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Input pour désactiver un utilisateur
 */
export const DesactiverUtilisateurInputSchema = z.object({
  id: z.number().int().positive('ID utilisateur requis'),
  motif: z.string().optional()
});

export type DesactiverUtilisateurInput = z.infer<typeof DesactiverUtilisateurInputSchema>;

/**
 * Input pour réactiver un utilisateur
 */
export const ReactiverUtilisateurInputSchema = z.object({
  id: z.number().int().positive('ID utilisateur requis')
});

export type ReactiverUtilisateurInput = z.infer<typeof ReactiverUtilisateurInputSchema>;

/**
 * Résultat de vérification d'email
 */
export interface VerificationEmailResult {
  existe: boolean;
  utilisateurId?: number;
  actif?: boolean;
}

/**
 * Résultat de vérification d'utilisateur
 */
export interface VerificationUtilisateurResult {
  existe: boolean;
  canRegister: boolean;
  message: string;
  utilisateur?: {
    id: number;
    userId?: string;
    nom: string;
    prenom: string;
    email: string;
    date_naissance: Date | null;
  };
}

/**
 * Réponse d'opération utilisateur
 */
export interface UtilisateursResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

/**
 * Erreur personnalisée pour les utilisateurs
 */
export class UtilisateursError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'UtilisateursError';
    this.code = code;
    Object.setPrototypeOf(this, UtilisateursError.prototype);
  }
}

/**
 * Codes d'erreur pour les utilisateurs
 */
export enum UtilisateursErrorCode {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_INACTIVE = 'USER_INACTIVE',
  USER_SUSPENDED = 'USER_SUSPENDED',
  INVALID_AGE = 'INVALID_AGE',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  INVALID_INPUT = 'INVALID_INPUT',
  OPERATION_FAILED = 'OPERATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

/**
 * Résultat de création d'utilisateur
 */
export interface CreerUtilisateurResult {
  success: boolean;
  message: string;
  utilisateur?: UtilisateurAvecDetails;
  userId?: string;
  generatedUserId?: string;
}

/**
 * Résultat de modification d'utilisateur
 */
export interface ModifierUtilisateurResult {
  success: boolean;
  message: string;
  utilisateur?: UtilisateurAvecDetails;
}

/**
 * Résultat de désactivation/réactivation
 */
export interface ActivationResult {
  success: boolean;
  message: string;
}

/**
 * Options de tri pour les utilisateurs
 */
export interface UtilisateursTriOptions {
  champ: 'nom' | 'prenom' | 'date_inscription' | 'date_naissance' | 'email';
  ordre: 'asc' | 'desc';
}

/**
 * Informations complètes d'un utilisateur (avec relations et données sensibles)
 */
export interface UtilisateurInformationsCompletes extends UtilisateurAvecDetails {
  inscriptions?: Array<{
    id: number;
    cours_id: number;
    cours_nom: string;
    date_inscription: Date;
  }>;
  paiements?: Array<{
    id: number;
    montant: number;
    date: Date;
    statut: string;
  }>;
  historiqueCours?: Array<{
    cours_id: number;
    date: Date;
    present: boolean;
  }>;
}

/**
 * Input pour rechercher des utilisateurs par email
 */
export const RechercherParEmailInputSchema = z.object({
  email: z.string().email('Email invalide'),
  limit: z.number().int().positive().optional().default(10)
});

export type RechercherParEmailInput = z.infer<typeof RechercherParEmailInputSchema>;

/**
 * Résultat de la génération de userId
 */
export interface GenererUserIdResult {
  userId: string;
  attempts: number;
}
