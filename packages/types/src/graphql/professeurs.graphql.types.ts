/**
 * Types GraphQL pour le module Professeurs
 * Définit les types, queries et mutations pour la gestion des professeurs
 */

/**
 * TypeDefs GraphQL pour le module Professeurs
 */
export const professeursTypeDefs = `
  # Type représentant un professeur
  type Professeur {
    id: Int!
    first_name: String!
    last_name: String!
    email: String!
    role_id: Int
    status_id: Int
    date_creation: String
    telephone: String
    adresse: String
    nom_utilisateur: String
    genre_id: Int
    date_of_birth: String
    grade_id: Int
  }

  # Type représentant un cours dans le planning d'un professeur
  type CoursProfesseur {
    id: Int!
    nom_cours: String!
    description: String
    jour_semaine: String!
    heure_debut: String!
    heure_fin: String!
    salle: String
    niveau: String
    capacite_max: Int
    professeur_id: Int!
    nombre_inscrits: Int
  }

  # Réponse pour les opérations de professeurs
  type ProfesseurResponse {
    success: Boolean!
    message: String!
    data: JSON
  }

  # Réponse pour le planning d'un professeur
  type PlanningProfesseurResponse {
    success: Boolean!
    isFind: Boolean!
    message: String!
    data: [CoursProfesseur!]!
    count: Int!
    professeur_id: Int!
  }

  # Input pour ajouter/promouvoir un professeur
  input AjouterProfesseurInput {
    utilisateurs: [JSON]
    id: Int
    userId: Int
    user_id: Int
    users: [JSON]
  }

  # Input pour modifier le statut d'un professeur
  input ModifierStatutProfesseurInput {
    id: Int!
    status_id: Int!
  }

  extend type Query {
    # Récupérer tous les professeurs
    professeurs: ProfesseurResponse!

    # Récupérer un professeur par son ID
    professeur(id: Int!): ProfesseurResponse!

    # Récupérer le planning d'un professeur
    planningProfesseur(id: Int!): PlanningProfesseurResponse!
  }

  extend type Mutation {
    # Ajouter/promouvoir un ou plusieurs utilisateurs comme professeurs
    ajouterProfesseur(input: AjouterProfesseurInput!): ProfesseurResponse!

    # Modifier le statut d'un professeur
    modifierStatutProfesseur(input: ModifierStatutProfesseurInput!): ProfesseurResponse!
  }
`;

/**
 * Type représentant un professeur
 */
export interface ProfesseurType {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id?: number;
  status_id?: number;
  date_creation?: string;
  telephone?: string;
  adresse?: string;
  nom_utilisateur?: string;
  genre_id?: number;
  date_of_birth?: string;
  grade_id?: number;
}

/**
 * Type représentant un cours dans le planning d'un professeur
 */
export interface CoursProfesseurType {
  id: number;
  nom_cours: string;
  description?: string;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle?: string;
  niveau?: string;
  capacite_max?: number;
  professeur_id: number;
  nombre_inscrits?: number;
}

/**
 * Type de réponse pour les opérations de professeurs
 */
export interface ProfesseurResponse {
  success: boolean;
  message: string;
  data?: ProfesseurType | ProfesseurType[] | any;
}

/**
 * Type de réponse pour le planning d'un professeur
 */
export interface PlanningProfesseurResponse {
  success: boolean;
  isFind: boolean;
  message: string;
  data: CoursProfesseurType[];
  count: number;
  professeur_id: number;
}

/**
 * Input pour ajouter/promouvoir un professeur
 */
export interface AjouterProfesseurInput {
  utilisateurs?: (
    | number
    | string
    | { id: number }
    | { userId: number }
    | { user_id: number }
  )[];
  id?: number;
  userId?: number;
  user_id?: number;
  users?: (number | string | { id: number })[];
}

/**
 * Input pour modifier le statut d'un professeur
 */
export interface ModifierStatutProfesseurInput {
  id: number;
  status_id: number;
}

/**
 * Queries disponibles pour les professeurs
 */
export interface ProfesseursQueries {
  professeurs: () => Promise<ProfesseurResponse>;
  professeur: (args: { id: number }) => Promise<ProfesseurResponse>;
  planningProfesseur: (args: {
    id: number;
  }) => Promise<PlanningProfesseurResponse>;
}

/**
 * Mutations disponibles pour les professeurs
 */
export interface ProfesseursMutations {
  ajouterProfesseur: (args: {
    input: AjouterProfesseurInput;
  }) => Promise<ProfesseurResponse>;
  modifierStatutProfesseur: (args: {
    input: ModifierStatutProfesseurInput;
  }) => Promise<ProfesseurResponse>;
}
