/**
 * Types GraphQL pour Statistiques (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module statistiques/graphql.types
 */

/**
 * Fréquentation par mois (GraphQL)
 */
export interface FrequentationMois {
  mois: string;
  annee: number;
  totalPresences: number;
  moyenne: number;
}

/**
 * Fréquentation par utilisateur (GraphQL)
 */
export interface FrequentationUtilisateur {
  utilisateurId: number;
  nom: string;
  prenom: string;
  totalPresences: number;
  tauxPresence: number;
  dernierCours?: string;
}

/**
 * Fréquentation par cours (GraphQL)
 */
export interface FrequentationCours {
  coursId: number;
  typeCours: string;
  totalParticipants: number;
  moyennePresence: number;
  tauxOccupation: number;
}

/**
 * Progression d'un utilisateur (GraphQL)
 */
export interface ProgressionUtilisateur {
  utilisateurId: number;
  nom: string;
  prenom: string;
  gradeActuel?: string;
  gradePrecedent?: string;
  dateProgression?: string;
  coursSuivis: number;
  heuresFormation: number;
}

/**
 * Statistiques globales de fréquentation (GraphQL)
 */
export interface StatistiquesFrequentation {
  totalPresences: number;
  moyennePresencesParCours: number;
  tauxPresenceGlobal: number;
  frequentationParMois: FrequentationMois[];
  frequentationParCours: FrequentationCours[];
  topUtilisateurs?: FrequentationUtilisateur[];
}

/**
 * Statistiques de progression globales (GraphQL)
 */
export interface StatistiquesProgression {
  totalProgressions: number;
  progressionsMoisEnCours: number;
  moyenneHeuresAvantProgression: number;
  progressionParGrade?: ProgressionParGrade[];
  utilisateursEnProgression?: ProgressionUtilisateur[];
}

/**
 * Progression par grade (GraphQL)
 */
export interface ProgressionParGrade {
  grade: string;
  nombreProgressions: number;
  moyenneHeures: number;
  moyenneMois: number;
}

/**
 * Statistiques de présence pour un utilisateur (GraphQL)
 */
export interface StatistiquesPresenceUtilisateur {
  utilisateurId: number;
  nom: string;
  prenom: string;
  totalCours: number;
  coursPresents: number;
  coursAbsents: number;
  tauxPresence: number;
  dernierePresence?: string;
  coursParType?: PresenceParType[];
}

/**
 * Présence par type de cours (GraphQL)
 */
export interface PresenceParType {
  typeCours: string;
  nombreCours: number;
  nombrePresences: number;
  tauxPresence: number;
}

/**
 * Statistiques de performance globales (GraphQL)
 */
export interface StatistiquesPerformance {
  frequentation: StatistiquesFrequentation;
  progression: StatistiquesProgression;
  revenu?: StatistiquesRevenu;
}

/**
 * Statistiques de revenu (GraphQL)
 */
export interface StatistiquesRevenu {
  revenuTotal: number;
  revenuMoisEnCours: number;
  revenuMoisPrecedent: number;
  evolutionPourcentage: number;
  revenuParAbonnement?: RevenuParAbonnement[];
}

/**
 * Revenu par type d'abonnement (GraphQL)
 */
export interface RevenuParAbonnement {
  abonnement: string;
  revenu: number;
  nombreAbonnes: number;
  pourcentage: number;
}

/**
 * Dashboard des statistiques (GraphQL)
 */
export interface StatistiquesDashboard {
  frequentation: FrequentationResume;
  progression: ProgressionResume;
  revenu: RevenuResume;
  activiteRecente: ActiviteRecente[];
}

/**
 * Résumé de fréquentation pour dashboard (GraphQL)
 */
export interface FrequentationResume {
  presencesAujourdhui: number;
  presencesSemaine: number;
  presencesMois: number;
  tauxPresenceGlobal: number;
  evolution: number;
}

/**
 * Résumé de progression pour dashboard (GraphQL)
 */
export interface ProgressionResume {
  progressionsMois: number;
  progressionsSemestre: number;
  utilisateursEnCours: number;
  moyenneProgression: number;
}

/**
 * Résumé de revenu pour dashboard (GraphQL)
 */
export interface RevenuResume {
  revenuMois: number;
  revenuAnnee: number;
  nouveauxAbonnes: number;
  evolutionPourcentage: number;
}

/**
 * Activité récente (GraphQL)
 */
export interface ActiviteRecente {
  type: string;
  description: string;
  utilisateur?: string;
  date: string;
  details?: Record<string, any>;
}

/**
 * Input pour obtenir statistiques de fréquentation (GraphQL)
 */
export interface GetStatistiquesFrequentationInput {
  dateDebut?: string;
  dateFin?: string;
  typeCours?: string;
  limit?: number;
}

/**
 * Input pour obtenir statistiques de progression (GraphQL)
 */
export interface GetStatistiquesProgressionInput {
  dateDebut?: string;
  dateFin?: string;
  gradeId?: number;
  limit?: number;
}

/**
 * Input pour obtenir statistiques utilisateur (GraphQL)
 */
export interface GetStatistiquesUtilisateurInput {
  utilisateurId: number;
  dateDebut?: string;
  dateFin?: string;
}

/**
 * Input pour le dashboard (GraphQL)
 */
export interface GetDashboardInput {
  periode?: 'jour' | 'semaine' | 'mois' | 'annee';
}

/**
 * Résultat d'export de statistiques (GraphQL)
 */
export interface ExportStatistiquesResult {
  success: boolean;
  message: string;
  fileUrl?: string;
  format?: string;
}

/**
 * Input pour exporter des statistiques (GraphQL)
 */
export interface ExportStatistiquesInput {
  type: 'frequentation' | 'progression' | 'revenu' | 'complet';
  format?: 'csv' | 'xlsx' | 'pdf';
  dateDebut?: string;
  dateFin?: string;
}

/**
 * Contexte GraphQL pour Statistiques
 */
export interface StatistiquesContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
