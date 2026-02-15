/**
 * Centralized Service Types
 *
 * All service-related interfaces and types for ClubManager API services.
 * This file consolidates types from various service files across the API.
 */

// Using number type instead of Decimal for better compatibility
// Decimal will be handled at runtime by Prisma
type Decimal = number;

// ============================================================================
// SESSION SERVICE TYPES
// ============================================================================

export interface SessionData {
  id: string;
  userId: number;
  token: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    deviceType?: "desktop" | "mobile" | "tablet" | "unknown";
    browser?: string;
    os?: string;
  };
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface CreateSessionOptions {
  userId: number;
  userAgent: string;
  ipAddress: string;
  expiresInDays?: number;
}

export interface SessionQueryOptions {
  userId?: number;
  isActive?: boolean;
  includeExpired?: boolean;
  activeOnly?: boolean;
  limit?: number;
}

// ============================================================================
// AUDIT LOG SERVICE TYPES
// ============================================================================

export enum AuditEventType {
  // Authentication
  AUTH_LOGIN_SUCCESS = "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILED = "AUTH_LOGIN_FAILED",
  AUTH_LOGOUT = "AUTH_LOGOUT",
  AUTH_PASSWORD_CHANGE = "AUTH_PASSWORD_CHANGE",
  AUTH_PASSWORD_RESET_REQUEST = "AUTH_PASSWORD_RESET_REQUEST",
  AUTH_PASSWORD_RESET_COMPLETE = "AUTH_PASSWORD_RESET_COMPLETE",
  AUTH_EMAIL_VERIFICATION = "AUTH_EMAIL_VERIFICATION",
  AUTH_ACCOUNT_LOCKED = "AUTH_ACCOUNT_LOCKED",
  AUTH_ACCOUNT_UNLOCKED = "AUTH_ACCOUNT_UNLOCKED",

  // User Management
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
  USER_PERMISSIONS_CHANGED = "USER_PERMISSIONS_CHANGED",

  // Data Access (GDPR)
  DATA_ACCESSED = "DATA_ACCESSED",
  DATA_EXPORTED = "DATA_EXPORTED",
  DATA_DELETED = "DATA_DELETED",
  GDPR_DATA_REQUEST = "GDPR_DATA_REQUEST",
  GDPR_DATA_DELETION = "GDPR_DATA_DELETION",

  // Security Events
  SECURITY_RATE_LIMIT_EXCEEDED = "SECURITY_RATE_LIMIT_EXCEEDED",
  SECURITY_UNAUTHORIZED_ACCESS = "SECURITY_UNAUTHORIZED_ACCESS",
  SECURITY_SUSPICIOUS_ACTIVITY = "SECURITY_SUSPICIOUS_ACTIVITY",
  SECURITY_SESSION_HIJACK_ATTEMPT = "SECURITY_SESSION_HIJACK_ATTEMPT",

  // Admin Actions
  ADMIN_USER_IMPERSONATION = "ADMIN_USER_IMPERSONATION",
  ADMIN_CONFIG_CHANGE = "ADMIN_CONFIG_CHANGE",
  ADMIN_SYSTEM_OPERATION = "ADMIN_SYSTEM_OPERATION",
}

export enum AuditSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export interface AuditLogEntry {
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: number;
  actorId?: number;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  metadata?: Record<string, any>;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface AuditQueryOptions {
  userId?: number;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  page?: number;
}

// ============================================================================
// AUTH SERVICE TYPES
// ============================================================================

export interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status_id: number;
  status: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: UserData;
  token?: string;
}

export interface TokenData {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  expires_at: Date;
}

export interface AuthRateLimitRule {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs?: number;
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  blockedUntil?: Date;
  message?: string;
}

// ============================================================================
// ALERTES SERVICE TYPES
// ============================================================================

export interface AlerteDashboard {
  totalAlertes: number;
  alertesCritiques: number;
  alertesEnAttente: number;
  alertesResolues: number;
  alertesParType: Record<string, number>;
  tendances?: {
    derniere_semaine: number;
    dernier_mois: number;
    evolution: string;
  };
}

