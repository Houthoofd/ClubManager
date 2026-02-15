/**
 * Types pour le système d'emails
 */

export interface EmailSendRequest {
  to: string;
  subject?: string;
  message?: string;
  templateId?: number;
  templateTitle?: string;
  variables?: Record<string, string>;
  isHtml?: boolean;
  saveToDb?: boolean;
  utilisateurId?: number;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export interface EmailValidationRequest {
  email: string;
  prenom: string;
  nom: string;
  userId: string;
  utilisateurId: number;
}

export interface EmailSendValidation {
  success: boolean;
  message: string;
  data?: any;
  details?: any;
}

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
}

export interface EmailTemplateVariables {
  clubName?: string;
  clubWebsite?: string;
  supportEmail?: string;
  currentYear?: string;
  currentDate?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: string | undefined;
}

export interface SendGridOptions {
  fallbackOnError?: boolean;
  saveToDb?: boolean;
  utilisateurId?: number;
}

export interface PromotionEmailOptions {
  templateName?: string;
  variables?: Record<string, string>;
}

export interface WelcomeEmailVariables {
  userName: string;
  email: string;
  userId: string;
}

export interface OrderConfirmationVariables {
  userName: string;
  numeroCommande: string;
  dateCommande: string;
  statutCommande: string;
  nbArticles: string;
  totalCommande: string;
}

// ============================================================================
// TYPES AVANCÉS - Système d'Email Amélioré v2.1
// ============================================================================

/**
 * Variables spécifiques par template
 */
export interface TemplateVariablesMap {
  bienvenue: {
    userName: string;
    loginUrl?: string;
  };
  "reset-password": {
    userName: string;
    resetUrl: string;
    expiresIn?: string;
  };
  "password-reset": {
    userName: string;
    resetUrl: string;
    expiresIn?: string;
  };
  "confirmation-commande": OrderConfirmationVariables;
  "promotion-professeur": {
    userName: string;
    customMessage?: string;
    promotionDate?: string;
  };
  "bienvenue-abonnement": {
    userName: string;
    planName: string;
    planPrice?: string;
  };
  "annulation-abonnement": {
    userName: string;
    planName: string;
    cancellationDate?: string;
  };
  "confirmation-paiement": {
    userName: string;
    amount: string;
    date: string;
  };
  "echec-paiement": {
    userName: string;
    amount: string;
    reason?: string;
  };
  "notification-cours": {
    userName: string;
    coursNom: string;
    dateHeure: string;
  };
}

/**
 * Noms de templates valides (auto-complétion)
 */
export type TemplateName = keyof TemplateVariablesMap;

/**
 * Variables pour un template donné (typées)
 */
export type TemplateVariables<T extends TemplateName> = TemplateVariablesMap[T];

/**
 * Configuration pour envoi bulk
 */
export interface BulkEmailRecipient<T extends TemplateName = TemplateName> {
  to?: string;
  user?: any; // Type utilisateur
  variables: Partial<TemplateVariables<T>>;
  utilisateurId?: number;
}

export interface BulkEmailRequest<T extends TemplateName = TemplateName> {
  templateTitle: T;
  recipients: BulkEmailRecipient<T>[];
  commonVariables?: Partial<TemplateVariables<T>>;
  dryRun?: boolean;
}

export interface BulkEmailResult {
  total: number;
  success: number;
  failed: number;
  results: EmailSendResult[];
  errors: Array<{ recipient: string; error: string }>;
}

/**
 * Options pour le Builder (Fluent API)
 */
export interface EmailBuilderOptions {
  dryRun?: boolean;
  saveToDb?: boolean;
  priority?: "low" | "normal" | "high";
  scheduleAt?: Date;
}

/**
 * Résultat du dry-run
 */
export interface DryRunResult {
  success: true;
  dryRun: true;
  preview: {
    to: string;
    subject: string;
    html: string;
    variables: Record<string, string>;
  };
  validation: {
    isValid: boolean;
    missingVariables: string[];
    unusedVariables: string[];
  };
}

/**
 * Helper pour extraire données utilisateur
 */
export interface UserEmailData {
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  userId: number;
}

/**
 * Hooks pour before/after send
 */
export type EmailHook = (
  email: EmailSendRequest,
  result?: EmailSendResult,
) => void | Promise<void>;

/**
 * Request enrichie pour le builder
 */
export interface EnrichedEmailRequest<
  T extends TemplateName = TemplateName,
> extends Omit<EmailSendRequest, "variables" | "templateTitle"> {
  templateTitle?: T;
  variables?: Partial<TemplateVariables<T>>;
  dryRun?: boolean;
}

/**
 * Partials pour templates composables
 */
export interface EmailPartial {
  name: string;
  content: string;
}

/**
 * Stats d'envoi enrichies
 */
export interface EmailStats {
  totalSent: number;
  totalFailed: number;
  averageDuration: number;
  byTemplate: Record<string, { sent: number; failed: number }>;
  recentErrors: Array<{ timestamp: Date; error: string; to: string }>;
}

// ============================================================================
// PHASE 2 - Métriques Avancées, Correlation IDs & Alertes
// ============================================================================

