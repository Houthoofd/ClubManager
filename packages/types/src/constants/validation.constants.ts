/**
 * Constantes de validation partagées
 * Utilisées dans les schémas Zod et les contraintes DB
 */

// Regex pour validation email (compatible avec DB v4.2)
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Regex pour vérifier que le password est hashé (bcrypt ou argon2)
export const HASHED_PASSWORD_REGEX =
  /^(\$2[aby]\$[0-9]{2}\$.{53}|\$argon2(id|i|d)\$)/;

// Regex pour numéro de téléphone
export const PHONE_REGEX = /^(\+|00)?[0-9\s\-().]{8,20}$/;

// Regex pour format date ISO (YYYY-MM-DD)
export const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Regex pour nom/prénom (lettres, espaces, tirets, apostrophes)
export const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;

// Regex pour username (alphanumeric + underscore)
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

/**
 * Constantes de validation groupées par domaine
 */
export const VALIDATION_CONSTANTS = {
  // Contraintes utilisateur
  USER: {
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 100,
    },
    PASSWORD: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 255,
    },
    EMAIL: {
      MIN_LENGTH: 5,
      MAX_LENGTH: 255,
    },
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 100,
    },
    AGE: {
      MIN: 5, // Minimum 5 ans
      MAX: 120, // Maximum 120 ans
    },
  },

  // Contraintes tokens (email validation, password reset)
  TOKEN: {
    HASH_ALGORITHM: "sha256",
    EXPIRY: {
      EMAIL_VALIDATION: 24 * 60 * 60 * 1000, // 24 heures
      PASSWORD_RESET: 1 * 60 * 60 * 1000, // 1 heure
    },
  },

  // Contraintes pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Contraintes RGPD (soft delete)
  RGPD: {
    DELETION_REASON_MIN_LENGTH: 10,
    DELETION_REASON_MAX_LENGTH: 500,
  },
} as const;

// Messages d'erreur de validation
export const VALIDATION_ERRORS = {
  REQUIRED: "Ce champ est requis",
  INVALID_EMAIL: "Format email invalide",
  INVALID_PASSWORD: "Le mot de passe doit contenir au moins 8 caractères",
  INVALID_PHONE: "Format de téléphone invalide",
  INVALID_DATE: "Format de date invalide (YYYY-MM-DD)",
  INVALID_AGE: "Âge invalide (entre 5 et 120 ans)",
} as const;
