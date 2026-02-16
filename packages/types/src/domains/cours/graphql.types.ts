/**
 * Types GraphQL pour Cours (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module cours/graphql.types
 */

/**
 * Cours récurrent (GraphQL)
 */
export interface CoursRecurrent {
  id: number;
  nom: string;
  typeCours: string;
  jourSemaine: string;
  heureDebut: string;
  heureFin: string;
  placesMax?: number;
  estRecurrentActif: boolean;
  professeurs?: Professeur[];
}

/**
 * Cours ponctuel/instance (GraphQL)
 */
export interface Cours {
  id: number;
  coursRecurrentId?: number;
  dateCours: string;
  typeCours: string;
  heureDebut: string;
  heureFin: string;
  placesMax?: number;
  placesDisponibles?: number;
  statut: string;
  professeurs?: Professeur[];
  participants?: Participant[];
}

/**
 * Professeur d'un cours (GraphQL)
 */
export interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
}

/**
 * Participant à un cours (GraphQL)
 */
export interface Participant {
  id: number;
  utilisateurId: number;
  nom: string;
  prenom: string;
  presence: boolean;
  dateInscription: string;
}

/**
 * Résultat d'une opération sur cours (GraphQL)
 */
export interface CoursOperationResult {
  success: boolean;
  message: string;
  cours?: Cours;
}

/**
 * Résultat de liste de cours (GraphQL)
 */
export interface CoursListResult {
  cours: Cours[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Statistiques des cours (GraphQL)
 */
export interface CoursStatistiques {
  totalCours: number;
  coursActifs: number;
  coursAnnules: number;
  tauxOccupation: number;
  moyenneParticipants: number;
}

/**
 * Planning hebdomadaire (GraphQL)
 */
export interface PlanningHebdomadaire {
  jour: string;
  cours: CoursRecurrent[];
}

/**
 * Input pour créer un cours récurrent (GraphQL)
 */
export interface CreateCoursRecurrentInput {
  nom: string;
  typeCours: string;
  jourSemaine: string;
  heureDebut: string;
  heureFin: string;
  placesMax?: number;
  professeurIds?: number[];
}

/**
 * Input pour créer un cours ponctuel (GraphQL)
 */
export interface CreateCoursInput {
  coursRecurrentId?: number;
  dateCours: string;
  typeCours: string;
  heureDebut: string;
  heureFin: string;
  placesMax?: number;
  professeurIds?: number[];
}

/**
 * Input pour modifier un cours (GraphQL)
 */
export interface UpdateCoursInput {
  nom?: string;
  typeCours?: string;
  jourSemaine?: string;
  heureDebut?: string;
  heureFin?: string;
  placesMax?: number;
  professeurIds?: number[];
  statut?: string;
}

/**
 * Input pour inscrire un utilisateur (GraphQL)
 */
export interface InscrireUtilisateurInput {
  coursId: number;
  utilisateurId: number;
}

/**
 * Input pour marquer la présence (GraphQL)
 */
export interface MarquerPresenceInput {
  coursId: number;
  utilisateurId: number;
  present: boolean;
}

/**
 * Input pour obtenir les cours par date (GraphQL)
 */
export interface GetCoursParDateInput {
  dateDebut: string;
  dateFin: string;
  typeCours?: string;
}

/**
 * Contexte GraphQL pour Cours
 */
export interface CoursContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
