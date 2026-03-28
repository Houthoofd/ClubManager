/**
 * @fileoverview Message Validators
 * @module @clubmanager/types/validators/messaging/message
 *
 * Zod schemas for validating messages between users.
 *
 * DB Table: messages
 * Columns: id, expediteur_id, destinataire_id, sujet, contenu, lu, date_lecture, created_at
 *
 * Business Rules:
 * - Subject is optional but if provided must be 1-255 chars
 * - Content is required (1-65535 chars)
 * - Sender and recipient must be different users
 * - Read status (lu) is boolean
 * - date_lecture is set when lu becomes true
 */

import { z } from 'zod';
import {
  MESSAGE_SUBJECT_MAX_LENGTH,
  MESSAGE_SUBJECT_MIN_LENGTH,
  MESSAGE_CONTENT_MIN_LENGTH,
  MESSAGE_CONTENT_MAX_LENGTH,
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
 * Base message schema with all fields
 */
export const messageBaseSchema = z.object({
  id: idSchema,
  expediteur_id: idSchema,
  destinataire_id: idSchema,
  sujet: z
    .string()
    .trim()
    .min(MESSAGE_SUBJECT_MIN_LENGTH, {
      message: `Le sujet doit contenir au moins ${MESSAGE_SUBJECT_MIN_LENGTH} caractère`,
    })
    .max(MESSAGE_SUBJECT_MAX_LENGTH, {
      message: `Le sujet ne peut pas dépasser ${MESSAGE_SUBJECT_MAX_LENGTH} caractères`,
    })
    .nullable()
    .optional(),
  contenu: z
    .string()
    .trim()
    .min(MESSAGE_CONTENT_MIN_LENGTH, {
      message: `Le contenu doit contenir au moins ${MESSAGE_CONTENT_MIN_LENGTH} caractère`,
    })
    .max(MESSAGE_CONTENT_MAX_LENGTH, {
      message: `Le contenu ne peut pas dépasser ${MESSAGE_CONTENT_MAX_LENGTH} caractères`,
    }),
  lu: z.boolean().default(false),
  date_lecture: z.coerce.date().nullable().optional(),
  created_at: z.coerce.date(),
});

/**
 * Inferred TypeScript type for Message
 */
export type Message = z.infer<typeof messageBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new message
 * Required: expediteur_id, destinataire_id, contenu
 * Optional: sujet
 */
export const createMessageSchema = messageBaseSchema
  .pick({
    expediteur_id: true,
    destinataire_id: true,
    sujet: true,
    contenu: true,
  })
  .refine((data) => data.expediteur_id !== data.destinataire_id, {
    message: "L'expéditeur et le destinataire doivent être différents",
    path: ['destinataire_id'],
  });

/**
 * Inferred TypeScript type for CreateMessage
 */
export type CreateMessage = z.infer<typeof createMessageSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating message read status
 * Only lu and date_lecture can be updated
 */
export const updateMessageSchema = z.object({
  lu: z.boolean().optional(),
  date_lecture: z.coerce.date().nullable().optional(),
});

/**
 * Inferred TypeScript type for UpdateMessage
 */
export type UpdateMessage = z.infer<typeof updateMessageSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing messages with filters
 */
export const listMessagesSchema = paginationSchema.extend({
  expediteur_id: idSchema.optional(),
  destinataire_id: idSchema.optional(),
  lu: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean())
    .optional(),
  sujet: z.string().trim().optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  sort_by: z.enum(['created_at', 'date_lecture', 'sujet']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for ListMessages query
 */
export type ListMessagesQuery = z.infer<typeof listMessagesSchema>;

/**
 * Schema for message inbox query (received messages)
 */
export const messageInboxSchema = paginationSchema.extend({
  lu: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean())
    .optional(),
  expediteur_id: idSchema.optional(),
  sort_by: z.enum(['created_at', 'date_lecture']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for MessageInbox query
 */
export type MessageInboxQuery = z.infer<typeof messageInboxSchema>;

/**
 * Schema for message outbox query (sent messages)
 */
export const messageOutboxSchema = paginationSchema.extend({
  destinataire_id: idSchema.optional(),
  sort_by: z.enum(['created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for MessageOutbox query
 */
export type MessageOutboxQuery = z.infer<typeof messageOutboxSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating message ID as number
 */
export const messageIdSchema = idSchema;

/**
 * Schema for validating message ID as string (from params)
 */
export const messageIdStringSchema = idStringSchema;

/**
 * Schema for validating message ID in route params
 */
export const messageIdParamSchema = z.object({
  id: messageIdStringSchema,
});

/**
 * Inferred TypeScript type for message ID param
 */
export type MessageIdParam = z.infer<typeof messageIdParamSchema>;

// ============================================================================
// BULK OPERATIONS SCHEMAS
// ============================================================================

/**
 * Schema for marking multiple messages as read
 */
export const bulkMarkReadSchema = z.object({
  message_ids: z
    .array(idSchema)
    .min(1, { message: 'Au moins un message doit être sélectionné' })
    .max(100, { message: 'Vous ne pouvez pas marquer plus de 100 messages à la fois' }),
});

/**
 * Inferred TypeScript type for BulkMarkRead
 */
export type BulkMarkRead = z.infer<typeof bulkMarkReadSchema>;

/**
 * Schema for deleting multiple messages
 */
export const bulkDeleteMessagesSchema = z.object({
  message_ids: z
    .array(idSchema)
    .min(1, { message: 'Au moins un message doit être sélectionné' })
    .max(100, { message: 'Vous ne pouvez pas supprimer plus de 100 messages à la fois' }),
});

/**
 * Inferred TypeScript type for BulkDeleteMessages
 */
export type BulkDeleteMessages = z.infer<typeof bulkDeleteMessagesSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for message response (includes all fields)
 */
export const messageResponseSchema = messageBaseSchema;

/**
 * Inferred TypeScript type for MessageResponse
 */
export type MessageResponse = z.infer<typeof messageResponseSchema>;

/**
 * Schema for paginated messages list response
 */
export const messagesListResponseSchema = z.object({
  data: z.array(messageResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for MessagesListResponse
 */
export type MessagesListResponse = z.infer<typeof messagesListResponseSchema>;

/**
 * Schema for message statistics
 */
export const messageStatsSchema = z.object({
  total_messages: z.number().int().nonnegative(),
  unread_messages: z.number().int().nonnegative(),
  sent_messages: z.number().int().nonnegative(),
  received_messages: z.number().int().nonnegative(),
});

/**
 * Inferred TypeScript type for MessageStats
 */
export type MessageStats = z.infer<typeof messageStatsSchema>;
