/**
 * Schémas GraphQL pour Sessions
 * Définition des types, queries et mutations pour la gestion des sessions utilisateur
 */

import { gql } from "graphql-tag";

export const sessionsTypeDefs = gql`
  # ============================================
  # SCALARS
  # ============================================

  scalar DateTime
  scalar JSON

  # ============================================
  # TYPES - SESSION
  # ============================================

  """
  Représente une session utilisateur active
  """
  type Session {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID de l'utilisateur
    """
    userId: Int!

    """
    Token de session (hashé)
    """
    token: String!

    """
    Empreinte de l'appareil
    """
    deviceFingerprint: String

    """
    User-Agent du navigateur
    """
    userAgent: String

    """
    Adresse IP
    """
    ipAddress: String!

    """
    Géolocalisation (ville, pays)
    """
    geoLocation: String

    """
    La session est-elle active ?
    """
    isActive: Boolean!

    """
    Date de dernière activité
    """
    lastActivityAt: DateTime!

    """
    Date d'expiration
    """
    expiresAt: DateTime!

    """
    Date de création
    """
    createdAt: DateTime!

    """
    Date de dernière modification
    """
    updatedAt: DateTime!

    """
    Utilisateur associé (si disponible)
    """
    user: User
  }

  """
  Session avec informations utilisateur enrichies
  """
  type SessionWithUser {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID de l'utilisateur
    """
    userId: Int!

    """
    Token de session (hashé)
    """
    token: String!

    """
    Empreinte de l'appareil
    """
    deviceFingerprint: String

    """
    User-Agent du navigateur
    """
    userAgent: String

    """
    Adresse IP
    """
    ipAddress: String!

    """
    Géolocalisation (ville, pays)
    """
    geoLocation: String

    """
    La session est-elle active ?
    """
    isActive: Boolean!

    """
    Date de dernière activité
    """
    lastActivityAt: DateTime!

    """
    Date d'expiration
    """
    expiresAt: DateTime!

    """
    Date de création
    """
    createdAt: DateTime!

    """
    Date de dernière modification
    """
    updatedAt: DateTime!

    """
    Utilisateur associé
    """
    user: User!

    """
    Nom complet de l'utilisateur
    """
    userName: String!

    """
    Email de l'utilisateur
    """
    userEmail: String!
  }

  """
  Informations sur l'appareil utilisé
  """
  type DeviceInfo {
    """
    Type d'appareil (desktop, mobile, tablet)
    """
    deviceType: String

    """
    Système d'exploitation
    """
    os: String

    """
    Navigateur
    """
    browser: String

    """
    Est-ce un appareil mobile ?
    """
    isMobile: Boolean!

    """
    Est-ce un appareil de bureau ?
    """
    isDesktop: Boolean!

    """
    Est-ce une tablette ?
    """
    isTablet: Boolean!
  }

  """
  Statistiques des sessions
  """
  type SessionStatistics {
    """
    Nombre total de sessions actives
    """
    totalActiveSessions: Int!

    """
    Nombre de sessions par utilisateur
    """
    sessionsPerUser: Int!

    """
    Nombre de sessions expirées aujourd'hui
    """
    expiredToday: Int!

    """
    Nombre de nouvelles sessions aujourd'hui
    """
    newToday: Int!

    """
    Temps de session moyen (en minutes)
    """
    averageSessionDuration: Float!

    """
    Appareil le plus utilisé
    """
    mostUsedDevice: String

    """
    Navigateur le plus utilisé
    """
    mostUsedBrowser: String
  }

  """
  Session résumée (sans token)
  """
  type SessionSummary {
    """
    Identifiant unique
    """
    id: Int!

    """
    Empreinte de l'appareil
    """
    deviceFingerprint: String

    """
    User-Agent du navigateur
    """
    userAgent: String

    """
    Adresse IP
    """
    ipAddress: String!

    """
    Géolocalisation
    """
    geoLocation: String

    """
    Est-ce la session actuelle ?
    """
    isCurrent: Boolean!

    """
    La session est-elle active ?
    """
    isActive: Boolean!

    """
    Date de dernière activité
    """
    lastActivityAt: DateTime!

    """
    Date d'expiration
    """
    expiresAt: DateTime!

    """
    Date de création
    """
    createdAt: DateTime!

    """
    Informations sur l'appareil
    """
    deviceInfo: DeviceInfo
  }

  # ============================================
  # INPUTS - SESSION
  # ============================================

  """
  Données pour créer une nouvelle session
  """
  input CreateSessionInput {
    userId: Int!
    token: String!
    deviceFingerprint: String
    userAgent: String
    ipAddress: String!
    geoLocation: String
    expiresAt: DateTime
  }

  """
  Données pour mettre à jour une session
  """
  input UpdateSessionInput {
    deviceFingerprint: String
    userAgent: String
    ipAddress: String
    geoLocation: String
    isActive: Boolean
    lastActivityAt: DateTime
    expiresAt: DateTime
  }

  """
  Filtre de recherche pour les sessions
  """
  input SessionFilter {
    userId: Int
    isActive: Boolean
    ipAddress: String
    deviceFingerprint: String
    createdAfter: DateTime
    createdBefore: DateTime
    expiresAfter: DateTime
    expiresBefore: DateTime
    search: String
    limit: Int
    offset: Int
  }

  """
  Données pour mettre à jour l'activité d'une session
  """
  input UpdateSessionActivityInput {
    token: String!
    ipAddress: String
    lastActivityAt: DateTime
  }

  # ============================================
  # RESPONSE TYPES
  # ============================================

  """
  Liste paginée de sessions
  """
  type SessionList {
    items: [Session!]!
    total: Int!
    hasMore: Boolean!
  }

  """
  Liste paginée de sessions avec utilisateur
  """
  type SessionWithUserList {
    items: [SessionWithUser!]!
    total: Int!
    hasMore: Boolean!
  }

  """
  Liste de sessions résumées
  """
  type SessionSummaryList {
    items: [SessionSummary!]!
    total: Int!
  }

  """
  Résultat d'une opération sur une session
  """
  type SessionResult {
    success: Boolean!
    session: Session
    error: String
  }

  """
  Résultat de nettoyage des sessions
  """
  type SessionCleanupResult {
    success: Boolean!
    deletedCount: Int!
    error: String
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """
    Récupérer une session par son ID
    """
    getSession(id: Int!): Session

    """
    Récupérer une session par son token
    """
    getSessionByToken(token: String!): Session

    """
    Récupérer toutes les sessions avec filtres
    """
    getSessionList(filter: SessionFilter): SessionList!

    """
    Récupérer toutes les sessions avec utilisateurs
    """
    getSessionWithUserList(filter: SessionFilter): SessionWithUserList!

    """
    Récupérer les sessions actives d'un utilisateur
    """
    getUserActiveSessions(userId: Int!): [SessionSummary!]!

    """
    Récupérer toutes les sessions d'un utilisateur
    """
    getUserSessions(userId: Int!): SessionSummaryList!

    """
    Récupérer les sessions expirées
    """
    getExpiredSessions: [Session!]!

    """
    Vérifier si une session est valide
    """
    isSessionValid(token: String!): Boolean!

    """
    Récupérer les statistiques des sessions
    """
    getSessionStatistics: SessionStatistics!

    """
    Récupérer les sessions par adresse IP
    """
    getSessionsByIp(ipAddress: String!): [Session!]!

    """
    Récupérer les sessions par empreinte d'appareil
    """
    getSessionsByDevice(deviceFingerprint: String!): [Session!]!

    """
    Compter les sessions actives
    """
    countActiveSessions: Int!

    """
    Compter les sessions d'un utilisateur
    """
    countUserSessions(userId: Int!): Int!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """
    Créer une nouvelle session
    """
    createSession(input: CreateSessionInput!): SessionResult!

    """
    Mettre à jour une session
    """
    updateSession(id: Int!, input: UpdateSessionInput!): SessionResult!

    """
    Mettre à jour l'activité d'une session
    """
    updateSessionActivity(input: UpdateSessionActivityInput!): SessionResult!

    """
    Révoquer une session (la rendre inactive)
    """
    revokeSession(id: Int!): SessionResult!

    """
    Révoquer une session par son token
    """
    revokeSessionByToken(token: String!): SessionResult!

    """
    Révoquer toutes les sessions d'un utilisateur sauf la session actuelle
    """
    revokeOtherUserSessions(userId: Int!, currentToken: String!): SessionResult!

    """
    Révoquer toutes les sessions d'un utilisateur
    """
    revokeAllUserSessions(userId: Int!): SessionResult!

    """
    Prolonger une session
    """
    extendSession(token: String!, expiresAt: DateTime!): SessionResult!

    """
    Supprimer une session
    """
    deleteSession(id: Int!): SessionResult!

    """
    Nettoyer les sessions expirées
    """
    cleanupExpiredSessions: SessionCleanupResult!

    """
    Nettoyer les vieilles sessions inactives
    """
    cleanupInactiveSessions(olderThanDays: Int!): SessionCleanupResult!
  }
`;
