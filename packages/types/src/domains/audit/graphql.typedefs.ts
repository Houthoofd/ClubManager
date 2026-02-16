/**
 * Schémas GraphQL pour Audit
 * Définition des types, queries et mutations pour les logs d'audit et de sécurité
 */

import { gql } from "graphql-tag";

export const auditTypeDefs = gql`
  # ============================================
  # SCALARS
  # ============================================

  scalar DateTime
  scalar JSON

  # ============================================
  # ENUMS
  # ============================================

  """
  Type d'événement d'audit
  """
  enum AuditEventType {
    # Authentification
    LOGIN_SUCCESS
    LOGIN_FAILED
    LOGOUT
    PASSWORD_RESET_REQUESTED
    PASSWORD_RESET_COMPLETED
    PASSWORD_CHANGED
    EMAIL_VERIFICATION_SENT
    EMAIL_VERIFIED
    TWO_FACTOR_ENABLED
    TWO_FACTOR_DISABLED
    TWO_FACTOR_CODE_SENT
    TWO_FACTOR_VERIFIED

    # Utilisateurs
    USER_CREATED
    USER_UPDATED
    USER_DELETED
    USER_ACTIVATED
    USER_DEACTIVATED
    USER_ROLE_CHANGED
    USER_PERMISSIONS_CHANGED
    USER_PROFILE_UPDATED

    # Sessions
    SESSION_CREATED
    SESSION_EXPIRED
    SESSION_REVOKED
    SESSION_EXTENDED

    # Paiements
    PAYMENT_CREATED
    PAYMENT_COMPLETED
    PAYMENT_FAILED
    PAYMENT_REFUNDED
    PAYMENT_CANCELLED

    # Cours
    COURSE_CREATED
    COURSE_UPDATED
    COURSE_DELETED
    COURSE_PUBLISHED
    COURSE_UNPUBLISHED

    # Commandes
    ORDER_CREATED
    ORDER_UPDATED
    ORDER_CANCELLED
    ORDER_COMPLETED

    # Articles
    ARTICLE_CREATED
    ARTICLE_UPDATED
    ARTICLE_DELETED
    ARTICLE_STOCK_CHANGED

    # GDPR
    CONSENT_GIVEN
    CONSENT_WITHDRAWN
    DATA_EXPORT_REQUESTED
    DATA_EXPORT_COMPLETED
    ACCOUNT_DELETION_REQUESTED
    ACCOUNT_DELETION_COMPLETED

    # Sécurité
    SUSPICIOUS_ACTIVITY_DETECTED
    ACCOUNT_LOCKED
    ACCOUNT_UNLOCKED
    IP_BLOCKED
    IP_UNBLOCKED
    BRUTE_FORCE_ATTEMPT
    UNAUTHORIZED_ACCESS_ATTEMPT

    # Système
    SYSTEM_CONFIG_CHANGED
    DATABASE_BACKUP_CREATED
    DATABASE_RESTORE_COMPLETED
    MAINTENANCE_MODE_ENABLED
    MAINTENANCE_MODE_DISABLED

    # API
    API_KEY_CREATED
    API_KEY_REVOKED
    API_RATE_LIMIT_EXCEEDED
    WEBHOOK_SENT
    WEBHOOK_FAILED

    # Autres
    OTHER
  }

  """
  Niveau de sévérité d'un événement
  """
  enum AuditSeverity {
    INFO
    WARNING
    ERROR
    CRITICAL
  }

  """
  Statut d'un événement d'audit
  """
  enum AuditStatus {
    SUCCESS
    FAILED
    PENDING
    CANCELLED
  }

  # ============================================
  # TYPES - AUDIT LOG
  # ============================================

  """
  Représente un log d'audit
  """
  type AuditLog {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID de l'utilisateur qui a effectué l'action
    """
    userId: Int

    """
    Type d'événement
    """
    eventType: AuditEventType!

    """
    Niveau de sévérité
    """
    severity: AuditSeverity!

    """
    Statut de l'événement
    """
    status: AuditStatus!

    """
    Description de l'événement
    """
    description: String!

    """
    Métadonnées additionnelles (JSON)
    """
    metadata: JSON

    """
    Adresse IP de l'utilisateur
    """
    ipAddress: String

    """
    User-Agent du navigateur
    """
    userAgent: String

    """
    ID de la ressource affectée
    """
    resourceId: String

    """
    Type de ressource affectée
    """
    resourceType: String

    """
    Anciennes valeurs (avant modification)
    """
    oldValues: JSON

    """
    Nouvelles valeurs (après modification)
    """
    newValues: JSON

    """
    Date de création
    """
    createdAt: DateTime!

    """
    Utilisateur associé (si disponible)
    """
    user: User
  }

  """
  Log d'audit avec informations utilisateur enrichies
  """
  type AuditLogWithUser {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID de l'utilisateur qui a effectué l'action
    """
    userId: Int

    """
    Type d'événement
    """
    eventType: AuditEventType!

    """
    Niveau de sévérité
    """
    severity: AuditSeverity!

    """
    Statut de l'événement
    """
    status: AuditStatus!

    """
    Description de l'événement
    """
    description: String!

    """
    Métadonnées additionnelles (JSON)
    """
    metadata: JSON

    """
    Adresse IP de l'utilisateur
    """
    ipAddress: String

    """
    User-Agent du navigateur
    """
    userAgent: String

    """
    ID de la ressource affectée
    """
    resourceId: String

    """
    Type de ressource affectée
    """
    resourceType: String

    """
    Anciennes valeurs (avant modification)
    """
    oldValues: JSON

    """
    Nouvelles valeurs (après modification)
    """
    newValues: JSON

    """
    Date de création
    """
    createdAt: DateTime!

    """
    Utilisateur associé
    """
    user: User

    """
    Nom complet de l'utilisateur
    """
    userName: String

    """
    Email de l'utilisateur
    """
    userEmail: String
  }

  """
  Statistiques des logs d'audit
  """
  type AuditStatistics {
    """
    Nombre total de logs
    """
    totalLogs: Int!

    """
    Nombre de logs par sévérité
    """
    logsBySeverity: AuditSeverityCount!

    """
    Nombre de logs par statut
    """
    logsByStatus: AuditStatusCount!

    """
    Nombre de logs par type d'événement (top 10)
    """
    topEventTypes: [EventTypeCount!]!

    """
    Nombre de tentatives de connexion échouées aujourd'hui
    """
    failedLoginsToday: Int!

    """
    Nombre d'événements critiques aujourd'hui
    """
    criticalEventsToday: Int!

    """
    Nombre d'événements suspects aujourd'hui
    """
    suspiciousEventsToday: Int!

    """
    Utilisateurs les plus actifs (top 10)
    """
    mostActiveUsers: [UserActivityCount!]!

    """
    Adresses IP les plus actives (top 10)
    """
    mostActiveIps: [IpActivityCount!]!
  }

  """
  Comptage par sévérité
  """
  type AuditSeverityCount {
    info: Int!
    warning: Int!
    error: Int!
    critical: Int!
  }

  """
  Comptage par statut
  """
  type AuditStatusCount {
    success: Int!
    failed: Int!
    pending: Int!
    cancelled: Int!
  }

  """
  Comptage par type d'événement
  """
  type EventTypeCount {
    eventType: AuditEventType!
    count: Int!
  }

  """
  Comptage d'activité par utilisateur
  """
  type UserActivityCount {
    userId: Int!
    userName: String
    count: Int!
  }

  """
  Comptage d'activité par IP
  """
  type IpActivityCount {
    ipAddress: String!
    count: Int!
  }

  """
  Rapport de sécurité
  """
  type SecurityReport {
    """
    Période du rapport (ex: "2024-01-15 to 2024-01-22")
    """
    period: String!

    """
    Date de génération
    """
    generatedAt: DateTime!

    """
    Nombre de tentatives de connexion échouées
    """
    failedLogins: Int!

    """
    Nombre d'accès non autorisés
    """
    unauthorizedAccess: Int!

    """
    Nombre d'activités suspectes
    """
    suspiciousActivities: Int!

    """
    Nombre de comptes verrouillés
    """
    lockedAccounts: Int!

    """
    Nombre d'IPs bloquées
    """
    blockedIps: Int!

    """
    Événements critiques
    """
    criticalEvents: [AuditLog!]!

    """
    IPs suspectes
    """
    suspiciousIps: [String!]!

    """
    Recommandations de sécurité
    """
    recommendations: [String!]!
  }

  # ============================================
  # INPUTS - AUDIT LOG
  # ============================================

  """
  Données pour créer un log d'audit
  """
  input CreateAuditLogInput {
    userId: Int
    eventType: AuditEventType!
    severity: AuditSeverity
    status: AuditStatus
    description: String!
    metadata: JSON
    ipAddress: String
    userAgent: String
    resourceId: String
    resourceType: String
    oldValues: JSON
    newValues: JSON
  }

  """
  Filtre de recherche pour les logs d'audit
  """
  input AuditLogFilter {
    userId: Int
    eventType: AuditEventType
    severity: AuditSeverity
    status: AuditStatus
    ipAddress: String
    resourceType: String
    resourceId: String
    createdAfter: DateTime
    createdBefore: DateTime
    search: String
    limit: Int
    offset: Int
  }

  """
  Options pour le rapport de sécurité
  """
  input SecurityReportOptions {
    startDate: DateTime!
    endDate: DateTime!
    includeCriticalOnly: Boolean
    includeRecommendations: Boolean
  }

  """
  Options pour le nettoyage des logs
  """
  input CleanupAuditLogsOptions {
    olderThanDays: Int!
    keepCritical: Boolean
    severityToKeep: [AuditSeverity!]
    eventTypesToKeep: [AuditEventType!]
  }

  # ============================================
  # RESPONSE TYPES
  # ============================================

  """
  Liste paginée de logs d'audit
  """
  type AuditLogList {
    items: [AuditLog!]!
    total: Int!
    hasMore: Boolean!
  }

  """
  Liste paginée de logs d'audit avec utilisateur
  """
  type AuditLogWithUserList {
    items: [AuditLogWithUser!]!
    total: Int!
    hasMore: Boolean!
  }

  """
  Résultat d'une opération sur un log d'audit
  """
  type AuditLogResult {
    success: Boolean!
    auditLog: AuditLog
    error: String
  }

  """
  Résultat de nettoyage des logs
  """
  type CleanupAuditLogsResult {
    success: Boolean!
    deletedCount: Int!
    keptCount: Int!
    error: String
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """
    Récupérer un log d'audit par son ID
    """
    getAuditLog(id: Int!): AuditLog

    """
    Récupérer tous les logs d'audit avec filtres
    """
    getAuditLogList(filter: AuditLogFilter): AuditLogList!

    """
    Récupérer tous les logs d'audit avec utilisateurs
    """
    getAuditLogWithUserList(filter: AuditLogFilter): AuditLogWithUserList!

    """
    Récupérer les logs d'audit d'un utilisateur
    """
    getUserAuditLogs(userId: Int!, limit: Int, offset: Int): AuditLogList!

    """
    Récupérer les logs d'audit par type d'événement
    """
    getAuditLogsByEventType(
      eventType: AuditEventType!
      limit: Int
      offset: Int
    ): AuditLogList!

    """
    Récupérer les logs d'audit par sévérité
    """
    getAuditLogsBySeverity(
      severity: AuditSeverity!
      limit: Int
      offset: Int
    ): AuditLogList!

    """
    Récupérer les logs d'audit critiques
    """
    getCriticalAuditLogs(limit: Int, offset: Int): AuditLogList!

    """
    Récupérer les logs d'audit récents
    """
    getRecentAuditLogs(limit: Int): [AuditLog!]!

    """
    Récupérer les logs d'audit par adresse IP
    """
    getAuditLogsByIp(ipAddress: String!, limit: Int, offset: Int): AuditLogList!

    """
    Récupérer les logs d'audit par ressource
    """
    getAuditLogsByResource(
      resourceType: String!
      resourceId: String!
    ): [AuditLog!]!

    """
    Récupérer les statistiques d'audit
    """
    getAuditStatistics(startDate: DateTime, endDate: DateTime): AuditStatistics!

    """
    Récupérer les tentatives de connexion échouées
    """
    getFailedLoginAttempts(
      userId: Int
      ipAddress: String
      limit: Int
    ): [AuditLog!]!

    """
    Récupérer les activités suspectes
    """
    getSuspiciousActivities(limit: Int): [AuditLog!]!

    """
    Générer un rapport de sécurité
    """
    generateSecurityReport(options: SecurityReportOptions!): SecurityReport!

    """
    Rechercher dans les logs d'audit
    """
    searchAuditLogs(search: String!, limit: Int, offset: Int): AuditLogList!

    """
    Compter les logs d'audit par filtre
    """
    countAuditLogs(filter: AuditLogFilter): Int!

    """
    Vérifier s'il y a des événements critiques récents
    """
    hasRecentCriticalEvents(withinMinutes: Int!): Boolean!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """
    Créer un nouveau log d'audit
    """
    createAuditLog(input: CreateAuditLogInput!): AuditLogResult!

    """
    Nettoyer les anciens logs d'audit
    """
    cleanupAuditLogs(options: CleanupAuditLogsOptions!): CleanupAuditLogsResult!

    """
    Archiver les anciens logs d'audit
    """
    archiveAuditLogs(olderThanDays: Int!): CleanupAuditLogsResult!

    """
    Marquer un événement comme résolu
    """
    markAuditLogAsResolved(id: Int!): AuditLogResult!

    """
    Exporter les logs d'audit
    """
    exportAuditLogs(filter: AuditLogFilter!, format: String!): AuditLogResult!
  }
`;
