/**
 * Validateurs Zod pour le domaine Sessions
 * Schémas de validation des données
 *
 * @module sessions/validators
 */

import { z } from "zod";

// ============================================================================
// SESSION SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour Session
 */
export const SessionSchema = z.object({
  id: z.string().cuid(),
  token: z.string().min(1).max(255),
  user_id: z.number().int().positive(),
  ip_address: z.string().ip().max(45).nullable().optional(),
  user_agent: z.string().max(1000).nullable().optional(),
  device_type: z.string().max(50).nullable().optional(),
  browser: z.string().max(50).nullable().optional(),
  os: z.string().max(50).nullable().optional(),
  is_active: z.boolean().default(true),
  last_activity_at: z.date(),
  expires_at: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
});

/**
 * Schéma de validation pour CreateSessionInput
 */
export const CreateSessionInputSchema = z
  .object({
    user_id: z.number().int().positive(),
    ip_address: z.string().ip().max(45).optional(),
    user_agent: z.string().max(1000).trim().optional(),
    device_type: z
      .string()
      .max(50)
      .trim()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          return ["desktop", "mobile", "tablet", "other"].includes(
            val.toLowerCase(),
          );
        },
        {
          message: "device_type doit être: desktop, mobile, tablet ou other",
        },
      ),
    browser: z.string().max(50).trim().optional(),
    os: z.string().max(50).trim().optional(),
    expires_at: z.coerce.date(),
  })
  .refine(
    (data) => {
      const now = new Date();
      return data.expires_at > now;
    },
    {
      message: "expires_at doit être dans le futur",
      path: ["expires_at"],
    },
  );

/**
 * Schéma de validation pour UpdateSessionInput
 */
export const UpdateSessionInputSchema = z.object({
  is_active: z.boolean().optional(),
  last_activity_at: z.coerce.date().optional(),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour GetSessionsInput
 */
export const GetSessionsInputSchema = z.object({
  user_id: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
  include_user: z.boolean().default(false),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

/**
 * Schéma de validation pour GetSessionByTokenInput
 */
export const GetSessionByTokenInputSchema = z.object({
  token: z.string().min(1).max(255),
  include_user: z.boolean().default(false),
});

/**
 * Schéma de validation pour CleanupExpiredSessionsInput
 */
export const CleanupExpiredSessionsInputSchema = z.object({
  before_date: z.coerce
    .date()
    .optional()
    .default(() => new Date()),
});

// ============================================================================
// TOKEN VALIDATION
// ============================================================================

/**
 * Schéma pour valider un token de session
 */
export const SessionTokenSchema = z
  .string()
  .min(32, "Le token doit contenir au moins 32 caractères")
  .max(255, "Le token ne peut pas dépasser 255 caractères");

/**
 * Schéma pour valider un ID de session (CUID)
 */
export const SessionIdSchema = z.string().cuid("ID de session invalide");

// ============================================================================
// DEVICE FINGERPRINT SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour les informations d'appareil
 */
export const DeviceFingerprintSchema = z.object({
  device_type: z.enum(["desktop", "mobile", "tablet", "other"]).optional(),
  browser: z.string().max(50).optional(),
  os: z.string().max(50).optional(),
  user_agent: z.string().max(1000).optional(),
});

// ============================================================================
// SESSION DURATION SCHEMAS
// ============================================================================

/**
 * Schéma pour calculer la durée d'une session (en minutes)
 */
export const SessionDurationSchema = z.object({
  session_id: z.string().cuid(),
  duration_minutes: z.number().int().min(0).max(43200), // Max 30 jours
});

// ============================================================================
// BATCH OPERATIONS SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour révoquer plusieurs sessions
 */
export const RevokeMultipleSessionsSchema = z.object({
  user_id: z.number().int().positive(),
  except_session_id: z.string().cuid().optional(),
});

/**
 * Schéma de validation pour prolonger une session
 */
export const ExtendSessionSchema = z
  .object({
    session_id: z.string().cuid(),
    extend_by_minutes: z.number().int().positive().max(1440).default(60), // Max 24h, default 1h
  })
  .transform((data) => ({
    session_id: data.session_id,
    new_expires_at: new Date(Date.now() + data.extend_by_minutes * 60 * 1000),
  }));

// ============================================================================
// STATISTICS SCHEMAS
// ============================================================================

/**
 * Schéma de validation pour les statistiques de sessions
 */
export const SessionStatsQuerySchema = z.object({
  user_id: z.number().int().positive().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  group_by: z.enum(["device", "browser", "os", "day"]).default("device"),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Valide si une session est encore valide
 */
export const isSessionValid = (expiresAt: Date): boolean => {
  return expiresAt > new Date();
};

/**
 * Calcule le temps restant avant expiration (en minutes)
 */
export const getTimeUntilExpiration = (expiresAt: Date): number => {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.floor(diff / 1000 / 60); // Convert to minutes
};

/**
 * Génère une date d'expiration par défaut (24h)
 */
export const getDefaultExpirationDate = (): Date => {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
};
