import { z } from 'zod';

/**
 * event_types
 */
export const eventTypesSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(), // Couleur pour le calendrier
  icon: z.string().nullable().optional(),
});

export const eventTypesCreateSchema = eventTypesSchema.omit({ id: true });

export const eventTypesUpdateSchema = eventTypesSchema.partial().omit({ id: true });


/**
 * events
 */
export const eventsSchema = z.object({
  id: z.number(),
  event_type_id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: z.string(),
  end_date: z.string(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  max_participants: z.number().nullable().optional(), // NULL = illimité
  current_participants: z.number().nullable().optional(),
  registration_required: z.boolean().nullable().optional(),
  registration_deadline: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  image_url: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "cancelled", "completed"]).nullable().optional(),
  created_by: z.number(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const eventsCreateSchema = eventsSchema.omit({ id: true, created_at: true, updated_at: true });

export const eventsUpdateSchema = eventsSchema.partial().omit({ id: true });


/**
 * event_registrations
 */
export const eventRegistrationsSchema = z.object({
  id: z.number(),
  event_id: z.number(),
  user_id: z.number(),
  status: z.enum(["pending", "confirmed", "cancelled", "attended"]).nullable().optional(),
  payment_status: z.enum(["unpaid", "paid", "refunded"]).nullable().optional(),
  notes: z.string().nullable().optional(),
  registered_at: z.string().nullable().optional(),
});

export const eventRegistrationsCreateSchema = eventRegistrationsSchema.omit({ id: true });

export const eventRegistrationsUpdateSchema = eventRegistrationsSchema.partial().omit({ id: true });


