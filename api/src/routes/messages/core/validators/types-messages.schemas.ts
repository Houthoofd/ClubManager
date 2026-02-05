import { z } from 'zod';

/**
 * Schéma de validation pour la création d'un type de message
 */
export const createTypeMessageSchema = z.object({
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(255, 'Le titre ne peut pas dépasser 255 caractères')
    .trim(),
  content: z.string()
    .min(1, 'Le contenu est requis')
    .trim(),
});

/**
 * Schéma de validation pour la modification d'un type de message
 */
export const updateTypeMessageSchema = z.object({
  title: z.string()
    .min(1, 'Le titre est requis')
    .max(255, 'Le titre ne peut pas dépasser 255 caractères')
    .trim()
    .optional(),
  content: z.string()
    .min(1, 'Le contenu est requis')
    .trim()
    .optional(),
}).refine(
  (data) => data.title !== undefined || data.content !== undefined,
  {
    message: 'Au moins un champ (title ou content) doit être fourni',
  }
);

/**
 * Schéma de validation pour l'ID d'un type de message
 */
export const typeMessageIdSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'L\'ID doit être un nombre valide')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'L\'ID doit être supérieur à 0'),
});

/**
 * Types TypeScript générés à partir des schémas Zod
 */
export type CreateTypeMessageInput = z.infer<typeof createTypeMessageSchema>;
export type UpdateTypeMessageInput = z.infer<typeof updateTypeMessageSchema>;
export type TypeMessageIdInput = z.infer<typeof typeMessageIdSchema>;
