/**
 * TypeDefs GraphQL pour le module Commandes
 * Définit le schéma GraphQL pour la gestion des commandes
 */

export const commandesTypeDefs = `#graphql
  # ============================================
  # ENUMS
  # ============================================

  """
  Statuts possibles pour une commande
  """
  enum StatutCommande {
    en_attente
    confirmee
    en_preparation
    expediee
    livree
    annulee
  }

  # ============================================
  # TYPES
  # ============================================

  """
  Article dans une commande
  """
  type CommandeArticle {
    article_id: Int!
    taille_id: Int!
    quantite: Int!
    prix: Float!
    nom: String
    taille: String
  }

  """
  Commande complète
  """
  type Commande {
    commande_id: String!
    utilisateur_id: Int!
    statut: StatutCommande!
    total: Float!
    articles: [CommandeArticle!]!
    date_commande: String!
    updated_at: String
    payment_intent_id: String
    nom_utilisateur: String
    email: String
  }

  """
  Statistiques des commandes
  """
  type CommandeStats {
    totalCommandes: Int!
    commandesEnAttente: Int!
    commandesConfirmees: Int!
    commandesEnPreparation: Int!
    commandesExpediees: Int!
    commandesLivrees: Int!
    commandesAnnulees: Int!
    revenuTotal: Float!
    revenuMoisEnCours: Float!
    panierMoyen: Float!
  }

  """
  Compteur par statut
  """
  type CommandeCountByStatut {
    statut: StatutCommande!
    count: Int!
  }

  """
  Résultat de recherche paginé
  """
  type CommandeSearchResult {
    items: [Commande!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  """
  Résultat d'une opération sur commande
  """
  type CommandeOperationResult {
    success: Boolean!
    message: String!
    commande: Commande
  }

  """
  Résultat d'une mise à jour en lot
  """
  type BatchUpdateResult {
    success: Boolean!
    message: String!
    updatedCount: Int!
    errors: [String!]
  }

  # ============================================
  # INPUTS
  # ============================================

  """
  Input pour un article de commande
  """
  input CommandeArticleInput {
    article_id: Int!
    taille_id: Int!
    quantite: Int!
    prix: Float!
  }

  """
  Input pour créer une commande
  """
  input CreateCommandeInput {
    utilisateur_id: Int!
    articles: [CommandeArticleInput!]!
    payment_intent_id: String
  }

  """
  Input pour mettre à jour une commande
  """
  input UpdateCommandeInput {
    statut: StatutCommande
    total: Float
    articles: [CommandeArticleInput!]
    payment_intent_id: String
  }

  """
  Input pour les filtres de recherche
  """
  input CommandeSearchFilters {
    utilisateurId: Int
    statut: StatutCommande
    dateDebut: String
    dateFin: String
    montantMin: Float
    montantMax: Float
    numeroCommande: String
    page: Int
    limit: Int
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """
    Récupère toutes les commandes
    Nécessite : Admin
    """
    commandes: [Commande!]!

    """
    Récupère une commande par son ID
    Nécessite : Authentification + (propriétaire ou admin)
    """
    commande(commandeId: String!): Commande

    """
    Récupère les commandes d'un utilisateur
    Nécessite : Authentification + (même utilisateur ou admin)
    """
    commandesUtilisateur(utilisateurId: Int!): [Commande!]!

    """
    Récupère les commandes par statut
    Nécessite : Admin
    """
    commandesParStatut(statut: StatutCommande!): [Commande!]!

    """
    Recherche des commandes avec filtres
    Nécessite : Admin
    """
    rechercherCommandes(filters: CommandeSearchFilters!): CommandeSearchResult!

    """
    Récupère les statistiques des commandes
    Nécessite : Admin
    """
    statistiquesCommandes: CommandeStats!

    """
    Compte les commandes par statut
    Nécessite : Admin
    """
    compterCommandesParStatut: [CommandeCountByStatut!]!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """
    Crée une nouvelle commande
    Nécessite : Authentification
    Rate limit : 10 requêtes / minute
    """
    creerCommande(input: CreateCommandeInput!): CommandeOperationResult!

    """
    Met à jour une commande
    Nécessite : Admin
    """
    modifierCommande(
      commandeId: String!
      input: UpdateCommandeInput!
    ): CommandeOperationResult!

    """
    Met à jour le statut d'une commande
    Nécessite : Admin
    """
    modifierStatutCommande(
      commandeId: String!
      statut: StatutCommande!
    ): CommandeOperationResult!

    """
    Supprime une commande
    Nécessite : Admin
    """
    supprimerCommande(commandeId: String!): CommandeOperationResult!

    """
    Met à jour le statut de plusieurs commandes
    Nécessite : Admin
    """
    batchUpdateStatutCommandes(
      commandeIds: [String!]!
      statut: StatutCommande!
    ): BatchUpdateResult!
  }
`;
