/**
 * TypeDefs GraphQL pour le module Magasin
 * Gestion du e-commerce : articles, commandes, catégories, stocks
 */

export const magasinTypeDefs = `#graphql
  # ============================================
  # TYPES - ARTICLES
  # ============================================

  """
  Stock d'un article pour une taille donnée
  """
  type Stock {
    taille: String!
    quantite: Int!
  }

  """
  Article du magasin
  """
  type Article {
    id: Int!
    nom: String!
    description: String
    prix: Float!
    images: [String!]!
    stocks: [Stock!]!
    categorie_id: Int!
    actif: Boolean
  }

  """
  Article avec détails de catégorie
  """
  type ArticleAvecCategorie {
    id: Int!
    nom: String!
    description: String
    prix: Float!
    images: [String!]!
    stocks: [Stock!]!
    categorie: Categorie!
    actif: Boolean
  }

  """
  Articles groupés par catégorie
  """
  type ArticlesParCategorie {
    categorie: String!
    articles: [Article!]!
  }

  # ============================================
  # TYPES - CATÉGORIES
  # ============================================

  """
  Catégorie d'articles
  """
  type Categorie {
    id: Int!
    nom: String!
  }

  """
  Catégorie avec compteur d'articles
  """
  type CategorieAvecCompteur {
    id: Int!
    nom: String!
    nb_articles: Int!
  }

  # ============================================
  # TYPES - COMMANDES
  # ============================================

  """
  Article dans une commande
  """
  type ArticleCommande {
    article_id: Int!
    article_nom: String
    taille: String!
    quantite: Int!
    prix: Float!
  }

  """
  Commande
  """
  type Commande {
    id: Int!
    unique_id: String
    numero_commande: String
    utilisateur_id: Int!
    statut: StatutCommande!
    date: String!
    total: Float!
    articles: [ArticleCommande!]!
  }

  """
  Commande avec détails utilisateur
  """
  type CommandeAvecDetails {
    id: Int!
    unique_id: String
    numero_commande: String
    utilisateur_id: Int!
    utilisateur_nom: String
    utilisateur_email: String
    statut: StatutCommande!
    date: String!
    total: Float!
    articles: [ArticleCommande!]!
  }

  """
  Statut d'une commande
  """
  enum StatutCommande {
    EN_ATTENTE
    VALIDEE
    PREPAREE
    LIVREE
    ANNULEE
  }

  # ============================================
  # TYPES - TAILLES
  # ============================================

  """
  Taille disponible
  """
  type Taille {
    id: Int!
    nom: String!
    code: String!
  }

  # ============================================
  # TYPES - STATISTIQUES
  # ============================================

  """
  Statistiques du magasin
  """
  type StatistiquesMagasin {
    total_commandes: Int!
    commandes_en_attente: Int!
    commandes_validees: Int!
    commandes_livrees: Int!
    commandes_annulees: Int!
    chiffre_affaires_total: Float!
    articles_en_rupture: Int
    categories_actives: Int
  }

  """
  Vérification de disponibilité
  """
  type DisponibiliteResult {
    disponible: Boolean!
    message: String
    stock_restant: Int
  }

  # ============================================
  # TYPES - RÉSULTATS
  # ============================================

  """
  Résultat d'une opération sur un article
  """
  type ArticleResult {
    success: Boolean!
    message: String!
    article: Article
  }

  """
  Résultat d'une opération sur une commande
  """
  type CommandeResult {
    success: Boolean!
    message: String!
    commande: Commande
  }

  """
  Résultat d'une opération sur une catégorie
  """
  type CategorieResult {
    success: Boolean!
    message: String!
    categorie: Categorie
  }

  # ============================================
  # INPUTS
  # ============================================

  """
  Input pour créer un stock
  """
  input StockInput {
    taille: String!
    quantite: Int!
  }

  """
  Input pour créer un article
  """
  input CreateArticleInput {
    nom: String!
    description: String
    prix: Float!
    images: [String!]
    categorie_id: Int!
    stocks: [StockInput!]
    actif: Boolean
  }

  """
  Input pour mettre à jour un article
  """
  input UpdateArticleInput {
    id: Int!
    nom: String
    description: String
    prix: Float
    images: [String!]
    categorie_id: Int
    stocks: [StockInput!]
    actif: Boolean
  }

  """
  Input pour un article dans une commande
  """
  input ArticleCommandeInput {
    article_id: Int!
    taille: String!
    quantite: Int!
    prix: Float!
  }

  """
  Input pour créer une commande
  """
  input CreateCommandeInput {
    utilisateur_id: Int!
    articles: [ArticleCommandeInput!]!
    total: Float!
    statut: StatutCommande
  }

  """
  Input pour mettre à jour le statut d'une commande
  """
  input UpdateStatutCommandeInput {
    commandeId: Int!
    statut: StatutCommande!
  }

  """
  Input pour créer une catégorie
  """
  input CreateCategorieInput {
    nom: String!
  }

  """
  Input pour mettre à jour une catégorie
  """
  input UpdateCategorieInput {
    id: Int!
    nom: String!
  }

  """
  Input pour vérifier la disponibilité
  """
  input VerifierDisponibiliteInput {
    article_id: Int!
    taille: String!
    quantite: Int!
  }

  """
  Input pour les filtres des statistiques
  """
  input StatistiquesMagasinInput {
    dateDebut: String
    dateFin: String
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """
    Récupère tous les articles
    Requiert : Authentification
    """
    obtenirTousLesArticles: [Article!]!

    """
    Récupère un article par son ID
    Requiert : Authentification
    """
    obtenirArticleParId(id: Int!): Article

    """
    Récupère les articles groupés par catégories
    Requiert : Authentification
    """
    obtenirArticlesParCategories: [ArticlesParCategorie!]!

    """
    Récupère les articles d'une catégorie spécifique
    Requiert : Authentification
    """
    obtenirArticlesParCategorie(categorieId: Int!): [Article!]!

    """
    Récupère les articles en rupture de stock
    Requiert : Admin
    """
    obtenirArticlesRuptureStock: [Article!]!

    """
    Récupère toutes les catégories
    Requiert : Authentification
    """
    obtenirToutesLesCategories: [Categorie!]!

    """
    Récupère les catégories avec compteurs d'articles
    Requiert : Authentification
    """
    obtenirCategoriesAvecCompteurs: [CategorieAvecCompteur!]!

    """
    Récupère toutes les commandes
    Requiert : Admin
    """
    obtenirToutesLesCommandes: [CommandeAvecDetails!]!

    """
    Récupère les commandes d'un utilisateur
    Requiert : Authentification + propriétaire ou admin
    """
    obtenirCommandesUtilisateur(utilisateurId: Int!): [Commande!]!

    """
    Récupère une commande par son ID unique
    Requiert : Authentification + propriétaire ou admin
    """
    obtenirCommandeParUniqueId(uniqueId: String!): CommandeAvecDetails

    """
    Récupère une commande par son numéro
    Requiert : Authentification + propriétaire ou admin
    """
    obtenirCommandeParNumero(numeroCommande: String!): CommandeAvecDetails

    """
    Récupère les stocks d'un article
    Requiert : Authentification
    """
    obtenirStocksArticle(articleId: Int!): [Stock!]!

    """
    Vérifie la disponibilité d'un article
    Requiert : Authentification
    """
    verifierDisponibilite(input: VerifierDisponibiliteInput!): DisponibiliteResult!

    """
    Récupère toutes les tailles disponibles
    Requiert : Authentification
    """
    obtenirToutesLesTailles: [Taille!]!

    """
    Récupère les statistiques du magasin
    Requiert : Admin
    """
    obtenirStatistiquesMagasin(input: StatistiquesMagasinInput): StatistiquesMagasin!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """
    Crée un nouvel article
    Requiert : Admin
    """
    creerArticle(input: CreateArticleInput!): ArticleResult!

    """
    Met à jour un article
    Requiert : Admin
    """
    modifierArticle(input: UpdateArticleInput!): ArticleResult!

    """
    Supprime un article
    Requiert : Admin
    """
    supprimerArticle(id: Int!): ArticleResult!

    """
    Crée une nouvelle commande
    Requiert : Authentification
    """
    creerCommande(input: CreateCommandeInput!): CommandeResult!

    """
    Met à jour le statut d'une commande
    Requiert : Admin
    """
    modifierStatutCommande(input: UpdateStatutCommandeInput!): CommandeResult!

    """
    Annule une commande
    Requiert : Authentification + propriétaire ou admin
    """
    annulerCommande(commandeId: Int!): CommandeResult!

    """
    Crée une nouvelle catégorie
    Requiert : Admin
    """
    creerCategorie(input: CreateCategorieInput!): CategorieResult!

    """
    Met à jour une catégorie
    Requiert : Admin
    """
    modifierCategorie(input: UpdateCategorieInput!): CategorieResult!

    """
    Supprime une catégorie
    Requiert : Admin
    """
    supprimerCategorie(id: Int!): CategorieResult!

    """
    Met à jour le stock d'un article
    Requiert : Admin
    """
    mettreAJourStock(articleId: Int!, taille: String!, quantite: Int!): ArticleResult!
  }
`;
