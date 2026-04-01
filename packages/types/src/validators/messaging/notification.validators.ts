/**
 * @fileoverview Notification Validators
 * @module @clubmanager/types/validators/messaging/notification
 *
 * Zod schemas for validating system notifications (push, email, SMS).
 *
 * DB Table: notifications
 * Columns: id, utilisateur_id, type, titre, message, lu, created_at
 *
 * Business Rules:
 * - Type must be one of: 'info', 'warning', 'error', 'success'
 * - Title is required (1-255 chars)
 * - Message is required (1-65535 chars)
 * - Read status (lu) is boolean with default false
 * - Notifications are read-only after creation (except marking as read)
 */

import { z } from 'zod';
import {
  NOTIFICATION_TITLE_MAX_LENGTH,
  NOTIFICATION_TITLE_MIN_LENGTH,
  NOTIFICATION_MESSAGE_MIN_LENGTH,
  NOTIFICATION_MESSAGE_MAX_LENGTH,
  MESSAGING_DEFAULT_PAGE_SIZE,
  MESSAGING_MAX_PAGE_SIZE,
  MESSAGING_MIN_PAGE_SIZE,
  MESSAGING_DEFAULT_PAGE,
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
} from '../../constants/messaging.constants.js';
import { NotificationType, NOTIFICATION_TYPES } from '../../enums/messaging.enums.js';
import { idSchema, idStringSchema, paginationSchema } from '../common/common.validators.js';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

/**
 * Schema for notification type validation
 * DB: notifications.type ENUM('info', 'warning', 'error', 'success')
 */
export const notificationTypeSchema = z.enum(['info', 'warning', 'error', 'success'], {
  errorMap: () => ({
    message: `Le type de notification doit être l'un des suivants: ${NOTIFICATION_TYPES.join(', ')}`,
  }),
});

/**
 * Base notification schema with all fields
 */
export const notificationBaseSchema = z.object({
  id: idSchema,
  utilisateur_id: idSchema,
  type: notificationTypeSchema.default(NotificationType.INFO),
  titre: z
    .string()
    .trim()
    .min(NOTIFICATION_TITLE_MIN_LENGTH, {
      message: `Le titre doit contenir au moins ${NOTIFICATION_TITLE_MIN_LENGTH} caractère`,
    })
    .max(NOTIFICATION_TITLE_MAX_LENGTH, {
      message: `Le titre ne peut pas dépasser ${NOTIFICATION_TITLE_MAX_LENGTH} caractères`,
    }),
  message: z
    .string()
    .trim()
    .min(NOTIFICATION_MESSAGE_MIN_LENGTH, {
      message: `Le message doit contenir au moins ${NOTIFICATION_MESSAGE_MIN_LENGTH} caractère`,
    })
    .max(NOTIFICATION_MESSAGE_MAX_LENGTH, {
      message: `Le message ne peut pas dépasser ${NOTIFICATION_MESSAGE_MAX_LENGTH} caractères`,
    }),
  lu: z.boolean().default(false),
  created_at: z.coerce.date(),
});

/**
 * Inferred TypeScript type for Notification
 */
export type Notification = z.infer<typeof notificationBaseSchema>;

// ============================================================================
// CREATE SCHEMA
// ============================================================================

/**
 * Schema for creating a new notification
 * Required: utilisateur_id, titre, message
 * Optional: type (defaults to 'info')
 */
export const createNotificationSchema = notificationBaseSchema.pick({
  utilisateur_id: true,
  type: true,
  titre: true,
  message: true,
});

/**
 * Inferred TypeScript type for CreateNotification
 */
export type CreateNotification = z.infer<typeof createNotificationSchema>;

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

/**
 * Schema for updating notification read status
 * Only lu can be updated
 */
export const updateNotificationSchema = z.object({
  lu: z.boolean(),
});

/**
 * Inferred TypeScript type for UpdateNotification
 */
export type UpdateNotification = z.infer<typeof updateNotificationSchema>;

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/**
 * Schema for listing notifications with filters
 */
export const listNotificationsSchema = paginationSchema.extend({
  utilisateur_id: idSchema.optional(),
  type: notificationTypeSchema.optional(),
  lu: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean())
    .optional(),
  date_debut: z.coerce.date().optional(),
  date_fin: z.coerce.date().optional(),
  search: z.string().trim().optional(),
  sort_by: z.enum(['created_at', 'type', 'titre']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for ListNotifications query
 */
export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;

/**
 * Schema for user notifications query (filtered by user)
 */
export const userNotificationsSchema = paginationSchema.extend({
  type: notificationTypeSchema.optional(),
  lu: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean())
    .optional(),
  sort_by: z.enum(['created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default(DEFAULT_SORT_ORDER),
});

/**
 * Inferred TypeScript type for UserNotifications query
 */
export type UserNotificationsQuery = z.infer<typeof userNotificationsSchema>;

// ============================================================================
// ID VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for validating notification ID as number
 */
export const notificationIdSchema = idSchema;

/**
 * Schema for validating notification ID as string (from params)
 */
export const notificationIdStringSchema = idStringSchema;

/**
 * Schema for validating notification ID in route params
 */
export const notificationIdParamSchema = z.object({
  id: notificationIdStringSchema,
});

/**
 * Inferred TypeScript type for notification ID param
 */
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;

// ============================================================================
// BULK OPERATIONS SCHEMAS
// ============================================================================

/**
 * Schema for marking multiple notifications as read
 */
export const bulkMarkReadNotificationsSchema = z.object({
  notification_ids: z
    .array(idSchema)
    .min(1, { message: 'Au moins une notification doit être sélectionnée' })
    .max(100, { message: 'Vous ne pouvez pas marquer plus de 100 notifications à la fois' }),
});

/**
 * Inferred TypeScript type for BulkMarkReadNotifications
 */
export type BulkMarkReadNotifications = z.infer<typeof bulkMarkReadNotificationsSchema>;

/**
 * Schema for deleting multiple notifications
 */
export const bulkDeleteNotificationsSchema = z.object({
  notification_ids: z
    .array(idSchema)
    .min(1, { message: 'Au moins une notification doit être sélectionnée' })
    .max(100, { message: 'Vous ne pouvez pas supprimer plus de 100 notifications à la fois' }),
});

/**
 * Inferred TypeScript type for BulkDeleteNotifications
 */
export type BulkDeleteNotifications = z.infer<typeof bulkDeleteNotificationsSchema>;

/**
 * Schema for marking all user notifications as read
 */
export const markAllReadSchema = z.object({
  utilisateur_id: idSchema,
  type: notificationTypeSchema.optional(),
});

/**
 * Inferred TypeScript type for MarkAllRead
 */
export type MarkAllRead = z.infer<typeof markAllReadSchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

/**
 * Schema for notification response (includes all fields)
 */
export const notificationResponseSchema = notificationBaseSchema;

/**
 * Inferred TypeScript type for NotificationResponse
 */
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

/**
 * Schema for paginated notifications list response
 */
export const notificationsListResponseSchema = z.object({
  data: z.array(notificationResponseSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for NotificationsListResponse
 */
export type NotificationsListResponse = z.infer<typeof notificationsListResponseSchema>;

/**
 * Schema for notification statistics
 */
export const notificationStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  unread: z.number().int().nonnegative(),
  by_type: z.object({
    info: z.number().int().nonnegative(),
    warning: z.number().int().nonnegative(),
    error: z.number().int().nonnegative(),
    success: z.number().int().nonnegative(),
  }),
});

/**
 * Inferred TypeScript type for NotificationStats
 */
export type NotificationStats = z.infer<typeof notificationStatsSchema>;
