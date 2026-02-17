import { z } from 'zod';

/**
 * user_consents
 */
export const userConsentsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  consent_type: z.enum(["photos", "newsletter", "data_processing", "marketing", "third_party"]),
  consent_given: z.boolean().optional(),
  consent_text: z.string().nullable().optional(), // Texte du consentement au moment de l'acceptation
  given_at: z.string().nullable().optional(),
  withdrawn_at: z.string().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const userConsentsCreateSchema = userConsentsSchema.omit({ id: true, created_at: true, updated_at: true });

export const userConsentsUpdateSchema = userConsentsSchema.partial().omit({ id: true });


