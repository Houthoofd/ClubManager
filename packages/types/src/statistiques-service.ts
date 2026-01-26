/**
 * Types et schémas pour le service Statistiques
 * Gère les statistiques de fréquentation, progression, financières et membres
 */

import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

/**
 * Types de statistiques disponibles
 */
export enum TypeStatistique {
  GENERALES = 'generales',
  FREQUENTATION = 'frequentation',
  PROGRESSION = 'progression',
  FINANCIERES = 'financieres',
  MEMBRES = 'membres',
  COURS = 'cours',
  PAIEMENTS = 'paiements'
}

/**
 * Périodes pour les statistiques
 */
export enum PeriodeStatistique {
  JOUR = 'jour',
  SEMAINE = 'semaine',
  MOIS = 'mois',
  TRIMESTRE = 'trimestre',
  ANNEE = 'annee',
  PERSONNALISEE = 'personnalisee'
}

/**
 * Niveaux de progression
 */
export enum NiveauProgression {
  DEBUTANT = 'Débutant',
  INTERMEDIAIRE = 'Intermédiaire',
  AVANCE = 'Avancé',
  EXPERT = 'Expert'
}

// ============================================
// INTERFACES - STATISTIQUES GÉNÉRALES
// ============================================

/**
 * Statistiques générales du club
 */
export interface StatistiquesGenerales {
  total_utilisateurs: number;
  cours_a_venir: number;
  total_inscriptions: number;
  total_professeurs: number;
  nombreMembres?: number;
  coursSemaine?: number;
  plansActifs?: number;
}

/**
 * Statistiques par cours
 */
export interface StatistiquesParCours {
  type_cours: string;
  nombre_inscriptions: number;
  taux_presence: number;
}

/**
 * Statistiques de présence globale
 */
export interface StatistiquesPresenceGlobale {
  date_cours: Date;
  type_cours: string;
  total_inscrits: number;
  presents: number;
  taux_presence?: number;
}

// ============================================
// INTERFACES - FRÉQUENTATION
// ============================================

/**
 * Statistiques de fréquentation par utilisateur
 */
export interface StatistiquesFrequentationUtilisateur {
  utilisateur_id: number;
  mois: string;
  frequentation: number;
  nombres_total_de_cours_du_mois: number;
  pourcentage_de_cours_valides: number;
  totalFrequentation: number;
}

/**
 * Fréquentation par cours
 */
export interface FrequentationParCours {
  cours_id: number;
  titre: string;
  frequentation: number;
  pourcentage?: number;
}

/**
 * Fréquentation par mois
 */
export interface FrequentationParMois {
  mois: string;
  mois_num?: number;
  annee?: number;
  frequentation: number;
  montant?: number;
  count?: number;
}

/**
 * Présences par mois pour un utilisateur
 */
export interface PresenceParMois {
  last_name: string;
  first_name: string;
  mois: number;
  nom_mois: string;
  type_cours: string;
  total_presences: number;
}

/**
 * Statistiques de présence par mois (tous utilisateurs)
 */
export interface StatistiquesPresenceParMois {
  mois: number;
  nom_mois: string;
  total_inscriptions: number;
  presences_validees: number;
  taux_presence?: number;
}

// ============================================
// INTERFACES - PROGRESSION
// ============================================

/**
 * Progression par cours
 */
export interface ProgressionParCours {
  cours_id: number;
  titre: string;
  cours_suivis: number;
  progression: number;
}

/**
 * Statistiques de progression utilisateur
 */
export interface StatistiquesProgressionUtilisateur {
  utilisateur_id: number;
  coursSuivis: number;
  progressionParCours: ProgressionParCours[];
  niveauActuel: string;
  pourcentage_global?: number;
}

/**
 * Évolution des inscriptions
 */
export interface EvolutionInscriptions {
  date_inscription: Date;
  nouvelles_inscriptions: number;
}

// ============================================
// INTERFACES - FINANCIÈRES
// ============================================

/**
 * Statistiques financières globales
 */
export interface StatistiquesFinancieres {
  totalPaiementsMois: number;
  paiementsRecents: number;
  paiementsEnAttente: number;
  tauxRenouvellement: number;
  paiementsParMois: PaiementParMois[];
  derniersPaiements?: DernierPaiement[];
  paiementsEchus?: PaiementEchu[];
}

/**
 * Paiements par mois
 */
export interface PaiementParMois {
  mois: string;
  total: number;
  annee?: number;
  nombre_paiements?: number;
}

/**
 * Dernier paiement
 */
export interface DernierPaiement {
  montant: number;
  date_paiement: Date;
  statut: string;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
}

/**
 * Paiement échu
 */
export interface PaiementEchu {
  montant: number;
  date_echeance: Date;
  statut: string;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  utilisateur_id: number;
}

// ============================================
// INTERFACES - MEMBRES
// ============================================

/**
 * Statistiques membres
 */
export interface StatistiquesMembres {
  nombreMembres: number;
  nouveauxMembres: NouveauMembre[];
  membresParPlan: MembresParPlan[];
  topMembresAssidus: MembreAssidu[];
  membresParGrade?: MembresParGrade[];
  membresParGenre?: MembresParGenre[];
  prochainsAnniversaires?: ProchainAnniversaire[];
}

