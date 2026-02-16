/**
 * Schémas GraphQL pour GDPR
 * Définition des types, queries et mutations pour la conformité RGPD
 */

import { gql } from "graphql-tag";

export const gdprTypeDefs = gql`
  # ============================================
  # SCALARS
  # ============================================

  scalar DateTime
  scalar JSON

  # ============================================
  # ENUMS
  # ============================================

  """
  Type de consentement utilisateur
  """
  enum UserConsentType {
    TERMS_AND_CONDITIONS
    PRIVACY_POLICY
    MARKETING_EMAILS
    MARKETING_SMS
    MARKETING_PHONE
    DATA_PROCESSING
    COOKIES
    THIRD_PARTY_SHARING
    ANALYTICS
    PROFILING
    NEWSLETTER
    NOTIFICATIONS
    PHOTO_USAGE
    VIDEO_USAGE
    COMPETITION_DATA
    MEDICAL_DATA
    EMERGENCY_CONTACT
    CUSTOM
  }

  """
  Statut d'une demande d'export de données
  """
  enum DataExportStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    EXPIRED
    CANCELLED
  }

  """
  Statut d'une demande de suppression de compte
  """
  enum AccountDeletionStatus {
    PENDING
    APPROVED
    REJECTED
    PROCESSING
    COMPLETED
    FAILED
    CANCELLED
  }

  # ============================================
  # TYPES - USER CONSENT
  # ============================================

  """
  Représente un consentement utilisateur
  """
  type UserConsent {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID de l'utilisateur
    """
    userId: Int!

    """
    Type de consentement
    """
    consentType: UserConsentType!

    """
    L'utilisateur a-t-il donné son consentement ?
    """
    isGiven: Boolean!

    """
    Version du consentement (ex: "1.0", "2.1")
    """
    version: String!

    """
    Adresse IP lors du consentement
    """
    ipAddress: String

    """
    User-Agent lors du consentement
    """
    userAgent: String

    """
    Métadonnées additionnelles (JSON)
    """
    metadata: JSON

    """
    Date de consentement
    """
    consentedAt: DateTime!

    """
    Date de révocation (si applicable)
    """
    revokedAt: DateTime

    """
    Date d'expiration (si applicable)
    """
    expiresAt: DateTime

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

  # ============================================
  # TYPES - DATA EXPORT REQUEST
  # ============================================

  """
  Représente une demande d'export de données
  """
  type DataExportRequest {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID de l'utilisateur
    """
    userId: Int!

    """
    Statut de la demande
    """
    status: DataExportStatus!

    """
    Adresse IP lors de la demande
    """
    ipAddress: String

    """
    Date de la demande
    """
    requestedAt: DateTime!

    """
    Date de traitement
    """
    processedAt: DateTime

    """
    Date de mise à disposition
    """
    availableAt: DateTime

    """
    Date d'expiration du fichier
    """
    expiresAt: DateTime

    """
    URL de téléchargement (si disponible)
    """
    downloadUrl: String

    """
    Taille du fichier en octets
    """
    fileSizeBytes: Int

    """
    Format du fichier (JSON, CSV, PDF)
    """
    fileFormat: String

    """
    Raison de l'échec (si statut FAILED)
    """
    failureReason: String

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

  # ============================================
  # TYPES - ACCOUNT DELETION REQUEST
  # ============================================

  """
  Représente une demande de suppression de compte
  """
  type AccountDeletionRequest {
    """
    Identifiant unique
    """
    id: Int!

    """
    ID de l'utilisateur
    """
    userId: Int!

    """
    Statut de la demande
    """
    status: AccountDeletionStatus!

    """
    Raison de la suppression
    """
    reason: String

    """
    Adresse IP lors de la demande
    """
    ipAddress: String

    """
    Date de la demande
    """
    requestedAt: DateTime!

    """
    Date programmée de suppression
    """
    scheduledFor: DateTime

    """
    ID de l'administrateur qui a approuvé/rejeté
    """
    reviewedBy: Int

    """
    Date de révision
    """
    reviewedAt: DateTime

    """
    Commentaire de l'administrateur
    """
    reviewComment: String

    """
    Date de traitement
    """
    processedAt: DateTime

    """
    Date de suppression effective
    """
    deletedAt: DateTime

    """
    Raison de l'échec (si statut FAILED)
    """
    failureReason: String

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

    """
    Administrateur qui a révisé (si disponible)
    """
    reviewer: User
  }

  # ============================================
  # TYPES - GDPR STATISTICS
  # ============================================

  """
  Statistiques GDPR
  """
  type GdprStatistics {
    """
    Nombre total de consentements actifs
    """
    totalActiveConsents: Int!

    """
    Nombre de consentements par type
    """
    consentsByType: [ConsentTypeCount!]!

    """
    Taux de consentement global (%)
    """
    overallConsentRate: Float!

    """
    Nombre de demandes d'export en attente
    """
    pendingExportRequests: Int!

    """
    Nombre de demandes d'export traitées ce mois
    """
    exportRequestsThisMonth: Int!

    """
    Nombre de demandes de suppression en attente
    """
    pendingDeletionRequests: Int!

    """
    Nombre de demandes de suppression traitées ce mois
    """
    deletionRequestsThisMonth: Int!

    """
    Nombre de consentements expirés
    """
    expiredConsents: Int!

    """
    Nombre de consentements révoqués ce mois
    """
    revokedConsentsThisMonth: Int!
  }

  """
  Comptage par type de consentement
  """
  type ConsentTypeCount {
    consentType: UserConsentType!
    given: Int!
    revoked: Int!
    total: Int!
    rate: Float!
  }

  """
  Rapport de conformité GDPR
  """
  type GdprComplianceReport {
    """
    Période du rapport
    """
    period: String!

    """
    Date de génération
    """
    generatedAt: DateTime!

    """
    Score de conformité global (0-100)
    """
    complianceScore: Float!

    """
    Le système est-il conforme ?
    """
    isCompliant: Boolean!

    """
    Nombre d'utilisateurs avec tous les consentements requis
    """
    compliantUsers: Int!

    """
    Nombre d'utilisateurs sans certains consentements requis
    """
    nonCompliantUsers: Int!

    """
    Demandes d'export en retard
    """
    overdueExportRequests: Int!

    """
    Demandes de suppression en retard
    """
    overdueDeletionRequests: Int!

    """
    Consentements expirés non renouvelés
    """
    expiredUnrenewedConsents: Int!

    """
    Problèmes de conformité détectés
    """
    issues: [ComplianceIssue!]!

    """
    Recommandations
    """
    recommendations: [String!]!
  }

  """
  Problème de conformité GDPR
  """
  type ComplianceIssue {
    """
    Sévérité (LOW, MEDIUM, HIGH, CRITICAL)
    """
    severity: String!

    """
    Type de problème
    """
    type: String!

    """
    Description du problème
    """
    description: String!

    """
    Nombre d'occurrences
    """
    count: Int!

    """
    Solution recommandée
    """
    recommendation: String
  }

  """
  Résumé des consentements d'un utilisateur
  """
  type UserConsentSummary {
    """
    ID de l'utilisateur
    """
    userId: Int!

    """
    Nombre total de consentements
    """
    totalConsents: Int!

    """
    Nombre de consentements actifs
    """
    activeConsents: Int!

    """
    Nombre de consentements révoqués
    """
    revokedConsents: Int!

    """
    Nombre de consentements expirés
    """
    expiredConsents: Int!

    """
    Liste des consentements manquants (requis)
    """
    missingRequiredConsents: [UserConsentType!]!

    """
    Tous les consentements requis sont-ils donnés ?
    """
    hasAllRequiredConsents: Boolean!

    """
    Date de dernier consentement
    """
    lastConsentedAt: DateTime

    """
    Consentements détaillés
    """
    consents: [UserConsent!]!
  }

  # ============================================
  # INPUTS - USER CONSENT
  # ============================================

  """
  Données pour créer un consentement
  """
  input CreateUserConsentInput {
    userId: Int!
    consentType: UserConsentType!
    isGiven: Boolean!
    version: String!
    ipAddress: String
    userAgent: String
    metadata: JSON
    expiresAt: DateTime
  }

  """
  Données pour mettre à jour un consentement
  """
  input UpdateUserConsentInput {
    isGiven: Boolean
    version: String
    expiresAt: DateTime
    metadata: JSON
  }

  """
  Filtre de recherche pour les consentements
  """
  input UserConsentFilter {
    userId: Int
    consentType: UserConsentType
    isGiven: Boolean
    version: String
    isExpired: Boolean
    createdAfter: DateTime
    createdBefore: DateTime
    limit: Int
    offset: Int
  }

  """
  Données pour donner/révoquer un consentement
  """
  input GiveConsentInput {
    userId: Int!
    consentType: UserConsentType!
    version: String!
    ipAddress: String
    userAgent: String
    metadata: JSON
  }

  """
  Données pour révoquer un consentement
  """
  input RevokeConsentInput {
    userId: Int!
    consentType: UserConsentType!
    ipAddress: String
    userAgent: String
  }

  # ============================================
  # INPUTS - DATA EXPORT REQUEST
  # ============================================

  """
  Données pour créer une demande d'export
  """
  input CreateDataExportRequestInput {
    userId: Int!
    fileFormat: String
    ipAddress: String
  }

  """
  Données pour mettre à jour une demande d'export
  """
  input UpdateDataExportRequestInput {
    status: DataExportStatus
    downloadUrl: String
    fileSizeBytes: Int
    failureReason: String
    processedAt: DateTime
    availableAt: DateTime
    expiresAt: DateTime
  }

  """
  Filtre de recherche pour les demandes d'export
  """
  input DataExportRequestFilter {
    userId: Int
    status: DataExportStatus
    requestedAfter: DateTime
    requestedBefore: DateTime
    isExpired: Boolean
    limit: Int
    offset: Int
  }

  # ============================================
  # INPUTS - ACCOUNT DELETION REQUEST
  # ============================================

  """
  Données pour créer une demande de suppression
  """
  input CreateAccountDeletionRequestInput {
    userId: Int!
    reason: String
    ipAddress: String
    scheduledFor: DateTime
  }

  """
  Données pour mettre à jour une demande de suppression
  """
  input UpdateAccountDeletionRequestInput {
    status: AccountDeletionStatus
    reason: String
    scheduledFor: DateTime
    failureReason: String
  }

  """
  Données pour réviser une demande de suppression
  """
  input ReviewAccountDeletionInput {
    requestId: Int!
    reviewedBy: Int!
    status: AccountDeletionStatus!
    reviewComment: String
  }

  """
  Filtre de recherche pour les demandes de suppression
  """
  input AccountDeletionRequestFilter {
    userId: Int
    status: AccountDeletionStatus
    requestedAfter: DateTime
    requestedBefore: DateTime
    scheduledAfter: DateTime
    scheduledBefore: DateTime
    limit: Int
    offset: Int
  }

  # ============================================
  # INPUTS - GDPR COMPLIANCE
  # ============================================

  """
  Options pour le rapport de conformité
  """
  input GdprComplianceReportOptions {
    startDate: DateTime
    endDate: DateTime
    includeDetails: Boolean
    includeRecommendations: Boolean
  }

  # ============================================
  # RESPONSE TYPES
  # ============================================

  """
  Liste paginée de consentements
  """
  type UserConsentList {
    items: [UserConsent!]!
    total: Int!
    hasMore: Boolean!
  }

  """
  Liste paginée de demandes d'export
  """
  type DataExportRequestList {
    items: [DataExportRequest!]!
    total: Int!
    hasMore: Boolean!
  }

  """
  Liste paginée de demandes de suppression
  """
  type AccountDeletionRequestList {
    items: [AccountDeletionRequest!]!
    total: Int!
    hasMore: Boolean!
  }

  """
  Résultat d'une opération sur un consentement
  """
  type UserConsentResult {
    success: Boolean!
    consent: UserConsent
    error: String
  }

  """
  Résultat d'une opération sur une demande d'export
  """
  type DataExportRequestResult {
    success: Boolean!
    exportRequest: DataExportRequest
    error: String
  }

  """
  Résultat d'une opération sur une demande de suppression
  """
  type AccountDeletionRequestResult {
    success: Boolean!
    deletionRequest: AccountDeletionRequest
    error: String
  }

  """
  Résultat de nettoyage des consentements expirés
  """
  type CleanupExpiredConsentsResult {
    success: Boolean!
    deletedCount: Int!
    error: String
  }

  """
  Résultat de nettoyage des exports expirés
  """
  type CleanupExpiredExportsResult {
    success: Boolean!
    deletedCount: Int!
    freedSpaceBytes: Int!
    error: String
  }

  # ============================================
  # QUERIES
  # ============================================

  extend type Query {
    """
    Récupérer un consentement par son ID
    """
    getUserConsent(id: Int!): UserConsent

    """
    Récupérer tous les consentements avec filtres
    """
    getUserConsentList(filter: UserConsentFilter): UserConsentList!

    """
    Récupérer les consentements d'un utilisateur
    """
    getUserConsents(userId: Int!): [UserConsent!]!

    """
    Récupérer le résumé des consentements d'un utilisateur
    """
    getUserConsentSummary(userId: Int!): UserConsentSummary!

    """
    Vérifier si un utilisateur a donné un consentement spécifique
    """
    hasUserConsent(userId: Int!, consentType: UserConsentType!): Boolean!

    """
    Récupérer les consentements expirés
    """
    getExpiredConsents(limit: Int): [UserConsent!]!

    """
    Récupérer les utilisateurs sans consentements requis
    """
    getUsersWithoutRequiredConsents: [Int!]!

    """
    Récupérer une demande d'export par son ID
    """
    getDataExportRequest(id: Int!): DataExportRequest

    """
    Récupérer toutes les demandes d'export avec filtres
    """
    getDataExportRequestList(
      filter: DataExportRequestFilter
    ): DataExportRequestList!

    """
    Récupérer les demandes d'export d'un utilisateur
    """
    getUserDataExportRequests(userId: Int!): [DataExportRequest!]!

    """
    Récupérer les demandes d'export en attente
    """
    getPendingDataExportRequests: [DataExportRequest!]!

    """
    Vérifier si un export est disponible
    """
    isDataExportAvailable(id: Int!): Boolean!

    """
    Récupérer une demande de suppression par son ID
    """
    getAccountDeletionRequest(id: Int!): AccountDeletionRequest

    """
    Récupérer toutes les demandes de suppression avec filtres
    """
    getAccountDeletionRequestList(
      filter: AccountDeletionRequestFilter
    ): AccountDeletionRequestList!

    """
    Récupérer les demandes de suppression d'un utilisateur
    """
    getUserAccountDeletionRequests(userId: Int!): [AccountDeletionRequest!]!

    """
    Récupérer les demandes de suppression en attente de révision
    """
    getPendingAccountDeletionRequests: [AccountDeletionRequest!]!

    """
    Récupérer les demandes de suppression programmées
    """
    getScheduledAccountDeletions(
      beforeDate: DateTime
    ): [AccountDeletionRequest!]!

    """
    Récupérer les statistiques GDPR
    """
    getGdprStatistics(startDate: DateTime, endDate: DateTime): GdprStatistics!

    """
    Générer un rapport de conformité GDPR
    """
    generateGdprComplianceReport(
      options: GdprComplianceReportOptions
    ): GdprComplianceReport!

    """
    Vérifier la conformité GDPR globale
    """
    checkGdprCompliance: Boolean!

    """
    Compter les consentements par filtre
    """
    countUserConsents(filter: UserConsentFilter): Int!

    """
    Compter les demandes d'export par filtre
    """
    countDataExportRequests(filter: DataExportRequestFilter): Int!

    """
    Compter les demandes de suppression par filtre
    """
    countAccountDeletionRequests(filter: AccountDeletionRequestFilter): Int!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  extend type Mutation {
    """
    Créer un nouveau consentement
    """
    createUserConsent(input: CreateUserConsentInput!): UserConsentResult!

    """
    Mettre à jour un consentement
    """
    updateUserConsent(
      id: Int!
      input: UpdateUserConsentInput!
    ): UserConsentResult!

    """
    Donner un consentement
    """
    giveConsent(input: GiveConsentInput!): UserConsentResult!

    """
    Révoquer un consentement
    """
    revokeConsent(input: RevokeConsentInput!): UserConsentResult!

    """
    Révoquer tous les consentements d'un utilisateur
    """
    revokeAllUserConsents(userId: Int!): UserConsentResult!

    """
    Renouveler un consentement expiré
    """
    renewConsent(
      userId: Int!
      consentType: UserConsentType!
      version: String!
    ): UserConsentResult!

    """
    Nettoyer les consentements expirés
    """
    cleanupExpiredConsents(olderThanDays: Int!): CleanupExpiredConsentsResult!

    """
    Créer une demande d'export de données
    """
    createDataExportRequest(
      input: CreateDataExportRequestInput!
    ): DataExportRequestResult!

    """
    Mettre à jour une demande d'export
    """
    updateDataExportRequest(
      id: Int!
      input: UpdateDataExportRequestInput!
    ): DataExportRequestResult!

    """
    Traiter une demande d'export
    """
    processDataExportRequest(id: Int!): DataExportRequestResult!

    """
    Annuler une demande d'export
    """
    cancelDataExportRequest(id: Int!): DataExportRequestResult!

    """
    Nettoyer les exports expirés
    """
    cleanupExpiredExports: CleanupExpiredExportsResult!

    """
    Créer une demande de suppression de compte
    """
    createAccountDeletionRequest(
      input: CreateAccountDeletionRequestInput!
    ): AccountDeletionRequestResult!

    """
    Mettre à jour une demande de suppression
    """
    updateAccountDeletionRequest(
      id: Int!
      input: UpdateAccountDeletionRequestInput!
    ): AccountDeletionRequestResult!

    """
    Réviser une demande de suppression (approuver/rejeter)
    """
    reviewAccountDeletionRequest(
      input: ReviewAccountDeletionInput!
    ): AccountDeletionRequestResult!

    """
    Approuver une demande de suppression
    """
    approveAccountDeletionRequest(
      id: Int!
      reviewedBy: Int!
      reviewComment: String
    ): AccountDeletionRequestResult!

    """
    Rejeter une demande de suppression
    """
    rejectAccountDeletionRequest(
      id: Int!
      reviewedBy: Int!
      reviewComment: String!
    ): AccountDeletionRequestResult!

    """
    Traiter une demande de suppression
    """
    processAccountDeletionRequest(id: Int!): AccountDeletionRequestResult!

    """
    Annuler une demande de suppression
    """
    cancelAccountDeletionRequest(id: Int!): AccountDeletionRequestResult!

    """
    Traiter toutes les suppressions programmées
    """
    processScheduledAccountDeletions: AccountDeletionRequestResult!

    """
    Exporter toutes les données d'un utilisateur (anonymisation)
    """
    anonymizeUserData(userId: Int!): UserConsentResult!
  }
`;
