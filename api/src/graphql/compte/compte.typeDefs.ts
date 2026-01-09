/**
 * Définitions de types GraphQL pour le module Compte
 */

export const compteTypeDefs = `#graphql
  """
  Genre d'un utilisateur
  """
  type Genre {
    id: Int!
    genre_name: String!
  }

  """
  Grade d'un utilisateur
  """
  type Grade {
    id: Int!
    grade_id: String!
    nom_grade: String!
  }

  """
  Status d'un utilisateur
  """
  type Status {
    id: Int!
    nom_role: String!
  }

  """
  Plan tarifaire (abonnement)
  """
  type PlanTarifaire {
    id: Int!
    nom_plan: String!
    prix: Float!
    duree: String!
  }

  """
  Utilisateur avec informations complètes
  """
  type Utilisateur {
    id: Int!
    first_name: String!
    last_name: String!
    nom_utilisateur: String!
    email: String!
    genre_id: Int
    date_of_birth: String
    status_id: Int!
    grade_id: Int
    abonnement_id: Int
    phone: String
    created_at: String
    updated_at: String
  }

  """
  Utilisateur avec noms des relations
  """
  type UtilisateurAvecRelations {
    id: Int!
    first_name: String!
    last_name: String!
    nom_utilisateur: String!
    email: String!
    genres: String
    status: String
    grades: String
    abonnement: String
    date_of_birth: String
    phone: String
  }

  """
  Informations basiques du compte
  """
  type CompteInfo {
    id: Int!
    first_name: String!
    last_name: String!
    email: String!
    date_of_birth: String
    phone: String
  }

  """
  Données pour mettre à jour un compte (utilisateur final)
  """
  input UpdateCompteInput {
    first_name: String
    last_name: String
    email: String
    date_of_birth: String
    phone: String
  }

  """
  Données pour mettre à jour un utilisateur (admin)
  """
  input UpdateUtilisateurInput {
    email: String
    date_of_birth: String
    genre_id: Int
    grade_id: Int
    abonnement_id: Int
    status_id: Int
    phone: String
  }

  """
  Données pour mettre à jour le mot de passe
  """
  input UpdatePasswordInput {
    currentPassword: String
    newPassword: String!
  }

  """
  Filtres pour rechercher des utilisateurs
  """
  input CompteSearchFiltersInput {
    search: String
    genre_id: Int
    grade_id: Int
    abonnement_id: Int
    status_id: Int
    age_min: Int
    age_max: Int
    created_after: String
    created_before: String
    includeInactive: Boolean
    limit: Int
    offset: Int
  }

  """
  Résultat de recherche avec pagination
  """
  type CompteSearchResult {
    utilisateurs: [UtilisateurAvecRelations!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  """
  Statistiques des comptes
  """
  type CompteStatistiques {
    total_utilisateurs: Int!
    utilisateurs_actifs: Int!
    utilisateurs_inactifs: Int!
    nouveaux_ce_mois: Int!
    par_genre: [CountByGenre!]!
    par_status: [CountByStatus!]!
    par_abonnement: [CountByAbonnement!]!
  }

  """
  Comptage par genre
  """
  type CountByGenre {
    genre: String!
    count: Int!
  }

  """
  Comptage par status
  """
  type CountByStatus {
    status: String!
    count: Int!
  }

  """
  Comptage par abonnement
  """
  type CountByAbonnement {
    abonnement: String!
    count: Int!
  }

  """
  Résultat de vérification de disponibilité
  """
  type AvailabilityCheckResult {
    available: Boolean!
    message: String
  }

  """
  Résultat de confirmation
  """
  type ConfirmationResult {
    success: Boolean!
    message: String!
  }

  extend type Query {
    """
    Récupérer tous les utilisateurs actifs
    """
    utilisateurs: [Utilisateur!]!

    """
    Récupérer tous les utilisateurs avec relations
    """
    utilisateursAvecRelations: [UtilisateurAvecRelations!]!

    """
    Récupérer un utilisateur par son ID
    """
    utilisateur(id: Int!): Utilisateur

    """
    Récupérer un utilisateur avec relations par son ID
    """
    utilisateurAvecRelations(id: Int!): UtilisateurAvecRelations

    """
    Récupérer un utilisateur par son nom d'utilisateur
    """
    utilisateurByUsername(username: String!): Utilisateur

    """
    Récupérer un utilisateur par son email
    """
    utilisateurByEmail(email: String!): Utilisateur

    """
    Récupérer les informations basiques d'un compte
    """
    compteInfo(id: Int!): CompteInfo

    """
    Rechercher des utilisateurs avec filtres et pagination
    """
    searchUtilisateurs(filters: CompteSearchFiltersInput!): CompteSearchResult!

    """
    Vérifier si un email est disponible
    """
    checkEmailAvailability(email: String!): AvailabilityCheckResult!

    """
    Vérifier si un nom d'utilisateur est disponible
    """
    checkUsernameAvailability(username: String!): AvailabilityCheckResult!

    """
    Vérifier si un utilisateur est actif
    """
    isUtilisateurActive(id: Int!): Boolean!

    """
    Récupérer tous les genres
    """
    genres: [Genre!]!

    """
    Récupérer tous les grades
    """
    grades: [Grade!]!

    """
    Récupérer tous les status
    """
    status: [Status!]!

    """
    Récupérer tous les plans tarifaires
    """
    plansTarifaires: [PlanTarifaire!]!

    """
    Obtenir les statistiques des comptes
    """
    comptesStatistiques: CompteStatistiques!
  }

  extend type Mutation {
    """
    Mettre à jour les informations d'un compte (utilisateur final)
    """
    updateCompteInfo(
      id: Int!
      data: UpdateCompteInput!
    ): CompteInfo!

    """
    Mettre à jour un utilisateur (admin)
    """
    updateUtilisateur(
      id: Int!
      data: UpdateUtilisateurInput!
    ): Utilisateur!

    """
    Mettre à jour le mot de passe
    """
    updatePassword(
      id: Int!
      data: UpdatePasswordInput!
    ): ConfirmationResult!

    """
    Désactiver un compte (soft delete)
    """
    softDeleteCompte(id: Int!): ConfirmationResult!

    """
    Réactiver un compte
    """
    reactivateCompte(id: Int!): ConfirmationResult!
  }
`;
