import { z } from 'zod';

/**
 * instructors
 */
export const instructorsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  specialization: z.string().nullable().optional(), // Spécialité de l'instructeur
  bio: z.string().nullable().optional(),
  certifications: z.string().nullable().optional(), // Certifications et qualifications
  active: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const instructorsCreateSchema = instructorsSchema.omit({ id: true, created_at: true });

export const instructorsUpdateSchema = instructorsSchema.partial().omit({ id: true });


/**
 * session_types
 */
export const sessionTypesSchema = z.object({
  id: z.number(),
  activity_id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  max_participants: z.number().nullable().optional(), // NULL = illimité
  price: z.number().nullable().optional(),
  active: z.boolean().nullable().optional(),
});

export const sessionTypesCreateSchema = sessionTypesSchema.omit({ id: true });

export const sessionTypesUpdateSchema = sessionTypesSchema.partial().omit({ id: true });


/**
 * sessions
 */
export const sessionsSchema = z.object({
  id: z.number(),
  session_type_id: z.number(),
  instructor_id: z.number(),
  date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  location: z.string().nullable().optional(), // Lieu de la session (salle, terrain, etc.)
  max_participants: z.number().nullable().optional(),
  current_participants: z.number().nullable().optional(),
  status: z.enum(["scheduled", "ongoing", "completed", "cancelled"]).nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const sessionsCreateSchema = sessionsSchema.omit({ id: true, created_at: true });

export const sessionsUpdateSchema = sessionsSchema.partial().omit({ id: true });


/**
 * session_enrollments
 */
export const sessionEnrollmentsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  session_id: z.number(),
  status: z.enum(["pending", "confirmed", "attended", "absent", "cancelled"]).nullable().optional(),
  enrolled_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const sessionEnrollmentsCreateSchema = sessionEnrollmentsSchema.omit({ id: true });

export const sessionEnrollmentsUpdateSchema = sessionEnrollmentsSchema.partial().omit({ id: true });


