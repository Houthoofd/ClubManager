import { z } from 'zod';

/**
 * genders
 */
export const gendersSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string().nullable().optional(),
});

export const gendersCreateSchema = gendersSchema.omit({ id: true });

export const gendersUpdateSchema = gendersSchema.partial().omit({ id: true });


/**
 * users
 */
export const usersSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  password: z.string(),
  phone: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  gender_id: z.number().nullable().optional(),
  role: z.enum(["admin", "instructor", "member"]).nullable().optional(), // admin=administrateur, instructor=enseignant/coach, member=adhérent
  active: z.boolean().nullable().optional(),
  email_verified: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const usersCreateSchema = usersSchema.omit({ id: true, created_at: true, updated_at: true });

export const usersUpdateSchema = usersSchema.partial().omit({ id: true });


/**
 * user_profiles
 */
export const userProfilesSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  bio: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional(),
  preferences: z.record(z.any()).nullable().optional(), // Préférences utilisateur en JSON (notifications, langue, etc.)
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const userProfilesCreateSchema = userProfilesSchema.omit({ id: true, created_at: true, updated_at: true });

export const userProfilesUpdateSchema = userProfilesSchema.partial().omit({ id: true });


/**
 * user_security
 */
export const userSecuritySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  failed_login_attempts: z.number().nullable().optional(),
  last_login_at: z.string().nullable().optional(),
  last_login_ip: z.string().nullable().optional(),
  account_locked_until: z.string().nullable().optional(),
  password_changed_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const userSecurityCreateSchema = userSecuritySchema.omit({ id: true, created_at: true, updated_at: true });

export const userSecurityUpdateSchema = userSecuritySchema.partial().omit({ id: true });


/**
 * password_reset_tokens
 */
export const passwordResetTokensSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  token: z.string(),
  expires_at: z.string(),
  used_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const passwordResetTokensCreateSchema = passwordResetTokensSchema.omit({ id: true, created_at: true });

export const passwordResetTokensUpdateSchema = passwordResetTokensSchema.partial().omit({ id: true });


/**
 * account_deletion_requests
 */
export const accountDeletionRequestsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  reason: z.string().nullable().optional(),
  status: z.enum(["pending", "approved", "rejected", "completed"]).nullable().optional(),
  requested_at: z.string().nullable().optional(),
  processed_at: z.string().nullable().optional(),
  processed_by: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const accountDeletionRequestsCreateSchema = accountDeletionRequestsSchema.omit({ id: true });

export const accountDeletionRequestsUpdateSchema = accountDeletionRequestsSchema.partial().omit({ id: true });


