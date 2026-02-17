import { z } from 'zod';

/**
 * membership_plans
 */
export const membershipPlansSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number(),
  duration_months: z.number().nullable().optional(),
  features: z.record(z.any()).nullable().optional(), // Avantages en JSON
  active: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const membershipPlansCreateSchema = membershipPlansSchema.omit({ id: true, created_at: true });

export const membershipPlansUpdateSchema = membershipPlansSchema.partial().omit({ id: true });


/**
 * memberships
 */
export const membershipsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  plan_id: z.number(),
  start_date: z.string(),
  end_date: z.string(),
  status: z.enum(["active", "expired", "cancelled", "suspended"]).nullable().optional(),
  auto_renew: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const membershipsCreateSchema = membershipsSchema.omit({ id: true, created_at: true });

export const membershipsUpdateSchema = membershipsSchema.partial().omit({ id: true });


/**
 * payments
 */
export const paymentsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  amount: z.number(),
  payment_method: z.enum(["cash", "card", "bank_transfer", "online", "check"]).nullable().optional(),
  payment_type: z.enum(["membership", "session", "product", "other"]).nullable().optional(),
  reference_id: z.number().nullable().optional(), // ID de référence (adhésion, session, commande, etc.)
  status: z.enum(["pending", "completed", "failed", "refunded"]).nullable().optional(),
  transaction_id: z.string().nullable().optional(), // ID de transaction externe
  payment_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const paymentsCreateSchema = paymentsSchema.omit({ id: true });

export const paymentsUpdateSchema = paymentsSchema.partial().omit({ id: true });


