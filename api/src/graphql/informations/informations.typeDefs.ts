/**
 * Définitions de types GraphQL pour le module Informations
 */

export const informationsTypeDefs = `#graphql
  """
  Information/Actualité du club
  """
  type Information {
    id: Int!
    titre: String!
    contenu: String!
    date_creation: String!
    date_modification: String
    status_id: Int!
    auteur_id: Int
    categorie_id: Int
    priorite: Int
    visible: Boolean!
    created_at: String
    updated_at: String
  }

  """
  Information avec relations (auteur, catégorie, status)
  """
  type InformationAvecRelations {
    id: Int!
    titre: String!
    contenu: String!
    date_creation: String!
    date_modification: String
    status_id: Int!
    auteur_id: Int
    categorie_id: Int
    priorite: Int
    visible: Boolean!
    auteur: String
    categorie: String
    status: String
  }

  """
  Résumé d'une information (version courte)
  """
  type InformationResume {
    id: Int!
    titre: String!
    extrait: String!
    date_creation: String!
    priorite: Int
    categorie: String
  }

  """
  Catégorie d'information
  """
  type CategorieInformation {
    id: Int!
    nom: String!
    description: String
    couleur: String
    icone: String
  }

  """
  Status d'une information
  """
  type Status {
    id: Int!
    nom_role: String!
    description: String
  }

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
    ordre: Int
  }

  """
  Plan tarifaire
  """
  type PlanTarifaire {
    id: Int!
    nom_plan: String!
    prix: Float!
    duree: String!
    description: String
  }

  """
  Statistiques des informations
  """
  type InformationStatistiques {
    total_informations: Int!
    informations_actives: Int!
    informations_archivees: Int!
    par_categorie: [CountByCategorie!]!
    par_status: [CountByStatus!]!
    informations_recentes: Int!
  }

  """
  Comptage par catégorie
  """
  type CountByCategorie {
    categorie: String!
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
  Input pour créer une information
  """
  input CreateInformationInput {
    titre: String!
    contenu: String!
    auteur_id: Int
    categorie_id: Int
    priorite: Int
    visible: Boolean
  }

  """
  Input pour mettre à jour une information
  """
  input UpdateInformationInput {
    titre: String
    contenu: String
    categorie_id: Int
    priorite: Int
    visible: Boolean
    status_id: Int
  }

  """
  Filtres de recherche d'informations
  """
  input InformationSearchFiltersInput {
    titre: String
    contenu: String
    categorie_id: Int
    status_id: Int
    auteur_id: Int
    visible: Boolean
    date_debut: String
    date_fin: String
    priorite_min: Int
    priorite_max: Int
    limit: Int
    offset: Int
  }

  """
  Résultat de recherche avec pagination
  """
  type InformationSearchResult {
    informations: [InformationAvecRelations!]!
    total: Int!
    page: Int!
    totalPages: Int!
    limit: Int!
  }

  """
  Résultat de confirmation d'opération
  """
  type InformationConfirmationResult {
    isConfirm: Boolean!
    message: String!
    data: String
  }

  """
  Tous les référentiels en un seul type
  """
  type Referentiels {
    status: [Status!]!
    genres: [Genre!]!
    grades: [Grade!]!
    plansTarifaires: [PlanTarifaire!]!
    categories: [CategorieInformation!]!
  }

  extend type Query {
    """
    Récupérer toutes les informations actives
    """
    informations: [Information!]!

    """
    Récupérer toutes les informations avec relations
    """
    informationsAvecRelations: [InformationAvecRelations!]!

    """
    Récupérer une information par son ID
    """
    information(id: Int!): Information

    """
    Récupérer une information avec relations par son ID
    """
    informationAvecRelations(id: Int!): InformationAvecRelations

    """
    Récupérer les informations par catégorie
    """
    informationsByCategorie(categorieId: Int!): [Information!]!

    """
    Récupérer les informations par auteur
    """
    informationsByAuteur(auteurId: Int!): [Information!]!

    """
    Récupérer les informations récentes
    """
    informationsRecentes(days: Int, limit: Int): [Information!]!

    """
    Récupérer les informations prioritaires
    """
    informationsPrioritaires(limit: Int): [Information!]!

    """
    Rechercher des informations avec filtres
    """
    searchInformations(filters: InformationSearchFiltersInput!): InformationSearchResult!

    """
    Récupérer tous les status
    """
    allStatus: [Status!]!

    """
    Récupérer tous les genres
    """
    allGenres: [Genre!]!

    """
    Récupérer tous les grades
    """
    allGrades: [Grade!]!

    """
    Récupérer tous les plans tarifaires
    """
    allPlansTarifaires: [PlanTarifaire!]!

    """
    Récupérer toutes les catégories d'informations
    """
    allCategories: [CategorieInformation!]!

    """
    Récupérer tous les référentiels en une seule requête
    """
    referentiels: Referentiels!

    """
    Obtenir les statistiques des informations
    """
    informationsStatistiques: InformationStatistiques!

    """
    Vérifier si une information existe
    """
    informationExists(id: Int!): Boolean!
  }

  extend type Mutation {
    """
    Créer une nouvelle information
    """
    createInformation(data: CreateInformationInput!): InformationConfirmationResult!

    """
    Mettre à jour une information
    """
    updateInformation(
      id: Int!
      data: UpdateInformationInput!
    ): InformationConfirmationResult!

    """
    Supprimer une information (soft delete)
    """
    deleteInformation(id: Int!): InformationConfirmationResult!

    """
    Supprimer définitivement une information
    """
    permanentDeleteInformation(id: Int!): InformationConfirmationResult!

    """
    Archiver une information
    """
    archiveInformation(id: Int!): InformationConfirmationResult!

    """
    Restaurer une information archivée
    """
    restoreInformation(id: Int!): InformationConfirmationResult!

    """
    Publier une information
    """
    publishInformation(id: Int!): InformationConfirmationResult!
  }
`;
