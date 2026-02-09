/**
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║  ROADMAP DES AMÉLIORATIONS FUTURES - Module Auth                     ║
 * ╚════════════════════════════════════════════════════════════════════════╝
 *
 * Ce fichier liste toutes les améliorations possibles pour le module Auth,
 * classées par priorité et catégorie.
 *
 * Status actuel : Configuration + Cookies + Rate Limiting ✅
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * ============================================================================
 * 🔥 HAUTE PRIORITÉ (À faire cette semaine/ce mois)
 * ============================================================================
 */

export const HIGH_PRIORITY_IMPROVEMENTS = {
  /**
   * 1. ACCOUNT LOCKOUT PROGRESSIF
   * -----------------------------------------------
   * Status: ⏳ Préparé (config existe) mais pas implémenté
   * Effort: 🟡 Moyen (2-3 jours)
   * Impact: 🔥🔥🔥 Critique pour la sécurité
   *
   * Description:
   * Bloquer progressivement les comptes après plusieurs tentatives échouées.
   * Le temps de blocage augmente à chaque nouvelle tentative.
   *
   * Fonctionnalités:
   * - Tracker les tentatives de login échouées par utilisateur
   * - Bloquer le compte après N tentatives (config: 5)
   * - Durée de blocage progressive (1h → 6h → 24h → 7 jours)
   * - Email de notification à l'utilisateur
   * - Déblocage automatique après expiration
   * - Déblocage manuel par admin
   * - Reset du compteur après login réussi
   *
   * Fichiers à créer:
   * - core/services/account-lockout.service.ts
   * - core/middleware/account-lockout.middleware.ts
   * - Migration DB pour lockout_count, locked_until, etc.
   *
   * Exemple:
   * ```ts
   * const login = withLoginRateLimit()(
   *   withAccountLockout()(  // ← NOUVEAU
   *     async (parent, args, context) => {
   *       // Si compte verrouillé, AccountLockedError automatique
   *       const user = await authenticate(args.email, args.password);
   *       return { user };
   *     }
   *   )
   * );
   * ```
   *
   * Base de données:
   * ALTER TABLE utilisateurs ADD COLUMN lockout_count INT DEFAULT 0;
   * ALTER TABLE utilisateurs ADD COLUMN locked_until TIMESTAMP NULL;
   * ALTER TABLE utilisateurs ADD COLUMN last_failed_login TIMESTAMP NULL;
   */
  accountLockout: {
    priority: 1,
    status: "⏳ TODO",
    effort: "2-3 jours",
    impact: "CRITIQUE",
    dependencies: ["Rate limiting (✅ fait)"],
    files: [
      "core/services/account-lockout.service.ts",
      "core/middleware/account-lockout.middleware.ts",
      "__tests__/account-lockout.test.ts",
    ],
    dbChanges: ["Migration pour lockout_count, locked_until"],
  },

  /**
   * 2. AUDIT LOGGING / ACTIVITY LOGS
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🟡 Moyen (2-4 jours)
   * Impact: 🔥🔥🔥 Critique pour conformité et sécurité
   *
   * Description:
   * Logger toutes les actions sensibles pour audit et investigation.
   * Essentiel pour RGPD/conformité et détection d'anomalies.
   *
   * Actions à logger:
   * - Login (succès + échec) avec IP, user-agent, timestamp
   * - Logout
   * - Changement de mot de passe
   * - Reset de mot de passe (demande + confirmation)
   * - Changement d'email
   * - Activation/désactivation 2FA
   * - Modification de profil sensible
   * - Accès aux données sensibles
   * - Tentatives de rate limiting dépassées
   * - Account lockout
   *
   * Stockage:
   * - Base de données (table `audit_logs`)
   * - Optionnel: Elasticsearch pour recherche rapide
   * - Optionnel: Export vers SIEM (Splunk, etc.)
   *
   * Structure:
   * ```ts
   * interface AuditLog {
   *   id: number;
   *   user_id: number | null;
   *   action: string; // 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', etc.
   *   status: 'SUCCESS' | 'FAILURE';
   *   ip_address: string;
   *   user_agent: string;
   *   metadata: object; // Détails supplémentaires (email, raison échec, etc.)
   *   timestamp: Date;
   * }
   * ```
   *
   * Exemple:
   * ```ts
   * await auditLogger.log({
   *   userId: user.id,
   *   action: 'LOGIN',
   *   status: 'SUCCESS',
   *   ipAddress: context.req.ip,
   *   userAgent: context.req.headers['user-agent'],
   *   metadata: { email: user.email },
   * });
   * ```
   *
   * Admin Dashboard:
   * - Voir tous les logs d'un utilisateur
   * - Rechercher par action, date, IP
   * - Export CSV/JSON pour investigation
   */
  auditLogging: {
    priority: 2,
    status: "⏳ TODO",
    effort: "2-4 jours",
    impact: "CRITIQUE",
    dependencies: [],
    files: [
      "core/services/audit-logger.service.ts",
      "core/middleware/audit-logger.middleware.ts",
      "__tests__/audit-logger.test.ts",
    ],
    dbChanges: ["Créer table audit_logs"],
  },

  /**
   * 3. SESSION MANAGEMENT
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🟡 Moyen (3-4 jours)
   * Impact: 🔥🔥 Important pour UX et sécurité
   *
   * Description:
   * Tracker et gérer les sessions actives de chaque utilisateur.
   * Permettre de voir et révoquer les sessions depuis d'autres appareils.
   *
   * Fonctionnalités:
   * - Créer une session lors du login
   * - Stocker: device info, IP, user-agent, last activity
   * - Voir toutes les sessions actives (GraphQL query)
   * - Révoquer une session spécifique (logout autre appareil)
   * - Révoquer toutes les sessions sauf la courante
   * - Expiration automatique après inactivité (config: 7 jours)
   * - Limite de sessions simultanées par user (config: 5)
   *
   * GraphQL:
   * ```graphql
   * type Session {
   *   id: ID!
   *   deviceName: String
   *   ipAddress: String
   *   userAgent: String
   *   lastActivityAt: DateTime!
   *   createdAt: DateTime!
   *   isCurrent: Boolean!
   * }
   *
   * type Query {
   *   myActiveSessions: [Session!]!
   * }
   *
   * type Mutation {
   *   revokeSession(sessionId: ID!): Boolean!
   *   revokeAllSessions(exceptCurrent: Boolean): Boolean!
   * }
   * ```
   *
   * Base de données:
   * CREATE TABLE sessions (
   *   id VARCHAR(255) PRIMARY KEY,
   *   user_id INT NOT NULL,
   *   device_name VARCHAR(255),
   *   ip_address VARCHAR(45),
   *   user_agent TEXT,
   *   last_activity_at TIMESTAMP,
   *   created_at TIMESTAMP,
   *   expires_at TIMESTAMP,
   *   FOREIGN KEY (user_id) REFERENCES utilisateurs(id)
   * );
   */
  sessionManagement: {
    priority: 3,
    status: "⏳ TODO",
    effort: "3-4 jours",
    impact: "IMPORTANT",
    dependencies: [],
    files: [
      "core/services/session.service.ts",
      "core/resolvers/session.resolvers.ts",
      "__tests__/session.test.ts",
    ],
    dbChanges: ["Créer table sessions"],
  },

  /**
   * 4. REDIS POUR RATE LIMITING (PRODUCTION)
   * -----------------------------------------------
   * Status: ⏳ Préparé mais pas implémenté
   * Effort: 🟢 Facile (1-2 jours)
   * Impact: 🔥🔥 Critique pour production multi-instance
   *
   * Description:
   * Remplacer le store in-memory par Redis en production.
   * Nécessaire si vous avez plusieurs instances de l'API.
   *
   * Raison:
   * - In-memory ne partage pas les données entre instances
   * - Redis permet un rate limiting global
   * - Redis persiste les données (redémarrage = compteurs conservés)
   *
   * Implementation:
   * ```ts
   * import Redis from 'ioredis';
   *
   * class RedisRateLimitStore implements RateLimitStore {
   *   private client: Redis;
   *
   *   constructor() {
   *     this.client = new Redis({
   *       host: STORAGE_CONFIG.redis.host,
   *       port: STORAGE_CONFIG.redis.port,
   *       password: STORAGE_CONFIG.redis.password,
   *     });
   *   }
   *
   *   async get(key: string): Promise<RateLimitEntry | null> {
   *     const data = await this.client.get(key);
   *     return data ? JSON.parse(data) : null;
   *   }
   *
   *   async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
   *     await this.client.setex(key, Math.ceil(ttlMs / 1000), JSON.stringify(entry));
   *   }
   *
   *   async increment(key: string): Promise<number> {
   *     return await this.client.incr(key);
   *   }
   * }
   * ```
   *
   * Configuration:
   * - Installer: npm install ioredis
   * - Définir REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
   * - Définir RATE_LIMIT_STORE=redis
   */
  redisRateLimiting: {
    priority: 4,
    status: "⏳ TODO (préparé)",
    effort: "1-2 jours",
    impact: "CRITIQUE en production",
    dependencies: ["Redis installé"],
    files: ["core/services/rate-limit.service.ts (modifier)"],
    packages: ["ioredis", "@types/ioredis"],
  },
};

