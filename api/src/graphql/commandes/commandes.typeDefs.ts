/**
 * Définitions de types GraphQL pour le module Commandes
 */

export const commandesTypeDefs = `#graphql
  """
  Article dans une commande
  """
  type ArticleCommande {
    article_id: String!
    nom: String!
    quantite: Int!
    prix_unitaire: Float!
    prix_total: Float!
    image: String
    taille: String
    couleur: String
  }

  """
  Input pour un article de commande
  """
  input ArticleCommandeInput {
    article_id: String!
    nom: String!
    quantite: Int!
    prix_unitaire: Float!
    prix_total: Float!
    image: String
    taille: String
    couleur: String
  }

  """
  Statut possible d'une commande
  """
  enum StatutCommande {
    EN_ATTENTE
    CONFIRMEE
    EN_PREPARATION
    EXPEDIE
    LIVREE
    ANNULEE
    REMBOURSEE
  }

  """
  Commande complète avec informations utilisateur
  """
  type Commande {
    commande_id: String!
    utilisateur_id: Int!
    statut: String!
    total: Float!
    articles: [ArticleCommande!]!
    date_commande: String!
    updated_at: String!
    payment_intent_id: String
    nom_utilisateur: String
    email: String
  }

  """
  Données pour créer une commande
  """
  input CreateCommandeInput {
    commande_id: String!
    utilisateur_id: Int!
    total: Float!
    articles: [ArticleCommandeInput!]!
    statut: String
    payment_intent_id: String
  }

  """
  Données pour mettre à jour une commande
  """
  input UpdateCommandeInput {
    statut: String
    total: Float
    articles: [ArticleCommandeInput!]
    payment_intent_id: String
  }

  """
  Filtres pour rechercher des commandes
  """
  input CommandeSearchFiltersInput {
    statut: String
    utilisateur_id: Int
    date_debut: String
    date_fin: String
    search: String
    montant_min: Float
    montant_max: Float
    limit: Int
    offset: Int
  }

  """
  Résultat de recherche avec pagination
  """
  type CommandeSearchResult {
    commandes: [Commande!]!
    total: Int!
    page: Int!
    totalPages: Int!
  }

  """
  Statistiques des commandes
  """
  type CommandeStatistiques {
    total_commandes: Int!
    commandes_en_attente: Int!
    commandes_confirmees: Int!
    commandes_en_preparation: Int!
    commandes_expedie: Int!
    commandes_livrees: Int!
    commandes_annulees: Int!
    commandes_remboursees: Int!
    chiffre_affaires_total: Float!
    chiffre_affaires_mois: Float!
    panier_moyen: Float!
  }

  """
  Statistiques par période
  """
  type CommandeStatsPeriode {
    periode: String!
    nombre_commandes: Int!
    chiffre_affaires: Float!
    panier_moyen: Float!
  }

  """
  Top produit vendu
  """
  type TopProduit {
    article_id: String!
    nom: String!
    quantite_vendue: Int!
    chiffre_affaires: Float!
    nombre_commandes: Int!
  }

  """
  Comptage des commandes par statut
  """
  type CommandeCountByStatut {
    statut: String!
    count: Int!
  }

  """
  Résultat de vérification de stock
  """
  type StockCheckResult {
    available: Boolean!
    insufficientItems: [InsufficientStockItem!]!
  }

  """
  Article avec stock insuffisant
  """
  type InsufficientStockItem {
    article_id: String!
    nom: String!
    requested: Int!
    available: Int!
  }

  """
  Période pour les statistiques
  """
  enum StatsPeriod {
    DAY
    WEEK
    MONTH
  }

  extend type Query {
    """
    Récupérer toutes les commandes
    """
    commandes: [Commande!]!

    """
    Récupérer une commande par son ID
    """
    commande(commandeId: String!): Commande

    """
    Récupérer les commandes d'un utilisateur
    """
    commandesByUserId(utilisateurId: Int!): [Commande!]!

    """
    Récupérer les commandes par statut
    """
    commandesByStatut(statut: String!): [Commande!]!

    """
    Récupérer une commande par payment intent ID
    """
    commandeByPaymentIntent(paymentIntentId: String!): Commande

    """
    Rechercher des commandes avec filtres et pagination
    """
    searchCommandes(filters: CommandeSearchFiltersInput!): CommandeSearchResult!

    """
    Obtenir les statistiques des commandes
    """
    commandesStatistiques: CommandeStatistiques!

    """
    Compter les commandes par statut
    """
    commandesCountByStatut: [CommandeCountByStatut!]!

    """
    Obtenir les statistiques par période
    """
    commandesStatsByPeriod(
      period: StatsPeriod!
      duration: Int = 30
    ): [CommandeStatsPeriode!]!

    """
    Obtenir les top produits vendus
    """
    topProduits(limit: Int = 10): [TopProduit!]!

    """
    Vérifier la disponibilité du stock
    """
    checkStockAvailability(articles: [ArticleCommandeInput!]!): StockCheckResult!
  }

  extend type Mutation {
    """
    Créer une nouvelle commande
    """
    createCommande(data: CreateCommandeInput!): Commande!

    """
    Mettre à jour une commande
    """
    updateCommande(
      commandeId: String!
      data: UpdateCommandeInput!
    ): Commande!

    """
    Mettre à jour le statut d'une commande
    """
    updateCommandeStatut(
      commandeId: String!
      nouveauStatut: String!
    ): Commande!

    """
    Annuler une commande
    """
    cancelCommande(commandeId: String!): Commande!

    """
    Supprimer une commande
    """
    deleteCommande(commandeId: String!): Boolean!

    """
    Réserver du stock pour une commande
    """
    reserveStock(
      commandeId: String!
      articles: [ArticleCommandeInput!]!
    ): Boolean!

    """
    Libérer le stock d'une commande
    """
    releaseStock(
      commandeId: String!
      articles: [ArticleCommandeInput!]!
    ): Boolean!
  }
`;