/**
 * Configuration des métriques Prometheus
 */
export interface MetricsConfig {
  enabled: boolean;
  defaultLabels?: Record<string, string>;
  prefix?: string;
}

/**
 * Labels pour les métriques d'email
 */
export interface EmailMetricLabels {
  priority?: "urgent" | "normal" | "low";
  template?: string;
  status?: "success" | "failure" | "pending" | "cancelled";
  error_type?: string;
  circuit_breaker_state?: "CLOSED" | "OPEN" | "HALF_OPEN";
}

/**
 * Snapshot des métriques
 */
export interface MetricsSnapshot {
  timestamp: Date;
  metrics: Record<string, any>;
}

/**
 * Configuration du Correlation ID Manager
 */
export interface CorrelationIdConfig {
  enabled: boolean;
  headerName: string;
  prefix?: string;
  includeTimestamp?: boolean;
}

/**
 * Metadata associées à un correlation ID
 */
export interface CorrelationMetadata {
  userId?: string;
  emailId?: string;
  operation?: string;
  template?: string;
  priority?: "urgent" | "normal" | "low";
  timestamp?: Date;
  parentId?: string;
  tags?: Record<string, string>;
}

/**
 * Contexte de corrélation complet
 */
export interface CorrelationContext {
  correlationId: string;
  metadata: CorrelationMetadata;
}

/**
 * Configuration du système d'alertes
 */
export interface AlertConfig {
  enabled: boolean;
  channels: AlertChannel[];
  throttle?: {
    enabled: boolean;
    windowMs: number;
    maxAlerts: number;
  };
  severity?: {
    critical: AlertChannelType[];
    warning: AlertChannelType[];
    info: AlertChannelType[];
  };
}

/**
 * Types de canaux d'alerte
 */
export type AlertChannelType = "slack" | "discord" | "email" | "webhook";

/**
 * Configuration d'un canal d'alerte
 */
export interface AlertChannel {
  type: AlertChannelType;
  enabled: boolean;
  webhookUrl?: string;
  email?: string;
  config?: Record<string, any>;
}

/**
 * Sévérité d'une alerte
 */
export type AlertSeverity = "critical" | "warning" | "info";

/**
 * Contexte d'une alerte
 */
export interface AlertContext {
  emailId?: string;
  userId?: string;
  template?: string;
  priority?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Requête d'alerte
 */
export interface AlertRequest {
  title: string;
  message: string;
  severity: AlertSeverity;
  context?: AlertContext;
  timestamp?: Date;
}

/**
 * Résultat d'envoi d'alerte
 */
export interface AlertResult {
  success: boolean;
  channel: AlertChannelType;
  messageId?: string;
  error?: string;
}

/**
 * Format de message Slack
 */
export interface SlackMessage {
  text?: string;
  blocks?: any[];
  attachments?: any[];
}

/**
 * Format de message Discord
 */
export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
}

/**
 * Embed Discord
 */
export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
  footer?: {
    text: string;
  };
}

/**
 * Statistiques du système d'alertes
 */
export interface AlertStats {
  totalSent: number;
  byChannel: Record<AlertChannelType, number>;
  bySeverity: Record<AlertSeverity, number>;
  recentAlerts: Array<{
    timestamp: Date;
    severity: AlertSeverity;
    title: string;
  }>;
  throttledAlerts: number;
}

/**
 * Configuration du dashboard admin
 */
export interface DashboardConfig {
  enabled: boolean;
  refreshInterval?: number;
  metricsRetention?: number;
}

/**
 * Données du dashboard en temps réel
 */
export interface DashboardData {
  timestamp: Date;
  queue: {
    pending: number;
    inProgress: number;
    stuck: number;
    byPriority: Record<string, number>;
  };
  metrics: {
    sent24h: number;
    failed24h: number;
    successRate: number;
    avgLatency: number;
  };
  circuitBreaker: {
    state: "CLOSED" | "OPEN" | "HALF_OPEN";
    failures: number;
    successes: number;
  };
  worker: {
    active: boolean;
    lastProcessed?: Date;
    processingRate: number;
  };
  recentErrors: Array<{
    timestamp: Date;
    error: string;
    emailId: string;
  }>;
}

/**
 * Événement de dashboard (WebSocket)
 */
export interface DashboardEvent {
  type: "metrics" | "alert" | "queue_update" | "error";
  data: any;
  timestamp: Date;
}

// ============================================================================
// PHASE 3 - Validation Email Avancée, Spam Score & A/B Testing
// ============================================================================

/**
 * Configuration de la validation email avancée
 */
export interface EmailValidationConfig {
  enabled: boolean;
  checkMxRecords?: boolean;
  checkDisposable?: boolean;
  checkTypos?: boolean;
  checkRoleAccounts?: boolean;
  strictMode?: boolean;
  timeout?: number;
}

/**
 * Résultat de validation email détaillé
 */