/**
 * ============================================================================
 * 🟡 PRIORITÉ MOYENNE (À faire ce trimestre)
 * ============================================================================
 */

export const MEDIUM_PRIORITY_IMPROVEMENTS = {
  /**
   * 5. REFRESH TOKEN ROTATION
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🟡 Moyen (2-3 jours)
   * Impact: 🔥🔥 Important pour sécurité
   *
   * Description:
   * Générer un nouveau refresh token à chaque utilisation.
   * Détecte le vol de token (token replay attack).
   *
   * Flow:
   * 1. Client envoie refresh token
   * 2. Serveur valide le token
   * 3. Serveur génère NOUVEAU access token + NOUVEAU refresh token
   * 4. Serveur invalide l'ancien refresh token
   * 5. Client stocke le nouveau refresh token
   *
   * Détection de vol:
   * - Si ancien token utilisé après rotation → token volé
   * - Révoquer TOUTES les sessions de l'utilisateur
   * - Notifier l'utilisateur par email
   *
   * Base de données:
   * CREATE TABLE refresh_tokens (
   *   id VARCHAR(255) PRIMARY KEY,
   *   user_id INT NOT NULL,
   *   token_hash VARCHAR(255) NOT NULL,
   *   parent_token_id VARCHAR(255) NULL,
   *   is_revoked BOOLEAN DEFAULT FALSE,
   *   expires_at TIMESTAMP,
   *   created_at TIMESTAMP
   * );
   */
  refreshTokenRotation: {
    priority: 5,
    status: "⏳ TODO",
    effort: "2-3 jours",
    impact: "IMPORTANT",
    dependencies: [],
    files: [
      "core/services/token-rotation.service.ts",
      "__tests__/token-rotation.test.ts",
    ],
    dbChanges: ["Créer table refresh_tokens"],
  },

  /**
   * 6. TWO-FACTOR AUTHENTICATION (2FA)
   * -----------------------------------------------
   * Status: ⏳ Préparé (config existe) mais pas implémenté
   * Effort: 🔴 Important (5-7 jours)
   * Impact: 🔥🔥🔥 Très important pour sécurité
   *
   * Description:
   * Ajouter une seconde couche de sécurité avec TOTP ou SMS.
   *
   * Méthodes supportées:
   * - TOTP (Google Authenticator, Authy) - RECOMMANDÉ
   * - SMS (via Twilio ou équivalent)
   * - Email (moins sécurisé mais facile)
   * - Backup codes (pour récupération)
   *
   * Flow TOTP:
   * 1. User active 2FA dans settings
   * 2. Serveur génère secret TOTP
   * 3. Afficher QR code (via qrcode npm package)
   * 4. User scanne avec app (Google Authenticator)
   * 5. User entre code pour confirmer
   * 6. Générer backup codes (10 codes à usage unique)
   * 7. Au login, demander code TOTP après password
   *
   * GraphQL:
   * ```graphql
   * type TwoFactorSetup {
   *   secret: String!
   *   qrCodeUrl: String!
   *   backupCodes: [String!]!
   * }
   *
   * type Mutation {
   *   enableTwoFactor: TwoFactorSetup!
   *   verifyTwoFactor(code: String!): Boolean!
   *   disableTwoFactor(code: String!): Boolean!
   *   regenerateBackupCodes(code: String!): [String!]!
   *   verifyTwoFactorLogin(code: String!): AuthResponse!
   * }
   * ```
   *
   * Base de données:
   * ALTER TABLE utilisateurs ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
   * ALTER TABLE utilisateurs ADD COLUMN two_factor_secret VARCHAR(255) NULL;
   * ALTER TABLE utilisateurs ADD COLUMN backup_codes TEXT NULL;
   */
  twoFactorAuth: {
    priority: 6,
    status: "⏳ TODO (préparé)",
    effort: "5-7 jours",
    impact: "TRÈS IMPORTANT",
    dependencies: [],
    files: [
      "core/services/two-factor.service.ts",
      "core/resolvers/two-factor.resolvers.ts",
      "core/middleware/two-factor.middleware.ts",
      "__tests__/two-factor.test.ts",
    ],
    packages: ["speakeasy", "qrcode", "@types/qrcode"],
    dbChanges: [
      "two_factor_enabled, two_factor_secret, backup_codes columns",
    ],
  },

  /**
   * 7. PASSWORD STRENGTH VALIDATION AMÉLIORÉE
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🟢 Facile (1 jour)
   * Impact: 🔥 Utile pour sécurité
   *
   * Description:
   * Améliorer la validation des mots de passe avec plus de règles.
   *
   * Règles actuelles (basiques):
   * - Longueur min/max
   * - Majuscules, minuscules, chiffres, caractères spéciaux
   *
   * Nouvelles règles:
   * - Vérifier contre liste de mots de passe communs (haveibeenpwned)
   * - Détecter patterns simples (123456, qwerty, password)
   * - Vérifier que le mot de passe ne contient pas l'email
   * - Vérifier que le mot de passe ne contient pas le nom/prénom
   * - Calculer entropie (force du mot de passe)
   * - Suggestions en temps réel (côté client)
   *
   * Librairies:
   * - zxcvbn (calcul de force)
   * - hibp (Have I Been Pwned API)
   *
   * Exemple:
   * ```ts
   * import zxcvbn from 'zxcvbn';
   * import { pwnedPassword } from 'hibp';
   *
   * export async function validatePasswordStrength(password: string, user: User) {
   *   // Vérifier force
   *   const strength = zxcvbn(password, [user.email, user.first_name, user.last_name]);
   *   if (strength.score < 3) {
   *     throw new WeakPasswordError('Mot de passe trop faible', strength.feedback.suggestions);
   *   }
   *
   *   // Vérifier si compromis
   *   const count = await pwnedPassword(password);
   *   if (count > 0) {
   *     throw new WeakPasswordError('Ce mot de passe a été compromis dans une fuite de données');
   *   }
   * }
   * ```
   */
  passwordStrengthValidation: {
    priority: 7,
    status: "⏳ TODO",
    effort: "1 jour",
    impact: "UTILE",
    dependencies: [],
    files: [
      "core/services/password-validator.service.ts",
      "__tests__/password-validator.test.ts",
    ],
    packages: ["zxcvbn", "hibp"],
  },

  /**
   * 8. EMAIL TEMPLATES AMÉLIORÉS
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🟡 Moyen (2-3 jours)
   * Impact: 🔥 Important pour UX
   *
   * Description:
   * Créer des templates d'emails professionnels et personnalisables.
   *
   * Templates à créer:
   * - Welcome email (inscription)
   * - Email verification
   * - Password reset
   * - Password changed (notification)
   * - Email changed (notification)
   * - 2FA enabled/disabled
   * - New login from unknown device
   * - Account locked
   * - Suspicious activity detected
   *
   * Technologies:
   * - Handlebars ou EJS pour templating
   * - MJML pour emails responsive
   * - Nodemailer pour envoi
   * - Preview avec Ethereal Email (dev)
   *
   * Structure:
   * templates/
   *   ├── welcome.hbs
   *   ├── verify-email.hbs
   *   ├── reset-password.hbs
   *   ├── password-changed.hbs
   *   └── layouts/
   *       └── base.hbs
   *
   * Personnalisation:
   * - Logo de l'entreprise
   * - Couleurs de la marque
   * - Footer avec liens (support, privacy policy, etc.)
   * - Variables dynamiques (nom, email, lien, etc.)
   */
  emailTemplates: {
    priority: 8,
    status: "⏳ TODO",
    effort: "2-3 jours",
    impact: "IMPORTANT pour UX",
    dependencies: [],
    files: [
      "core/services/email-template.service.ts",
      "templates/emails/",
      "__tests__/email-template.test.ts",
    ],
    packages: ["handlebars", "mjml", "nodemailer"],
  },
};

