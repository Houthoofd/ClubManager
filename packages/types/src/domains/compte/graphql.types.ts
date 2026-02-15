/**
 * TypeDefs GraphQL pour le module Compte
 * Définit le schéma GraphQL pour la gestion des comptes utilisateurs
 */

export const compteTypeDefs = `#graphql
  # ============================================
  # TYPES
  # ============================================

  """
  Informations complètes d'un compte utilisateur
  """
  type CompteInfo {
    id: Int!
    first_name: String!
    last_name: String!
    nom_utilisateur: String
    email: String!
    date_of_birth: String
    phone: String
    genre_id: Int
    genre_name: String
    status_id: Int!
    status_name: String
    grade_id: Int
    grade_name: String
    abonnement_id: Int
    abonnement_name: String
  }

  """
  Résultat d'une opération sur compte
  """
  type CompteOperationResult {
    success: Boolean!
    message: String!
    compte: CompteInfo
  }

  """
  Résultat de recherche de comptes
  """
  type CompteSearchResult {
    isFind: Boolean!
    message: String!
    data: [CompteInfo!]!
  }

  """
  Résultat de conversion nom -> ID
  """
  type ConversionResult {
    genre_id: Int
    grade_id: Int
    status_id: Int
    abonnement_id: Int
  }

  """
  Genre utilisateur
  """
  type CompteGenre {
    id: Int!
    genre_name: String!
  }

  """
  Grade utilisateur
  """
  type CompteGrade {
    id: Int!
    grade_id: String!
    nom_grade: String
  }

  """
  Status utilisateur
  """
  type CompteStatus {
    id: Int!
    nom_role: String!
  }

  """
  Plan tarifaire (abonnement)
  """
  type ComptePlanTarifaire {
    id: Int!
    nom_plan: String!
    prix: Float
  }

  # ============================================
  # INPUTS
  # ============================================

  """
  Input pour mettre à jour un compte
  """
  input UpdateCompteInput {
    first_name: String
    last_name: String
    email: String
    date_of_birth: String
    phone: String
    genre_id: Int
    grade_id: Int
    abonnement_id: Int
    status_id: Int
  }

  """
  Input pour changer le mot de passe
  """
  input ChangePasswordInput {
    utilisateur_id: Int!
    current_password: String
    new_password: String!
    confirm_password: String!
  }

  """
  Input pour créer un mot de passe (premier login)
  """
  input CreatePasswordInput {
    utilisateur_id: Int!
    new_password: String!
    confirm_password: String!
  }

  """
  Input pour la conversion nom -> ID
  """
  input ConversionInput {
    genres: String
    grades: String
    status: String
    abonnement: String
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """
    Récupère un compte par son ID
    Nécessite : Authentification + (même utilisateur ou admin)
    """
    compteParId(utilisateurId: Int!): CompteInfo

    """
    Récupère un ou plusieurs comptes par nom et prénom
    Nécessite : Admin
    """
    compteParNomPrenom(prenom: String!, nom: String!): [CompteInfo!]!

    """
    Récupère les informations complètes d'un compte
    Nécessite : Admin
    """
    informationsCompte(prenom: String!, nom: String!): CompteInfo

    """
    Obtient l'ID d'un genre par son nom
    Nécessite : Admin
    """
    genreId(genreName: String!): Int!

    """
    Obtient l'ID d'un grade par son nom
    Nécessite : Admin
    """
    gradeId(gradeName: String!): Int!

    """
    Obtient l'ID d'un status par son nom
    Nécessite : Admin
    """
    statusId(statusName: String!): Int!

    """
    Obtient l'ID d'un abonnement par son nom
    Nécessite : Admin
    """
    abonnementId(abonnementName: String!): Int!

    """
    Convertit automatiquement les noms en IDs
    Nécessite : Admin
    """
    convertirNomsEnIds(input: ConversionInput!): ConversionResult!

    """
    Liste tous les genres disponibles
    Nécessite : Authentification
    """
    genres: [CompteGenre!]!

    """
    Liste tous les grades disponibles
    Nécessite : Authentification
    """
    grades: [CompteGrade!]!

    """
    Liste tous les status disponibles
    Nécessite : Admin
    """
    statuses: [CompteStatus!]!

    """
    Liste tous les plans tarifaires disponibles
    Nécessite : Authentification
    """
    plansTarifaires: [ComptePlanTarifaire!]!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """
    Met à jour un compte utilisateur
    Nécessite : Authentification + (même utilisateur ou admin)
    """
    modifierCompte(
      utilisateurId: Int!
      input: UpdateCompteInput!
    ): CompteOperationResult!

    """
    Change le mot de passe d'un utilisateur
    Nécessite : Authentification + même utilisateur
    """
    changerMotDePasse(input: ChangePasswordInput!): CompteOperationResult!

    """
    Crée un mot de passe (premier login)
    Nécessite : Authentification + même utilisateur
    """
    creerMotDePasse(input: CreatePasswordInput!): CompteOperationResult!

    """
    Supprime un compte (soft delete)
    Nécessite : Admin
    """
    supprimerCompte(utilisateurId: Int!): CompteOperationResult!
  }
`;
