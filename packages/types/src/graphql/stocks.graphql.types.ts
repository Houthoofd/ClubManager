/**
 * Types GraphQL pour le module Stocks
 * Définit les types, queries et mutations pour la gestion des stocks
 */

/**
 * TypeDefs GraphQL pour le module Stocks
 */
export const stocksTypeDefs = `
  # Type représentant un stock
  type Stock {
    id: Int
    article_id: Int!
    quantite: Int!
    article_nom: String
    article_prix: Float
    article_description: String
  }

  # Type pour les alertes de stock
  type AlerteStock {
    id: Int
    article_id: Int!
    quantite: Int!
    article_nom: String
    article_prix: Float
    seuil: Int!
  }

  # Type pour les résultats de mise à jour
  type StockUpdateResult {
    success: Boolean!
    message: String!
    data: Stock
  }

  # Type pour les statistiques de stock
  type StatistiquesStock {
    totalArticles: Int!
    stockTotal: Int!
    alertesCount: Int!
    valeurTotale: Float!
  }

  # Type pour le health check du service stocks
  type StocksHealthCheck {
    status: String!
    checks: StocksHealthChecks!
    message: String!
  }

  type StocksHealthChecks {
    stocks: Boolean!
    alertes: Boolean!
  }

  # Réponse pour les stocks
  type StocksResponse {
    success: Boolean!
    message: String!
    data: [Stock!]!
  }

  # Réponse pour un stock unique
  type StockResponse {
    success: Boolean!
    message: String!
    data: Stock
  }

  # Réponse pour les alertes de stock
  type AlertesStockResponse {
    success: Boolean!
    message: String!
    data: [Stock!]!
    count: Int!
  }

  # Réponse pour les statistiques
  type StatistiquesStockResponse {
    success: Boolean!
    message: String!
    data: StatistiquesStock!
  }

  # Réponse pour le health check
  type StocksHealthResponse {
    success: Boolean!
    data: StocksHealthCheck!
  }

  # Input pour la mise à jour d'un stock
  input StockUpdateInput {
    article_id: Int!
    quantite: Int!
    operation: StockOperation!
  }

  # Enum pour les opérations de stock
  enum StockOperation {
    set
    add
    subtract
  }

  extend type Query {
    # Récupérer tous les stocks
    stocks: StocksResponse!

    # Récupérer le stock d'un article spécifique
    stockParArticle(articleId: Int!): StocksResponse!

    # Récupérer les alertes de stock (stocks bas)
    alertesStock(seuil: Int): AlertesStockResponse!

    # Récupérer les statistiques de stock
    statistiquesStock: StatistiquesStockResponse!

    # Health check du service stocks
    stocksHealth: StocksHealthResponse!
  }

  extend type Mutation {
    # Mettre à jour un stock
    mettreAJourStock(input: StockUpdateInput!): StockUpdateResult!
  }
`;

/**
 * Interfaces TypeScript pour les types GraphQL
 */

export interface StockType {
  id?: number;
  article_id: number;
  quantite: number;
  article_nom?: string;
  article_prix?: number;
  article_description?: string;
}

export interface AlerteStockType {
  id?: number;
  article_id: number;
  quantite: number;
  article_nom?: string;
  article_prix?: number;
  seuil: number;
}

export interface StockUpdateResult {
  success: boolean;
  message: string;
  data?: StockType;
}

export interface StatistiquesStock {
  totalArticles: number;
  stockTotal: number;
  alertesCount: number;
  valeurTotale: number;
}

export interface StocksHealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    stocks: boolean;
    alertes: boolean;
  };
  message: string;
}

export interface StocksResponse {
  success: boolean;
  message: string;
  data: StockType[];
}

export interface StockResponse {
  success: boolean;
  message: string;
  data?: StockType;
}

export interface AlertesStockResponse {
  success: boolean;
  message: string;
  data: StockType[];
  count: number;
}

export interface StatistiquesStockResponse {
  success: boolean;
  message: string;
  data: StatistiquesStock;
}

export interface StocksHealthResponse {
  success: boolean;
  data: StocksHealthCheck;
}

export interface StockUpdateInput {
  article_id: number;
  quantite: number;
  operation: "set" | "add" | "subtract";
}

export type StockOperation = "set" | "add" | "subtract";