/**
 * ============================================================================
 * 🟢 PRIORITÉ BASSE (Nice to have - futur)
 * ============================================================================
 */

export const LOW_PRIORITY_IMPROVEMENTS = {
  /**
   * 9. IP WHITELIST POUR ADMINS
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🟢 Facile (1 jour)
   * Impact: 🔥 Utile pour sécurité avancée
   *
   * Description:
   * Permettre aux admins de se connecter uniquement depuis certaines IPs.
   * Utile pour restreindre l'accès admin au bureau/VPN.
   *
   * Fonctionnalités:
   * - Définir liste d'IPs autorisées par admin
   * - Vérifier IP lors du login
   * - Bloquer si IP non autorisée
   * - Email de notification si tentative depuis IP non autorisée
   * - Bypass possible avec code 2FA spécial
   *
   * Configuration:
   * - Par utilisateur (table utilisateurs)
   * - Ou global (variable d'environnement ADMIN_IP_WHITELIST)
   */
  ipWhitelist: {
    priority: 9,
    status: "⏳ TODO",
    effort: "1 jour",
    impact: "UTILE",
    dependencies: [],
    files: ["core/middleware/ip-whitelist.middleware.ts"],
    dbChanges: ["allowed_ips column dans utilisateurs"],
  },

  /**
   * 10. DEVICE FINGERPRINTING
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🟡 Moyen (2-3 jours)
   * Impact: 🔥 Utile pour sécurité
   *
   * Description:
   * Identifier les appareils de manière unique pour détecter nouveaux devices.
   *
   * Données collectées:
   * - User-agent
   * - IP address
   * - Screen resolution
   * - Timezone
   * - Language
   * - Browser plugins
   * - Canvas fingerprint
   *
   * Utilisation:
   * - Détecter nouveau device au login
   * - Email de notification: "Connexion depuis nouvel appareil"
   * - Option "Trust this device" (ne plus notifier)
   * - Liste des devices connus dans settings
   *
   * Librairie:
   * - FingerprintJS (côté client)
   */
  deviceFingerprinting: {
    priority: 10,
    status: "⏳ TODO",
    effort: "2-3 jours",
    impact: "UTILE",
    dependencies: [],
    files: [
      "core/services/device-fingerprint.service.ts",
      "__tests__/device-fingerprint.test.ts",
    ],
    packages: ["@fingerprintjs/fingerprintjs"],
    dbChanges: ["Créer table trusted_devices"],
  },

  /**
   * 11. CAPTCHA APRÈS X TENTATIVES
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🟢 Facile (1-2 jours)
   * Impact: 🔥 Utile contre bots
   *
   * Description:
   * Afficher un CAPTCHA après plusieurs tentatives de login échouées.
   * Complément au rate limiting.
   *
   * Services:
   * - reCAPTCHA v3 (invisible, score-based)
   * - hCaptcha (alternative privacy-friendly)
   * - Turnstile Cloudflare (gratuit, privacy-friendly)
   *
   * Flow:
   * 1. Après 3 tentatives échouées, demander CAPTCHA
   * 2. Vérifier token CAPTCHA côté serveur
   * 3. Autoriser login seulement si CAPTCHA valide
   *
   * GraphQL:
   * ```graphql
   * input LoginInput {
   *   email: String!
   *   password: String!
   *   captchaToken: String  # Optionnel, requis après X tentatives
   * }
   * ```
   */
  captcha: {
    priority: 11,
    status: "⏳ TODO",
    effort: "1-2 jours",
    impact: "UTILE contre bots",
    dependencies: [],
    files: [
      "core/services/captcha.service.ts",
      "core/middleware/captcha.middleware.ts",
    ],
    packages: ["@hcaptcha/react-hcaptcha (frontend)"],
  },

  /**
   * 12. SUSPICIOUS ACTIVITY DETECTION
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🔴 Important (4-5 jours)
   * Impact: 🔥🔥 Important pour sécurité avancée
   *
   * Description:
   * Détecter automatiquement les comportements suspects.
   *
   * Critères de suspicion:
   * - Login depuis pays inhabituel
   * - Login à horaires inhabituels (3h du matin)
   * - Trop de requêtes en peu de temps
   * - Changement soudain de mot de passe + email
   * - Accès à données sensibles inhabituel
   * - Pattern de bot (requêtes trop régulières)
   *
   * Actions automatiques:
   * - Email de notification à l'utilisateur
   * - Demander 2FA même si pas activé habituellement
   * - Bloquer temporairement si score trop élevé
   * - Alerter admins/équipe sécurité
   *
   * ML (futur):
   * - Utiliser machine learning pour détecter anomalies
   * - Apprentissage du comportement normal de chaque user
   */
  suspiciousActivityDetection: {
    priority: 12,
    status: "⏳ TODO",
    effort: "4-5 jours",
    impact: "IMPORTANT",
    dependencies: ["Audit logging"],
    files: [
      "core/services/suspicious-activity.service.ts",
      "core/middleware/suspicious-activity.middleware.ts",
    ],
  },

  /**
   * 13. WEBHOOKS POUR ÉVÉNEMENTS DE SÉCURITÉ
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🟡 Moyen (2-3 jours)
   * Impact: 🔥 Utile pour intégrations
   *
   * Description:
   * Envoyer des webhooks pour intégration avec autres systèmes (Slack, Discord, etc.).
   *
   * Événements:
   * - USER_REGISTERED
   * - USER_LOGIN
   * - USER_LOGOUT
   * - PASSWORD_CHANGED
   * - ACCOUNT_LOCKED
   * - RATE_LIMIT_EXCEEDED
   * - SUSPICIOUS_ACTIVITY_DETECTED
   * - TWO_FACTOR_ENABLED
   *
   * Exemple payload:
   * ```json
   * {
   *   "event": "ACCOUNT_LOCKED",
   *   "timestamp": "2024-01-15T10:30:00Z",
   *   "user": {
   *     "id": 123,
   *     "email": "user@example.com"
   *   },
   *   "metadata": {
   *     "reason": "Too many failed login attempts",
   *     "locked_until": "2024-01-15T11:30:00Z"
   *   }
   * }
   * ```
   *
   * Configuration:
   * - URLs de webhooks par événement
   * - Retry policy (3 tentatives avec backoff)
   * - Signature HMAC pour sécurité
   */
  webhooks: {
    priority: 13,
    status: "⏳ TODO",
    effort: "2-3 jours",
    impact: "UTILE pour intégrations",
    dependencies: [],
    files: [
      "core/services/webhook.service.ts",
      "__tests__/webhook.test.ts",
    ],
  },

  /**
   * 14. ADMIN DASHBOARD POUR SÉCURITÉ
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🔴 Important (7-10 jours)
   * Impact: 🔥🔥 Très utile pour admins
   *
   * Description:
   * Interface admin pour monitorer et gérer la sécurité.
   *
   * Fonctionnalités:
   * - Vue d'ensemble: tentatives de login, rate limits, account lockouts
   * - Liste des utilisateurs avec status (locked, 2FA enabled, etc.)
   * - Logs d'audit avec filtres et recherche
   * - Graphiques: tentatives par heure, IPs, etc.
   * - Actions: débloquer compte, révoquer sessions, reset password
   * - Alertes en temps réel (WebSocket)
   * - Export de rapports (PDF, CSV)
   *
   * Technologies:
   * - React + Material-UI ou Ant Design
   * - Charts: Recharts ou Chart.js
   * - WebSocket pour real-time
   *
   * GraphQL Queries:
   * ```graphql
   * type Query {
   *   securityDashboard: SecurityStats!
   *   auditLogs(filters: AuditLogFilters): [AuditLog!]!
   *   suspiciousActivities: [SuspiciousActivity!]!
   *   lockedAccounts: [User!]!
   * }
   *
   * type Mutation {
   *   unlockAccount(userId: ID!): Boolean!
   *   revokeAllUserSessions(userId: ID!): Boolean!
   *   forcePasswordReset(userId: ID!): Boolean!
   * }
   * ```
   */
  adminDashboard: {
    priority: 14,
    status: "⏳ TODO",
    effort: "7-10 jours",
    impact: "TRÈS UTILE",
    dependencies: ["Audit logging", "Session management"],
    files: [
      "core/resolvers/admin-security.resolvers.ts",
      "Frontend: pages/admin/security/",
    ],
  },

  /**
   * 15. OAUTH / SOCIAL LOGIN
   * -----------------------------------------------
   * Status: ⏳ À faire
   * Effort: 🔴 Important (5-7 jours)
   * Impact: 🔥🔥 Important pour UX
   *
   * Description:
   * Permettre login avec Google, Facebook, GitHub, etc.
   *
   * Providers:
   * - Google (recommandé)
   * - Facebook
   * - GitHub
   * - Microsoft
   * - Apple
   *
   * Flow OAuth 2.0:
   * 1. User clique "Login with Google"
   * 2. Redirect vers Google OAuth
   * 3. User autorise l'app
   * 4. Google redirect avec code
   * 5. Échanger code contre access token
   * 6. Récupérer infos user depuis Google API
   * 7. Créer/lier compte utilisateur
   * 8. Générer JWT et session
   *
   * Librairies:
   * - Passport.js avec strategies (passport-google-oauth20, etc.)
   * - NextAuth.js (si Next.js frontend)
   *
   * Base de données:
   * CREATE TABLE oauth_accounts (
   *   id INT PRIMARY KEY AUTO_INCREMENT,
   *   user_id INT NOT NULL,
   *   provider VARCHAR(50) NOT NULL,
   *   provider_account_id VARCHAR(255) NOT NULL,
   *   access_token TEXT,
   *   refresh_token TEXT,
   *   expires_at TIMESTAMP,
   *   UNIQUE(provider, provider_account_id)
   * );
   */
  oauthSocialLogin: {
    priority: 15,
    status: "⏳ TODO",
    effort: "5-7 jours",
    impact: "IMPORTANT pour UX",
    dependencies: [],
    files: [
      "core/services/oauth.service.ts",
      "core/resolvers/oauth.resolvers.ts",
      "core/routes/oauth.routes.ts",
    ],
    packages: ["passport", "passport-google-oauth20"],
    dbChanges: ["Créer table oauth_accounts"],
  },
};

