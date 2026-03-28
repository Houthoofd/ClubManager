/**
 * @fileoverview Custom Message Validators
 * @module @clubmanager/types/validators/messaging/custom-message
 *
 * Zod schemas for validating custom message templates for automated sending.
 *
 * DB Table: messages_personnalises
 * Columns: id, type_id, titre, contenu, actif, created_at, updated_at
 *
 * Business Rules:
 * - Title is required (1-255 chars)
 * - Content is required (1-65535 chars)
 * - type_id references types_messages_personnalises
 * - actif is boolean with default true
 * - Templates can be activated/deactivated
 * - Used for automated email/SMS sending
 */

import { z } from 'zod';
import {
  CUSTOM_MESSAGE_TITLE_MAX_LENGTH,
  CUSTOM_MESSAGE_TITLE_MIN_LENGTH,
  CUSTOM_MESSAGE_CONTENT_MIN_LENGTH,
  CUSTOM_MESSAGE_CONTENT_MAX_LENGTH,
  MESSAGING_DEFAULT_PAGE_SIZE,
  MESSAGING_MAX_PAGE_SIZE,
  MESSAGING_MIN_PAGE_SIZE,
  MESSAGING_DEFAULT_PAGE,
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
} from '../../constants/messaging.constants.js';
import { idSchema, idStringSchema, paginationSchema } from '../common/common.validators.js';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Base custom message schema with all fields
 */
export const customMessageBaseSchema = z.object({
  id: idSchema,
  type_id: idSchema,
  titre: z
    .string()
    .trim()
    .min(CUSTOM_MESSAGE_TITLE_MIN_LENGTH, {
      message: `Le titre doit contenir au moins ${CUSTOM_MESSAGE_TITLE_MIN_LENGTH} caractère`,
    })
    .max(CUSTOM_MESSAGE_TITLE_MAX_LENGTH, {
      message: `Le titre ne peut pas dépasser ${CUSTOM_MESSAGE_TITLE_MAX_LENGTH} caractères`,
    }),
  contenu: z
    .string()
    .trim()
    .min(CUSTOM_MESSAGE_CONTENT_MIN_LENGTH, {
      message: `Le contenu doit contenir au moins ${CUSTOM_MESSAGE_CONTENT_MIN_LENGTH} caractère`,
    })
    .max(CUSTOM_MESSAGE_CONTENT_MAX_LENGTH, {
      message: `Le contenu ne peut pas dépasser ${CUSTOM_MESSAGE_CONTENT_MAX_LENGTH} caractères`,
    }),
  actif: z.boolean().default(true),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable().optional(),
});

/**
 * Inferred TypeScript type for CustomMessage
 */
export type CustomMessage = z.infer<typeof customMessageBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new custom message template
 * Required: type_id, titre, contenu
 * Optional: actif (defaults to true)
 */
export const createCustomMessageSchema = customMessageBaseSchema.pick({
  type_id: true,
  titre: true,
  contenu: true,
  actif: true,
});

/**
 * Inferred TypeScript type for CreateCustomMessage
 */
export type CreateCustomMessage = z.infer<typeof createCustomMessageSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating a custom message template
 * All fields are optional except ID
 */
export const updateCustomMessageSchema = customMessageBaseSchema
  .pick({
    type_id: true,
    titre: true,
    contenu: true,
    actif: true,
  })
  .partial();

/**
 * Inferred TypeScript type for UpdateCustomMessage
 */
export type UpdateCustomMessage = z.infer<typeof updateCustomMessageSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing custom messages with filters
 */
export const listCustomMessagesSchema = paginationSchema.extend({
  type_id: idSchema.optional(),
  actif: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean())
    .optional(),
  search: z.string().trim().optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'titre', 'actif']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for ListCustomMessages query
 */
export type ListCustomMessagesQuery = z.infer<typeof listCustomMessagesSchema>;

/**
 * Schema for getting active custom messages by type
 */