export interface AlerteData {
  id: number;
  type: string;
  severite: string;
  message: string;
  utilisateur_id?: number;
  statut: string;
  date_detection: Date;
  date_resolution?: Date;
  notes?: string;
  utilisateur?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

// ============================================================================
// COMMANDES SERVICE TYPES
// ============================================================================

export interface CommandeData {
  id: number;
  unique_id?: string | null;
  numero_commande?: string | null;
  utilisateur_id: number;
  total: number;
  date_commande: Date;
  statut?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: Date;
  updated_at?: Date | null;
  utilisateur?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  articles?: Array<{
    article_id: number;
    nom: string;
    quantite: number;
    prix: number;
    taille?: string;
  }>;
}

export interface StatistiquesCommandes {
  total_commandes: number;
  commandes_en_attente: number;
  commandes_validees: number;
  commandes_confirmees?: number;
  commandes_annulees: number;
  montant_total: number;
  montant_moyen: number;
  panier_moyen?: number;
}

// ============================================================================
// COMPTE SERVICE TYPES
// ============================================================================

export interface CompteData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  genre_id?: number | null;
  grade_id?: number | null;
  status_id: number;
  abonnement_id?: number | null;
  telephone?: string | null;
  date_naissance?: Date | null;
  adresse?: string | null;
  date_inscription: Date;
  active: boolean;
  email_verified?: boolean | null;
  stripe_customer_id?: string | null;
}

export interface CompteUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  genre_id?: number;
  grade_id?: number;
  status_id?: number;
  abonnement_id?: number;
  telephone?: string;
  date_naissance?: Date;
  adresse?: string;
  photo_profil?: string;
}

export interface PasswordUpdateInput {
  utilisateur_id: number;
  new_password: string;
  is_creation: boolean;
}

// ============================================================================
// CONFIRMATION SERVICE TYPES
// ============================================================================

export interface InscriptionData {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  date_inscription: Date;
  status_id: boolean | null;
  utilisateurs?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  cours?: {
    date_cours: Date;
    type_cours: string;
  };
}

export interface ReservationData {
  id: number;
  utilisateur_id: number;
  cours_id: number;
  utilisateurs?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  cours?: {
    date_cours: Date;
    type_cours: string;
  };
}

// ============================================================================
// COURS SERVICE TYPES
// ============================================================================

export interface CoursData {
  id: number;
  date_cours: Date;
  type_cours: string;
  heure_debut: Date;
  heure_fin: Date;
  cours_recurrent_id: number;
  cours_recurrent?: {
    type_cours: string;
    description?: string | null;
    niveau?: string | null;
  };
  professeurs?: Array<{
    id: number;
    first_name: string;
    last_name: string;
  }>;
}

export interface CoursRecurrentData {
  id: number;
  type_cours: string;
  description?: string | null;
  niveau?: string | null;
  duree?: number | null;
  capacite_max?: number | null;
  jour_semaine?: string | null;
  heure_debut?: Date | null;
  heure_fin?: Date | null;
  actif: boolean;
}

// ============================================================================
// ECHEANCES SERVICE TYPES
// ============================================================================

export interface Echeance {
  id: number;
  utilisateur_id: number;
  abonnement_id?: number;
  montant: number;
  date_echeance: string;
  statut: "en_attente" | "pay_" | "chu";
  date_creation?: string;
  date_paiement?: string;
  stripe_payment_intent_id?: string;
  description?: string;
}

export interface EcheanceAvecDetails extends Echeance {
  utilisateur?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  plan?: {
    nom_plan: string;
    prix: number;
  };
  statut_calcule?: string;
}

export interface StatistiquesEcheances {
  total_echeances: number;
  en_attente: number;
  payees: number;
  echues: number;
  montant_total_du: number;
}

// ============================================================================
// INFORMATIONS SERVICE TYPES
// ============================================================================

export interface InformationData {
  id: number;
  titre: string;
  contenu: string;
  categorie?: string | null;
  actif: boolean;
  date_publication?: Date | null;
  date_archivage?: Date | null;
  created_at: Date;
  updated_at?: Date | null;
}

// ============================================================================
// INSCRIPTION SERVICE TYPES
// ============================================================================