/**
 * ============================================================================
 * 📊 RÉSUMÉ PAR CATÉGORIE
 * ============================================================================
 */

export const IMPROVEMENTS_BY_CATEGORY = {
  sécurité: [
    "Account Lockout Progressif",
    "Audit Logging",
    "Refresh Token Rotation",
    "Two-Factor Authentication",
    "Password Strength Validation",
    "IP Whitelist",
    "Device Fingerprinting",
    "CAPTCHA",
    "Suspicious Activity Detection",
  ],

  infrastructure: [
    "Redis pour Rate Limiting",
    "Session Management",
    "Webhooks",
  ],

  ux: [
    "Email Templates Améliorés",
    "OAuth / Social Login",
  ],

  admin: ["Admin Dashboard pour Sécurité"],
} as const;

/**
 * ============================================================================
 * 🎯 ROADMAP RECOMMANDÉ (Ordre d'implémentation)
 * ============================================================================
 */

export const RECOMMENDED_ROADMAP = {
  semaine1: {
    titre: "Sécurité de base",
    items: ["Account Lockout Progressif", "Redis pour Rate Limiting"],
    effort: "4-5 jours",
  },

  semaine2_3: {
    titre: "Compliance & Monitoring",
    items: ["Audit Logging", "Session Management"],
    effort: "5-8 jours",
  },

  semaine4_5: {
    titre: "Sécurité avancée",
    items: ["Refresh Token Rotation", "Password Strength Validation"],
    effort: "3-4 jours",
  },

  mois2: {
    titre: "UX & 2FA",
    items: ["Email Templates Améliorés", "Two-Factor Authentication"],
    effort: "7-10 jours",
  },

  mois3: {
    titre: "Détection & Admin",
    items: ["Suspicious Activity Detection", "Admin Dashboard"],
    effort: "11-15 jours",
  },

  futur: {
    titre: "Nice to have",
    items: [
      "IP Whitelist",
      "Device Fingerprinting",
      "CAPTCHA",
      "Webhooks",
      "OAuth / Social Login",
    ],
    effort: "Variable",
  },
} as const;