export const activeCustomMessagesByTypeSchema = z.object({
  type_id: idSchema,
  sort_by: z.enum(['created_at', 'titre']).default('titre'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Inferred TypeScript type for ActiveCustomMessagesByType query
 */
export type ActiveCustomMessagesByTypeQuery = z.infer<typeof activeCustomMessagesByTypeSchema>;

/**
 * Schema for getting all active custom messages
 */
export const activeCustomMessagesSchema = paginationSchema.extend({
  type_id: idSchema.optional(),
  sort_by: z.enum(['created_at', 'titre']).default('titre'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Inferred TypeScript type for ActiveCustomMessages query
 */
export type ActiveCustomMessagesQuery = z.infer<typeof activeCustomMessagesSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating custom message ID as number
 */
export const customMessageIdSchema = idSchema;

/**
 * Schema for validating custom message ID as string (from params)
 */
export const customMessageIdStringSchema = idStringSchema;

/**
 * Schema for validating custom message ID in route params
 */
export const customMessageIdParamSchema = z.object({
  id: customMessageIdStringSchema,
});

/**
 * Inferred TypeScript type for custom message ID param
 */
export type CustomMessageIdParam = z.infer<typeof customMessageIdParamSchema>;

// ============================================================================
// ACTIVATION/DEACTIVATION SCHEMAS
// ============================================================================

/**
 * Schema for activating a custom message
 */
export const activateCustomMessageSchema = z.object({
  actif: z.literal(true),
});

/**
 * Inferred TypeScript type for ActivateCustomMessage
 */
export type ActivateCustomMessage = z.infer<typeof activateCustomMessageSchema>;

/**
 * Schema for deactivating a custom message
 */
export const deactivateCustomMessageSchema = z.object({
  actif: z.literal(false),
});

/**
 * Inferred TypeScript type for DeactivateCustomMessage
 */
export type DeactivateCustomMessage = z.infer<typeof deactivateCustomMessageSchema>;

/**
 * Schema for bulk activation/deactivation
 */
export const bulkToggleCustomMessagesSchema = z.object({
  message_ids: z
    .array(idSchema)
    .min(1, { message: 'Au moins un message doit être sélectionné' })
    .max(50, { message: 'Vous ne pouvez pas modifier plus de 50 messages à la fois' }),
  actif: z.boolean(),
});

/**
 * Inferred TypeScript type for BulkToggleCustomMessages
 */
export type BulkToggleCustomMessages = z.infer<typeof bulkToggleCustomMessagesSchema>;

// ============================================================================
// TEMPLATE VARIABLE SCHEMAS
// ============================================================================

/**
 * Schema for template variables (placeholders like {{nom}}, {{prenom}}, etc.)
 */
export const templateVariablesSchema = z.object({
  variables: z.array(z.string()).min(0),
  exemple: z.record(z.string()).optional(),
});

/**
 * Inferred TypeScript type for TemplateVariables
 */
export type TemplateVariables = z.infer<typeof templateVariablesSchema>;

/**
 * Schema for rendering a template with data
 */
export const renderTemplateSchema = z.object({
  template_id: idSchema,
  data: z.record(z.unknown()),
});

/**
 * Inferred TypeScript type for RenderTemplate
 */
export type RenderTemplate = z.infer<typeof renderTemplateSchema>;

/**
 * Schema for rendered template result
 */
export const renderedTemplateSchema = z.object({
  titre: z.string(),
  contenu: z.string(),
  variables_used: z.array(z.string()),
  missing_variables: z.array(z.string()).optional(),
});

/**
 * Inferred TypeScript type for RenderedTemplate
 */
export type RenderedTemplate = z.infer<typeof renderedTemplateSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for custom message response (includes all fields)
 */
export const customMessageResponseSchema = customMessageBaseSchema;

/**
 * Inferred TypeScript type for CustomMessageResponse
 */
export type CustomMessageResponse = z.infer<typeof customMessageResponseSchema>;

/**
 * Schema for paginated custom messages list response
 */
export const customMessagesListResponseSchema = z.object({
  data: z.array(customMessageResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for CustomMessagesListResponse
 */
export type CustomMessagesListResponse = z.infer<typeof customMessagesListResponseSchema>;

/**
 * Schema for custom message statistics
 */
export const customMessageStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
  by_type: z.record(z.number().int().nonnegative()),
  most_used: z.array(customMessageResponseSchema).max(5),
});

/**
 * Inferred TypeScript type for CustomMessageStats
 */
export type CustomMessageStats = z.infer<typeof customMessageStatsSchema>;

/**
 * Schema for custom message preview
 */
export const customMessagePreviewSchema = z.object({
  id: idSchema,
  type_id: idSchema,
  type_name: z.string(),
  titre: z.string(),
  contenu_preview: z.string().max(200),
  actif: z.boolean(),
  variables: z.array(z.string()),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable().optional(),
});

/**
 * Inferred TypeScript type for CustomMessagePreview
 */
export type CustomMessagePreview = z.infer<typeof customMessagePreviewSchema>;
