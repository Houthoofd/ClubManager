/**
 * Requêtes SQL de VALIDATION pour le module Compte
 * Responsabilité: Requêtes de vérification et validation uniquement
 */

// ============================================================================
// QUERIES DE VÉRIFICATION D'EXISTENCE
// ============================================================================

/**
 * Vérifier si un utilisateur existe
 */
export const CHECK_USER_EXISTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Vérifier si un email existe déjà
 */
export const CHECK_EMAIL_EXISTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE email = ? AND id != ?
`;

/**
 * Vérifier si un email existe (sans exclusion)
 */
export const CHECK_EMAIL_EXISTS_SIMPLE = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE email = ?
`;

/**
 * Vérifier si un nom d'utilisateur existe déjà
 */
export const CHECK_USERNAME_EXISTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE nom_utilisateur = ? AND id != ?
`;

/**
 * Vérifier si un nom d'utilisateur existe (sans exclusion)
 */
export const CHECK_USERNAME_EXISTS_SIMPLE = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE nom_utilisateur = ?
`;

/**
 * Vérifier si un utilisateur est actif
 */
export const CHECK_USER_IS_ACTIVE = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ? AND status_id = 1
`;

/**
 * Vérifier si un utilisateur a un mot de passe défini
 */
export const CHECK_USER_HAS_PASSWORD = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ? AND password IS NOT NULL AND password != ''
`;

// ============================================================================
// QUERIES DE VALIDATION DES RELATIONS
// ============================================================================

/**
 * Vérifier si un genre existe
 */
export const CHECK_GENRE_EXISTS = `
  SELECT COUNT(*) as count
  FROM genres
  WHERE id = ?
`;

/**
 * Vérifier si un grade existe
 */
export const CHECK_GRADE_EXISTS = `
  SELECT COUNT(*) as count
  FROM grades
  WHERE id = ?
`;

/**
 * Vérifier si un status existe
 */
export const CHECK_STATUS_EXISTS = `
  SELECT COUNT(*) as count
  FROM status
  WHERE id = ?
`;

/**
 * Vérifier si un plan tarifaire existe
 */
export const CHECK_PLAN_EXISTS = `
  SELECT COUNT(*) as count
  FROM plans_tarifaires
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE VALIDATION DE SÉCURITÉ
// ============================================================================

/**
 * Vérifier si un compte est verrouillé
 */
export const CHECK_ACCOUNT_LOCKED = `
  SELECT
    account_locked,
    locked_at,
    failed_login_attempts
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Obtenir le nombre de tentatives de connexion échouées
 */
export const GET_FAILED_LOGIN_ATTEMPTS = `
  SELECT
    failed_login_attempts,
    last_failed_login
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Vérifier si un compte doit être déverrouillé automatiquement
 */
export const CHECK_AUTO_UNLOCK_ELIGIBLE = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ?
    AND account_locked = 1
    AND locked_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
`;

/**
 * Vérifier si un utilisateur a trop de tentatives échouées
 */
export const CHECK_TOO_MANY_FAILED_ATTEMPTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ?
    AND failed_login_attempts >= ?
`;

// ============================================================================
// QUERIES DE VALIDATION MÉTIER
// ============================================================================

/**
 * Vérifier si un utilisateur peut être supprimé (pas de dépendances)
 */
export const CHECK_USER_CAN_BE_DELETED = `
  SELECT
    (SELECT COUNT(*) FROM commandes WHERE utilisateur_id = ?) as commandes_count,
    (SELECT COUNT(*) FROM alertes WHERE utilisateur_id = ?) as alertes_count
`;

/**
 * Vérifier si un utilisateur a des commandes en cours
 */
export const CHECK_USER_HAS_PENDING_ORDERS = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE utilisateur_id = ?
    AND statut IN ('en_attente', 'confirmee', 'en_preparation', 'expedie')
`;

/**
 * Vérifier si un email est valide (format basique)
 */
export const CHECK_EMAIL_FORMAT = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Vérifier si un nom d'utilisateur est valide
 */
export const CHECK_USERNAME_FORMAT = (username: string): boolean => {
  // Lettres, chiffres, tirets, underscores uniquement, 3-30 caractères
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
};

/**
 * Vérifier si un téléphone est valide (format français)
 */
export const CHECK_PHONE_FORMAT = (phone: string): boolean => {
  // Format français: +33, 0033 ou commence par 0
  const phoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[0-9]{8})$/;
  return phoneRegex.test(phone.replace(/[\s.-]/g, ''));
};

/**
 * Vérifier si une date de naissance est valide (âge >= 13 ans)
 */
export const CHECK_DATE_OF_BIRTH_VALID = `
  SELECT
    TIMESTAMPDIFF(YEAR, ?, CURDATE()) as age
`;

// ============================================================================
// QUERIES DE VALIDATION D'ABONNEMENT
// ============================================================================

/**
 * Vérifier si un abonnement est actif
 */
export const CHECK_SUBSCRIPTION_ACTIVE = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ?
    AND abonnement_id IS NOT NULL
    AND (subscription_end_date IS NULL OR subscription_end_date >= CURDATE())
`;

/**
 * Vérifier si un abonnement a expiré
 */
export const CHECK_SUBSCRIPTION_EXPIRED = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ?
    AND subscription_end_date IS NOT NULL
    AND subscription_end_date < CURDATE()
`;

/**
 * Obtenir les jours restants d'abonnement
 */