/**
 * ============================================================================
 * 💡 RECOMMANDATIONS
 * ============================================================================
 */

export const RECOMMENDATIONS = `
╔══════════════════════════════════════════════════════════════════════════╗
║                    💡 MES RECOMMANDATIONS                                ║
╚══════════════════════════════════════════════════════════════════════════╝

🔥 À FAIRE EN PRIORITÉ (cette semaine/ce mois):

1. Account Lockout Progressif (2-3 jours)
   → Critique pour sécurité
   → Complément essentiel au rate limiting
   → Facile à implémenter (config déjà prête)

2. Redis pour Rate Limiting (1-2 jours)
   → OBLIGATOIRE si production multi-instance
   → Code déjà préparé, juste à implémenter
   → Améliore considérablement la fiabilité

3. Audit Logging (2-4 jours)
   → Essentiel pour conformité (RGPD)
   → Critique pour investigation en cas d'incident
   → Base pour toutes les fonctionnalités de monitoring

🟡 MOYEN TERME (ce trimestre):

4. Session Management (3-4 jours)
   → Améliore beaucoup l'UX
   → Permet de révoquer sessions (sécurité)
   → Base pour device tracking

5. Two-Factor Authentication (5-7 jours)
   → Standard de l'industrie
   → Attendu par les utilisateurs avancés
   → Gros boost de sécurité

6. Email Templates Améliorés (2-3 jours)
   → Améliore perception professionnelle
   → Meilleure communication avec users
   → Relativement facile

🟢 LONG TERME (quand tout le reste est fait):

7. Admin Dashboard + Suspicious Activity Detection
   → Très utile mais demande du temps
   → Dépend d'autres features (audit logs, sessions)

8. OAuth / Social Login
   → Nice to have pour UX
   → Mais pas critique

╔══════════════════════════════════════════════════════════════════════════╗
║  PRIORITÉ #1 : Account Lockout + Redis + Audit Logging                 ║
║  Ces 3 features forment la base solide pour la suite                    ║
╚══════════════════════════════════════════════════════════════════════════╝
`;

console.log(RECOMMENDATIONS);

export default {
  HIGH_PRIORITY_IMPROVEMENTS,
  MEDIUM_PRIORITY_IMPROVEMENTS,
  LOW_PRIORITY_IMPROVEMENTS,
  IMPROVEMENTS_BY_CATEGORY,
  RECOMMENDED_ROADMAP,
  RECOMMENDATIONS,
};
