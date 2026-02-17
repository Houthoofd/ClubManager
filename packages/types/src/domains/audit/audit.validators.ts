import { z } from 'zod';

/**
 * audit_logs
 */
export const auditLogsSchema = z.object({
  id: z.number(),
  user_id: z.number().nullable().optional(),
  action: z.string(), // Action effectuée (create, update, delete, login, etc.)
  entity_type: z.string().nullable().optional(), // Type d'entité concernée (user, order, session, etc.)
  entity_id: z.number().nullable().optional(), // ID de l'entité concernée
  description: z.string().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(), // Navigateur/appareil
  created_at: z.string().nullable().optional(),
});

export const auditLogsCreateSchema = auditLogsSchema.omit({ id: true, created_at: true });

export const auditLogsUpdateSchema = auditLogsSchema.partial().omit({ id: true });