export const GET_SUBSCRIPTION_DAYS_REMAINING = `
  SELECT
    subscription_end_date,
    DATEDIFF(subscription_end_date, CURDATE()) as days_remaining
  FROM utilisateurs
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE VALIDATION D'INTÉGRITÉ
// ============================================================================

/**
 * Détecter les doublons d'email
 */
export const DETECT_DUPLICATE_EMAILS = `
  SELECT
    email,
    COUNT(*) as count,
    GROUP_CONCAT(id) as user_ids
  FROM utilisateurs
  WHERE email IS NOT NULL AND email != ''
  GROUP BY email
  HAVING count > 1
`;

/**
 * Détecter les doublons de nom d'utilisateur
 */
export const DETECT_DUPLICATE_USERNAMES = `
  SELECT
    nom_utilisateur,
    COUNT(*) as count,
    GROUP_CONCAT(id) as user_ids
  FROM utilisateurs
  WHERE nom_utilisateur IS NOT NULL AND nom_utilisateur != ''
  GROUP BY nom_utilisateur
  HAVING count > 1
`;

/**
 * Détecter les utilisateurs sans email
 */
export const DETECT_USERS_WITHOUT_EMAIL = `
  SELECT id, first_name, last_name, nom_utilisateur
  FROM utilisateurs
  WHERE email IS NULL OR email = ''
  LIMIT ?
`;

/**
 * Détecter les utilisateurs avec des relations invalides
 */
export const DETECT_INVALID_RELATIONS = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    CASE
      WHEN u.genre_id IS NOT NULL AND g.id IS NULL THEN 'invalid_genre'
      WHEN u.status_id IS NOT NULL AND s.id IS NULL THEN 'invalid_status'
      WHEN u.grade_id IS NOT NULL AND gr.id IS NULL THEN 'invalid_grade'
      WHEN u.abonnement_id IS NOT NULL AND a.id IS NULL THEN 'invalid_abonnement'
    END as invalid_relation
  FROM utilisateurs u
  LEFT JOIN genres g ON u.genre_id = g.id
  LEFT JOIN status s ON u.status_id = s.id
  LEFT JOIN grades gr ON u.grade_id = gr.id
  LEFT JOIN plans_tarifaires a ON u.abonnement_id = a.id
  WHERE (u.genre_id IS NOT NULL AND g.id IS NULL)
     OR (u.status_id IS NOT NULL AND s.id IS NULL)
     OR (u.grade_id IS NOT NULL AND gr.id IS NULL)
     OR (u.abonnement_id IS NOT NULL AND a.id IS NULL)
  LIMIT ?
`;

// ============================================================================
// QUERIES DE VALIDATION DE QUALITÉ DES DONNÉES
// ============================================================================

/**
 * Vérifier la qualité du profil (complétude)
 */
export const CHECK_PROFILE_COMPLETENESS = `
  SELECT
    id,
    CASE
      WHEN first_name IS NOT NULL THEN 1 ELSE 0 END +
      WHEN last_name IS NOT NULL THEN 1 ELSE 0 END +
      WHEN email IS NOT NULL AND email != '' THEN 1 ELSE 0 END +
      WHEN phone IS NOT NULL AND phone != '' THEN 1 ELSE 0 END +
      WHEN date_of_birth IS NOT NULL THEN 1 ELSE 0 END +
      WHEN genre_id IS NOT NULL THEN 1 ELSE 0 END +
      WHEN nom_utilisateur IS NOT NULL AND nom_utilisateur != '' THEN 1 ELSE 0 END
    AS completeness_score,
    7 as total_fields,
    ROUND((CASE
      WHEN first_name IS NOT NULL THEN 1 ELSE 0 END +
      WHEN last_name IS NOT NULL THEN 1 ELSE 0 END +
      WHEN email IS NOT NULL AND email != '' THEN 1 ELSE 0 END +
      WHEN phone IS NOT NULL AND phone != '' THEN 1 ELSE 0 END +
      WHEN date_of_birth IS NOT NULL THEN 1 ELSE 0 END +
      WHEN genre_id IS NOT NULL THEN 1 ELSE 0 END +
      WHEN nom_utilisateur IS NOT NULL AND nom_utilisateur != '' THEN 1 ELSE 0 END
    ) / 7 * 100) as completeness_percentage
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Obtenir les utilisateurs avec des profils incomplets
 */
export const GET_INCOMPLETE_PROFILES = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    CASE WHEN u.first_name IS NULL THEN 1 ELSE 0 END as missing_first_name,
    CASE WHEN u.last_name IS NULL THEN 1 ELSE 0 END as missing_last_name,
    CASE WHEN u.email IS NULL OR u.email = '' THEN 1 ELSE 0 END as missing_email,
    CASE WHEN u.phone IS NULL OR u.phone = '' THEN 1 ELSE 0 END as missing_phone,
    CASE WHEN u.date_of_birth IS NULL THEN 1 ELSE 0 END as missing_date_of_birth,
    CASE WHEN u.genre_id IS NULL THEN 1 ELSE 0 END as missing_genre
  FROM utilisateurs u
  WHERE u.status_id = 1
    AND (
      u.first_name IS NULL
      OR u.last_name IS NULL
      OR u.email IS NULL OR u.email = ''
      OR u.phone IS NULL OR u.phone = ''
      OR u.date_of_birth IS NULL
      OR u.genre_id IS NULL
    )
  LIMIT ?
`;
