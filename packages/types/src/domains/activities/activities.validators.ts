import { z } from 'zod';

/**
 * activity_categories
 */
export const activityCategoriesSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const activityCategoriesCreateSchema = activityCategoriesSchema.omit({ id: true, created_at: true });

export const activityCategoriesUpdateSchema = activityCategoriesSchema.partial().omit({ id: true });


/**
 * activities
 */
export const activitiesSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  has_levels: z.boolean().nullable().optional(), // Indique si cette activité a des niveaux/grades
  active: z.boolean().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const activitiesCreateSchema = activitiesSchema.omit({ id: true, created_at: true });

export const activitiesUpdateSchema = activitiesSchema.partial().omit({ id: true });


/**
 * activity_levels
 */
export const activityLevelsSchema = z.object({
  id: z.number(),
  activity_id: z.number(),
  name: z.string(), // Ex: Débutant, Intermédiaire, Avancé OU Ceinture blanche, jaune, etc.
  level_order: z.number(), // Ordre du niveau (1=débutant, 2=intermédiaire, etc.)
  color: z.string().nullable().optional(), // Couleur associée (pour ceintures, badges, etc.)
  description: z.string().nullable().optional(),
});

export const activityLevelsCreateSchema = activityLevelsSchema.omit({ id: true });

export const activityLevelsUpdateSchema = activityLevelsSchema.partial().omit({ id: true });


/**
 * user_activities
 */
export const userActivitiesSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  activity_id: z.number(),
  current_level_id: z.number().nullable().optional(),
  started_at: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(), // Notes spécifiques à cette pratique
  created_at: z.string().nullable().optional(),
});

export const userActivitiesCreateSchema = userActivitiesSchema.omit({ id: true, created_at: true });

export const userActivitiesUpdateSchema = userActivitiesSchema.partial().omit({ id: true });


