/**
 * Types GraphQL pour Professeurs (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module professeurs/graphql.types
 */

/**
 * Professeur (GraphQL)
 */
export interface Professeur {
  id: number;
  utilisateurId: number;
  nom: string;
  prenom: string;
  nomUtilisateur?: string;
  email: string;
  genreId?: number;
  dateNaissance?: string;
  gradeId?: number;
  statusId: number;
  actif: boolean;
  specialites?: string[];
  bio?: string;
  dateCreation?: string;
  dateModification?: string;
}

/**
 * Professeur avec détails (GraphQL)
 */
export interface ProfesseurAvecDetails {
  id: number;
  utilisateurId: number;
  nom: string;
  prenom: string;
  nomUtilisateur?: string;
  email: string;
  genreId?: number;
  genreName?: string;
  dateNaissance?: string;
  gradeId?: number;
  gradeName?: string;
  statusId: number;
  statusName?: string;
  actif: boolean;
  specialites?: string[];
  bio?: string;
  nombreCours?: number;
  nombreEleves?: number;
  dateCreation?: string;
  dateModification?: string;
}

/**
 * Planning d'un cours pour un professeur (GraphQL)
 */
export interface PlanningCoursProf {
  coursRecurrentId: number;
  typeCours: string;
  jourSemaine: number;
  heureDebut: string;
  heureFin: string;
  estRecurrentActif: boolean;
  professeurId: number;
  professeurNom: string;
  professeurPrenom: string;
}

/**
 * Résultat d'une opération sur professeur (GraphQL)
 */
export interface ProfesseurOperationResult {
  success: boolean;
  message: string;
  professeur?: Professeur;
}

/**
 * Résultat de liste de professeurs (GraphQL)
 */
export interface ProfesseursListResult {
  professeurs: ProfesseurAvecDetails[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Résultat du planning d'un professeur (GraphQL)
 */
export interface PlanningProfesseurResult {
  planning: PlanningCoursProf[];
  total: number;
  professeurId: number;
}

/**
 * Statistiques des professeurs (GraphQL)
 */
export interface StatistiquesProfesseurs {
  totalProfesseurs: number;
  professeursActifs: number;
  professeursInactifs: number;
  totalCours: number;
  totalEleves: number;
  moyenneCoursParProfesseur: number;
  moyenneElevesParProfesseur: number;
  repartitionParGrade?: RepartitionGrade[];
}

/**
 * Répartition par grade (GraphQL)
 */
export interface RepartitionGrade {
  grade: string;
  count: number;
}

/**
 * Statistiques par professeur (GraphQL)
 */
export interface StatistiquesProfesseur {
  professeurId: number;
  nombreCours: number;
  nombreEleves: number;
  tauxPresence: number;
  heuresEnseignement: number;
}

/**
 * Input pour ajouter/promouvoir un professeur (GraphQL)
 */
export interface AjouterProfesseurInput {
  utilisateurs: number[] | UtilisateurProfesseurInput[];
}

/**
 * Input pour un utilisateur à promouvoir professeur (GraphQL)
 */
export interface UtilisateurProfesseurInput {
  id: number;
}

/**
 * Input pour modifier le statut d'un professeur (GraphQL)
 */
export interface ModifierStatutProfesseurInput {
  id: number;
  statusId: number;
}

/**
 * Input pour modifier un professeur (GraphQL)
 */
export interface UpdateProfesseurInput {
  specialites?: string[];
  bio?: string;
  actif?: boolean;
  gradeId?: number;
}

/**
 * Input pour retirer la promotion de professeur (GraphQL)
 */
export interface RetirerPromotionInput {
  id: number;
  motif?: string;
}

/**
 * Résultat d'ajout de professeurs (GraphQL)
 */
export interface AjouterProfesseurResult {
  success: boolean;
  message: string;
  professeurs?: ProfesseurAvecDetails[];
  errors?: string[];
}

/**
 * Filtres pour recherche de professeurs (GraphQL)
 */
export interface ProfesseursFiltres {
  statusId?: number;
  gradeId?: number;
  genreId?: number;
  recherche?: string;
  actif?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Contexte GraphQL pour Professeurs
 */
export interface ProfesseursContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