/**
 * Nouveau membre
 */
export interface NouveauMembre {
  first_name: string;
  last_name: string;
  email: string;
  date_inscription: Date;
  plan_name?: string;
}

/**
 * Membres par plan
 */
export interface MembresParPlan {
  plan: string;
  value: number;
  pourcentage?: number;
}

/**
 * Membre assidu
 */
export interface MembreAssidu {
  first_name: string;
  last_name: string;
  total_presences_validees: number;
  pourcentage?: number;
}

/**
 * Membres par grade
 */
export interface MembresParGrade {
  grade_id: string;
  count: number;
  pourcentage?: number;
}

/**
 * Membres par genre
 */
export interface MembresParGenre {
  genre_name: string;
  count: number;
  pourcentage?: number;
}

/**
 * Prochain anniversaire
 */
export interface ProchainAnniversaire {
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  jours_restants?: number;
}

// ============================================
// INTERFACES - MAGASIN
// ============================================

/**
 * Article le plus vendu
 */
export interface ArticlePlusVendu {
  nom: string;
  total_vendu: number;
  montant_total?: number;
}

// ============================================
// INTERFACES - INPUTS
// ============================================

/**
 * Input pour statistiques par période
 */
export interface StatistiquesParPeriodeInput {
  dateDebut: Date;
  dateFin: Date;
  type?: TypeStatistique;
}

/**
 * Input pour statistiques utilisateur
 */
export interface StatistiquesUtilisateurInput {
  utilisateurId: number;
  periode?: PeriodeStatistique;
  dateDebut?: Date;
  dateFin?: Date;
}

/**
 * Input pour statistiques cours
 */
export interface StatistiquesCoursInput {
  coursId?: number;
  typeCours?: string;
  dateDebut?: Date;
  dateFin?: Date;
}

// ============================================
// SCHEMAS ZOD
// ============================================

/**
 * Schema pour les statistiques générales
 */
export const StatistiquesGeneralesSchema = z.object({
  total_utilisateurs: z.number().int().nonnegative(),
  cours_a_venir: z.number().int().nonnegative(),
  total_inscriptions: z.number().int().nonnegative(),
  total_professeurs: z.number().int().nonnegative(),
  nombreMembres: z.number().int().nonnegative().optional(),
  coursSemaine: z.number().int().nonnegative().optional(),
  plansActifs: z.number().int().nonnegative().optional()
});

/**
 * Schema pour input période
 */
export const StatistiquesParPeriodeInputSchema = z.object({
  dateDebut: z.coerce.date(),
  dateFin: z.coerce.date(),
  type: z.nativeEnum(TypeStatistique).optional()
}).refine(data => data.dateFin >= data.dateDebut, {
  message: 'La date de fin doit être postérieure ou égale à la date de début'
});

/**
 * Schema pour input utilisateur
 */
export const StatistiquesUtilisateurInputSchema = z.object({
  utilisateurId: z.number().int().positive(),
  periode: z.nativeEnum(PeriodeStatistique).optional(),
  dateDebut: z.coerce.date().optional(),
  dateFin: z.coerce.date().optional()
});

/**
 * Schema pour input cours
 */
export const StatistiquesCoursInputSchema = z.object({
  coursId: z.number().int().positive().optional(),
  typeCours: z.string().optional(),
  dateDebut: z.coerce.date().optional(),
  dateFin: z.coerce.date().optional()
});

/**
 * Schema pour fréquentation par cours
 */
export const FrequentationParCoursSchema = z.object({
  cours_id: z.number().int().positive(),
  titre: z.string(),
  frequentation: z.number().int().nonnegative(),
  pourcentage: z.number().nonnegative().optional()
});

/**
 * Schema pour progression par cours
 */
export const ProgressionParCoursSchema = z.object({
  cours_id: z.number().int().positive(),
  titre: z.string(),
  cours_suivis: z.number().int().nonnegative(),
  progression: z.number().nonnegative()
});

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Réponse générique pour les statistiques
 */
export interface StatistiquesDataResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    periode?: PeriodeStatistique;
    dateDebut?: Date;
    dateFin?: Date;
    count?: number;
  };
}

/**
 * Tableau de bord complet
 */
export interface TableauDeBord {
  generales: StatistiquesGenerales;
  financieres: StatistiquesFinancieres;
  membres: StatistiquesMembres;
  presenceParMois: StatistiquesPresenceParMois[];
  articlesPlusVendus: ArticlePlusVendu[];
}

// ============================================
// ERROR CLASS
// ============================================

/**
 * Classe d'erreur personnalisée pour le service Statistiques
 */
export class StatistiquesError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string = 'STATISTIQUES_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'StatistiquesError';
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, StatistiquesError.prototype);
  }
}

// ============================================
// FILTRES ET OPTIONS
// ============================================

/**
 * Filtres pour les statistiques
 */
export interface StatistiquesFiltres {
  utilisateurId?: number;
  coursId?: number;
  typeCours?: string;
  dateDebut?: Date;
  dateFin?: Date;
  periode?: PeriodeStatistique;
  limite?: number;
  offset?: number;
}

/**
 * Options de tri
 */
export interface StatistiquesTriOptions {
  champ: string;
  ordre: 'asc' | 'desc';
}
