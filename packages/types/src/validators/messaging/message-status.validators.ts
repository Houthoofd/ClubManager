/**
 * @fileoverview Message Status Validators
 * @module @clubmanager/types/validators/messaging/message-status
 *
 * Zod schemas for validating message status lookup table.
 *
 * DB Table: message_status
 * Columns: id, nom
 *
 * Business Rules:
 * - Name is required and unique (1-50 chars)
 * - This is a lookup table for message statuses
 * - Used to categorize message states beyond simple read/unread
 */

import { z } from 'zod';
import {
  MESSAGE_STATUS_NAME_MAX_LENGTH,
  MESSAGE_STATUS_NAME_MIN_LENGTH,
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
 * Base message status schema with all fields
 */
export const messageStatusBaseSchema = z.object({
  id: idSchema,
  nom: z
    .string()
    .trim()
    .min(MESSAGE_STATUS_NAME_MIN_LENGTH, {
      message: `Le nom doit contenir au moins ${MESSAGE_STATUS_NAME_MIN_LENGTH} caractère`,
    })
    .max(MESSAGE_STATUS_NAME_MAX_LENGTH, {
      message: `Le nom ne peut pas dépasser ${MESSAGE_STATUS_NAME_MAX_LENGTH} caractères`,
    }),
});

/**
 * Inferred TypeScript type for MessageStatus
 */
export type MessageStatus = z.infer<typeof messageStatusBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new message status
 * Required: nom
 */
export const createMessageStatusSchema = messageStatusBaseSchema.pick({
  nom: true,
});

/**
 * Inferred TypeScript type for CreateMessageStatus
 */
export type CreateMessageStatus = z.infer<typeof createMessageStatusSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating a message status
 * Only nom can be updated
 */
export const updateMessageStatusSchema = messageStatusBaseSchema
  .pick({
    nom: true,
  })
  .partial();

/**
 * Inferred TypeScript type for UpdateMessageStatus
 */
export type UpdateMessageStatus = z.infer<typeof updateMessageStatusSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing message statuses with filters
 */
export const listMessageStatusesSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  sort_by: z.enum(['nom', 'id']).default('nom'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Inferred TypeScript type for ListMessageStatuses query
 */
export type ListMessageStatusesQuery = z.infer<typeof listMessageStatusesSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating message status ID as number
 */
export const messageStatusIdSchema = idSchema;

/**
 * Schema for validating message status ID as string (from params)
 */
export const messageStatusIdStringSchema = idStringSchema;

/**
 * Schema for validating message status ID in route params
 */
export const messageStatusIdParamSchema = z.object({
  id: messageStatusIdStringSchema,
});

/**
 * Inferred TypeScript type for message status ID param
 */
export type MessageStatusIdParam = z.infer<typeof messageStatusIdParamSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for message status response (includes all fields)
 */
export const messageStatusResponseSchema = messageStatusBaseSchema;

/**
 * Inferred TypeScript type for MessageStatusResponse
 */
export type MessageStatusResponse = z.infer<typeof messageStatusResponseSchema>;

/**
 * Schema for paginated message statuses list response
 */
export const messageStatusesListResponseSchema = z.object({
  data: z.array(messageStatusResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for MessageStatusesListResponse
 */
export type MessageStatusesListResponse = z.infer<typeof messageStatusesListResponseSchema>;

/**
 * Schema for message status statistics
 */
export const messageStatusStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  usage_count: z.record(z.number().int().nonnegative()),
});

/**
 * Inferred TypeScript type for MessageStatusStats
 */
export type MessageStatusStats = z.infer<typeof messageStatusStatsSchema>;