export interface EmailVerificationResult {
  exists: boolean;
  message?: string;
}

export interface InscriptionResult {
  success: boolean;
  message: string;
  userId?: number;
  generatedUserId?: string;
}

// ============================================================================
// MAGASIN SERVICE TYPES
// ============================================================================

export interface Article {
  id: number;
  nom: string;
  description?: string;
  prix: number;
  stock: number;
  categorie_id: number;
  image_url?: string;
  actif: boolean;
  tailles_disponibles?: string[];
  created_at?: Date;
  updated_at?: Date;
}

export interface Commande {
  id: number;
  utilisateur_id: number;
  unique_id: string;
  numero_commande: string;
  total: number;
  statut: "en attente" | "validé" | "préparé" | "livré" | "annulé";
  date: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface CommandeAvecDetails extends Commande {
  articles: ArticleCommande[];
  utilisateur?: {
    nom: string;
    prenom: string;
    email: string;
  };
}

export interface ArticleCommande {
  article_id: number;
  nom?: string;
  quantite: number;
  taille: string;
  prix?: number;
}

export interface StatistiquesMagasin {
  total_commandes: number;
  commandes_en_attente: number;
  commandes_validees: number;
  commandes_livrees: number;
  commandes_annulees: number;
  chiffre_affaires_total: number;
  article_le_plus_vendu?: {
    id: number;
    nom: string;
    quantite_vendue: number;
  };
}

// ============================================================================
// PAIEMENTS SERVICE TYPES
// ============================================================================

export interface PaiementData {
  id: number;
  utilisateur_id: number;
  montant: Decimal | number;
  devise: string;
  statut: string;
  type_paiement?: string | null;
  methode_paiement?: string | null;
  reference_externe?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_charge_id?: string | null;
  description?: string | null;
  metadata?: any;
  echeance_id?: number | null;
  commande_id?: number | null;
  date_paiement: Date;
  created_at: Date;
  updated_at?: Date | null;
}

export interface PaiementFilters {
  utilisateur_id?: number;
  statut?: string;
  type_paiement?: string;
  methode_paiement?: string;
  date_debut?: Date | string;
  date_fin?: Date | string;
  montant_min?: number;
  montant_max?: number;
  echeance_id?: number;
  commande_id?: number;
  reference_externe?: string;
  stripe_payment_intent_id?: string;
}

export interface CreatePaiementInput {
  utilisateur_id: number;
  montant: number;
  devise?: string;
  statut?: string;
  type_paiement?: string;
  methode_paiement?: string;
  reference_externe?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  description?: string;
  metadata?: any;
  echeance_id?: number;
  commande_id?: number;
}

export interface UpdatePaiementInput {
  montant?: number;
  devise?: string;
  statut?: string;
  type_paiement?: string;
  methode_paiement?: string;
  reference_externe?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  description?: string;
  metadata?: any;
  echeance_id?: number;
  commande_id?: number;
  date_paiement?: Date;
}

// ============================================================================
// PROFESSEURS SERVICE TYPES
// ============================================================================

export interface Professeur {
  id: number;
  userId: string;
  first_name: string;
  last_name: string;
  email: string;
  nom_utilisateur: string;
  status_id?: number;
  status?: string;
  date_inscription: Date;
  telephone?: string;
  specialites?: string[];
  bio?: string;
  photo_url?: string;
}

// ============================================================================
// STOCKS SERVICE TYPES
// ============================================================================

export interface StockData {
  id: number;
  article_id: number;
  taille: string;
  quantite: number;
  seuil_alerte?: number | null;
  created_at?: Date;
  updated_at?: Date | null;
  article?: {
    nom: string;
    prix: number;
    categorie_id: number;
  };
}

export interface StockFilters {
  article_id?: number;
  taille?: string;
  quantite_min?: number;
  quantite_max?: number;
  alerte?: boolean;
}

// ============================================================================
// EMAIL SERVICE TYPES
// ============================================================================

export interface EmailTemplate {
  id: number;
  title: string;
  subject: string;
  content: string;
  variables?: string[];
  active: boolean;
}

export interface ProcessedTemplate {
  subject: string;
  html: string;
}