export interface EmailValidationResult {
  valid: boolean;
  email: string;
  normalized?: string;
  issues: EmailValidationIssue[];
  score: number; // 0-100
  recommendation: "accept" | "review" | "reject";
  details: {
    syntax: boolean;
    mxRecords?: boolean;
    disposable?: boolean;
    roleAccount?: boolean;
    typoSuggestion?: string;
    domain?: string;
    provider?: string;
  };
}

/**
 * Problème de validation email
 */
export interface EmailValidationIssue {
  type:
    | "syntax"
    | "mx_records"
    | "disposable"
    | "role_account"
    | "typo"
    | "other";
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

/**
 * Configuration du spam score checker
 */
export interface SpamScoreConfig {
  enabled: boolean;
  threshold?: number; // 0-10 (10 = très spam)
  checkContent?: boolean;
  checkSubject?: boolean;
  checkLinks?: boolean;
  checkImages?: boolean;
  strictMode?: boolean;
}

/**
 * Résultat du spam score
 */
export interface SpamScoreResult {
  score: number; // 0-10
  level: "low" | "medium" | "high" | "critical";
  passed: boolean;
  issues: SpamScoreIssue[];
  recommendations: string[];
  details: {
    contentScore?: number;
    subjectScore?: number;
    linksScore?: number;
    imagesScore?: number;
    overallAssessment: string;
  };
}

/**
 * Problème de spam détecté
 */
export interface SpamScoreIssue {
  type:
    | "excessive_caps"
    | "spam_words"
    | "too_many_links"
    | "suspicious_links"
    | "missing_unsubscribe"
    | "misleading_subject"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  impact: number; // Points ajoutés au score
  suggestion?: string;
}

/**
 * Configuration des tests de templates
 */
export interface TemplateTestConfig {
  enabled: boolean;
  testRecipients?: string[];
  checkRendering?: boolean;
  checkLinks?: boolean;
  checkImages?: boolean;
  checkResponsive?: boolean;
  validateVariables?: boolean;
}

/**
 * Résultat de test de template
 */
export interface TemplateTestResult {
  success: boolean;
  template: string;
  tests: TemplateTest[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  recommendations: string[];
}

/**
 * Test individuel de template
 */
export interface TemplateTest {
  name: string;
  type: "rendering" | "links" | "images" | "responsive" | "variables" | "spam";
  passed: boolean;
  message: string;
  details?: any;
  severity?: "error" | "warning" | "info";
}

/**
 * Configuration A/B Testing
 */
export interface ABTestConfig {
  enabled: boolean;
  name: string;
  variants: ABTestVariant[];
  distribution?: number[]; // Pourcentage pour chaque variant
  duration?: number; // Durée du test en ms
  successMetric: "open_rate" | "click_rate" | "conversion_rate" | "custom";
  minSampleSize?: number;
  confidenceLevel?: number; // 90, 95, 99
}

/**
 * Variant pour A/B testing
 */
export interface ABTestVariant {
  id: string;
  name: string;
  templateId?: number;
  templateTitle?: string;
  subject?: string;
  variables?: Record<string, string>;
  weight?: number; // Poids relatif pour la distribution
}

/**
 * Résultat A/B Test
 */
export interface ABTestResult {
  testId: string;
  name: string;
  status: "running" | "completed" | "paused" | "cancelled";
  startDate: Date;
  endDate?: Date;
  variants: ABTestVariantResult[];
  winner?: string; // ID du variant gagnant
  confidence?: number;
  summary: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalConverted: number;
  };
  recommendation?: string;
}

/**
 * Résultat d'un variant A/B
 */
export interface ABTestVariantResult {
  variantId: string;
  name: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate?: number;
  unsubscribeRate?: number;
}

/**
 * Statistiques de validation email
 */
export interface EmailValidationStats {
  total: number;
  valid: number;
  invalid: number;
  validationRate: number;
  commonIssues: Array<{
    type: string;
    count: number;
  }>;
  topDomains: Array<{
    domain: string;
    count: number;
    validRate: number;
  }>;
}

/**
 * Configuration du rate limiting intelligent
 */
export interface RateLimitConfig {
  enabled: boolean;
  byDomain?: boolean;
  byProvider?: boolean;
  limits: {
    [key: string]: {
      perMinute?: number;
      perHour?: number;
      perDay?: number;
    };
  };
  warmupMode?: boolean;
}

/**
 * Domaine email catégorisé
 */
export interface EmailDomain {
  domain: string;
  provider?: string;
  category: "personal" | "business" | "disposable" | "role" | "unknown";
  reputation?: number; // 0-100
  mxRecords?: string[];
  verified?: boolean;
}

/**
 * Typo suggestion pour email
 */
export interface EmailTypoSuggestion {
  original: string;
  suggested: string;
  confidence: number; // 0-100
  type: "domain" | "tld" | "username";
}

/**
 * Configuration du warmup IP
 */
export interface IPWarmupConfig {
  enabled: boolean;
  startVolume: number;
  dailyIncrement: number;
  maxVolume: number;
  currentDay: number;
  schedule: IPWarmupSchedule[];
}

/**
 * Planning warmup IP
 */
export interface IPWarmupSchedule {
  day: number;
  maxEmails: number;
  completed: number;
  status: "pending" | "in_progress" | "completed";
}
