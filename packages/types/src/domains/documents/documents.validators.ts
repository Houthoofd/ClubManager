import { z } from 'zod';

/**
 * documents
 */
export const documentsSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  file_url: z.string(),
  file_name: z.string(),
  file_type: z.string().nullable().optional(), // Type MIME du fichier
  file_size: z.number().nullable().optional(), // Taille en octets
  category: z.enum(["rulebook", "photo", "video", "form", "certificate", "other"]).nullable().optional(),
  visibility: z.enum(["public", "members", "instructors", "admins"]).nullable().optional(),
  uploaded_by: z.number(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const documentsCreateSchema = documentsSchema.omit({ id: true, created_at: true, updated_at: true });

export const documentsUpdateSchema = documentsSchema.partial().omit({ id: true });


