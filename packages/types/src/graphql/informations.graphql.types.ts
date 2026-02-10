/**
 * TypeDefs GraphQL pour le module Informations
 * Gestion des informations du club et des référentiels (grades, genres, status, plans tarifaires)
 */

export const informationsTypeDefs = `#graphql
  # ============================================
  # TYPES - INFORMATIONS
  # ============================================

  """
  Information du club (annonce, actualité)
  """
  type Information {
    id: Int!
    titre: String!
    contenu: String!
    date_creation: String!
    status_id: Int!
  }

  """
  Résultat d'une opération sur une information
  """
  type InformationResult {
    success: Boolean!
    message: String!
    data: Information
  }

  # ============================================
  # TYPES - RÉFÉRENTIELS
  # ============================================

  """
  Grade de ceinture (référentiel)
  """
  type Grade {
    id: Int!
    nom: String!
    ordre: Int
  }

  """
  Genre (référentiel)
  """
  type Genre {
    id: Int!
    nom: String!
  }

  """
  Status (référentiel)
  """
  type Status {
    id: Int!
    nom: String!
  }

  """
  Plan tarifaire / Abonnement (référentiel)
  """
  type PlanTarifaire {
    id: Int!
    nom_plan: String!
    prix: Float!
    duree_mois: Int!
    description: String
  }

  """
  Tous les référentiels en un seul objet
  """
  type AllReferences {
    grades: [Grade!]!
    genres: [Genre!]!
    status: [Status!]!
    abonnements: [PlanTarifaire!]!
  }

  """
  Health check des référentiels
  """
  type ReferenceHealthCheck {
    status: String!
    checks: ReferenceHealthChecks!
    message: String!
    timestamp: String
  }

  """
  Détail des checks par référentiel
  """
  type ReferenceHealthChecks {
    grades: Boolean!
    genres: Boolean!
    status: Boolean!
    abonnements: Boolean!
  }

  # ============================================
  # INPUTS
  # ============================================

  """
  Input pour créer/modifier une information
  """
  input InformationInput {
    titre: String!
    contenu: String!
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """
    Récupère toutes les informations actives
    Requiert : Authentification
    """
    obtenirToutesLesInformations: [Information!]!

    """
    Récupère une information par son ID
    Requiert : Authentification
    """
    obtenirInformationParId(id: Int!): Information

    """
    Récupère tous les status (référentiel)
    Requiert : Authentification
    """
    obtenirLesStatus: [Status!]!

    """
    Récupère tous les plans tarifaires (référentiel)
    Requiert : Authentification
    """
    obtenirLesPlansTarifaires: [PlanTarifaire!]!

    """
    Récupère tous les genres (référentiel)
    Requiert : Authentification
    """
    obtenirLesGenres: [Genre!]!

    """
    Récupère tous les grades (référentiel)
    Requiert : Authentification
    """
    obtenirLesGrades: [Grade!]!

    """
    Récupère tous les référentiels en une seule requête
    Requiert : Authentification
    """
    obtenirTousLesReferentiels: AllReferences!

    """
    Health check des référentiels (diagnostic admin)
    Requiert : Admin
    """
    verifierSanteReferentiels: ReferenceHealthCheck!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """
    Ajoute une nouvelle information
    Requiert : Admin
    """
    ajouterInformation(input: InformationInput!): InformationResult!

    """
    Modifie une information existante
    Requiert : Admin
    """
    modifierInformation(id: Int!, input: InformationInput!): InformationResult!

    """
    Supprime une information (soft delete)
    Requiert : Admin
    """
    supprimerInformation(id: Int!): InformationResult!
  }
`;
