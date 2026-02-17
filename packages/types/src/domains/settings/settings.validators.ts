import { z } from 'zod';

/**
 * settings
 */
export const settingsSchema = z.object({
  id: z.number(),
  setting_key: z.string(),
  setting_value: z.string(),
  setting_type: z.enum(["string", "number", "boolean", "json"]).nullable().optional(),
  category: z.string().nullable().optional(), // Catégorie du paramètre
  description: z.string().nullable().optional(),
  is_public: z.boolean().nullable().optional(), // 1 si visible publiquement, 0 sinon
  updated_at: z.string().nullable().optional(),
});

export const settingsCreateSchema = settingsSchema.omit({ id: true, updated_at: true });

export const settingsUpdateSchema = settingsSchema.partial().omit({ id: true });


