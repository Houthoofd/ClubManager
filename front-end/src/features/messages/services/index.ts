/**
 * ====================================================================
 * MESSAGE SERVICES - BARREL EXPORT
 * ====================================================================
 *
 * Point d'entrée centralisé pour tous les services métier liés aux messages.
 *
 * Usage:
 * ```tsx
 * import { MessageService } from '@/features/messages/services';
 *
 * // Utiliser les fonctions du service
 * const formattedDate = MessageService.formatMessageDate(message.dateEnvoi);
 * const isNew = MessageService.isUnread(message);
 * const thread = MessageService.buildMessageThread(messages, messageId);
 * ```
 *
 * Ou importer des fonctions spécifiques:
 * ```tsx
 * import { formatMessageDate, isUnread, filterMessages } from '@/features/messages/services';
 * ```
 */

// ============================================================================
// Export everything from message.service.ts
// ============================================================================

export * from "./message.service";
export { default as MessageService } from "./message.service";

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  Message,
  MessageCategory,
  MessageThread,
  MessageFilters,
  MessageStats,
} from "./message.service";
