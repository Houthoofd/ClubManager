/**
 * Message Helpers
 * Utility functions for message operations
 */

import {
  MessageStatus,
  MessageType,
  MessagePriority,
} from "@clubmanager/types";

/**
 * Get message status label in French
 */
export function getMessageStatusLabel(status: MessageStatus): string {
  const labels: Record<MessageStatus, string> = {
    [MessageStatus.DRAFT]: "Brouillon",
    [MessageStatus.SENT]: "Envoyé",
    [MessageStatus.DELIVERED]: "Délivré",
    [MessageStatus.READ]: "Lu",
    [MessageStatus.FAILED]: "Échoué",
    [MessageStatus.ARCHIVED]: 'Archivé',
  };
  return labels[status];
}

/**
 * Get message type label in French
 */
export function getMessageTypeLabel(type: MessageType): string {
  const labels: Record<MessageType, string> = {
    [MessageType.EMAIL]: 'Email',
    [MessageType.SMS]: 'SMS',
    [MessageType.PUSH]: 'Notification Push',
    [MessageType.IN_APP]: 'In-App',
    [MessageType.SYSTEM]: 'Système'
  };
  return labels[type];
}

/**
 * Get message priority label in French
 */
export function getMessagePriorityLabel(priority: MessagePriority): string {
  const labels: Record<MessagePriority, string> = {
    [MessagePriority.LOW]: "Basse",
    [MessagePriority.NORMAL]: "Normale",
    [MessagePriority.HIGH]: "Haute",
    [MessagePriority.URGENT]: "Urgente",
  };
  return labels[priority];
}

/**
 * Get message status color
 */
export function getMessageStatusColor(status: MessageStatus): string {
  const colors: Record<MessageStatus, string> = {
    [MessageStatus.DRAFT]: "gray",
    [MessageStatus.SENT]: "blue",
    [MessageStatus.DELIVERED]: "cyan",
    [MessageStatus.READ]: "green",
    [MessageStatus.FAILED]: "red",
    [MessageStatus.ARCHIVED]: "slate",
  };
  return colors[status];
}

/**
 * Get message priority color
 */
export function getMessagePriorityColor(priority: MessagePriority): string {
  const colors: Record<MessagePriority, string> = {
    [MessagePriority.LOW]: "gray",
    [MessagePriority.NORMAL]: "blue",
    [MessagePriority.HIGH]: "orange",
    [MessagePriority.URGENT]: "red",
  };
  return colors[priority];
}

/**
 * Truncate message body for preview
 */
export function truncateBody(body: string, maxLength = 100): string {
  if (body.length <= maxLength) return body;
  return body.substring(0, maxLength) + "...";
}

/**
 * Generate message preview (plain text from HTML)
 */
export function generatePreview(html: string, maxLength = 150): string {
  // Remove HTML tags
  const text = html.replace(/<[^>]*>/g, "");
  // Remove extra whitespace
  const cleaned = text.replace(/\s+/g, " ").trim();
  return truncateBody(cleaned, maxLength);
}

/**
 * Check if message is unread
 */
export function isUnread(status: MessageStatus, readAt: Date | null): boolean {
  return (
    readAt === null &&
    [MessageStatus.SENT, MessageStatus.DELIVERED].includes(status)
  );
}

/**
 * Check if message can be edited
 */
export function canEditMessage(status: MessageStatus): boolean {
  return status === MessageStatus.DRAFT;
}

/**
 * Check if message can be deleted
 */
export function canDeleteMessage(status: MessageStatus): boolean {
  return [MessageStatus.DRAFT].includes(status);
}

/**
 * Check if message can be archived
 */
export function canArchiveMessage(status: MessageStatus): boolean {
  return status !== MessageStatus.DRAFT;
}

/**
 * Check if message can be resent
 */
export function canResendMessage(status: MessageStatus): boolean {
  return status === MessageStatus.FAILED;
}

/**
 * Format message subject with prefix
 */
export function formatSubjectWithPrefix(
  subject: string,
  type: MessageType,
): string {
  const prefixes: Partial<Record<MessageType, string>> = {};

  const prefix = prefixes[type];
  return prefix ? `${prefix} ${subject}` : subject;
}

/**
 * Parse template variables from message body
 */
export function parseTemplateVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Replace template variables with values
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, any>,
): string {
  let result = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, String(value));
  });

  return result;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize HTML content (basic)
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags
  let cleaned = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
  // Remove onclick and other event handlers
  cleaned = cleaned.replace(/\s*on\w+="[^"]*"/gi, "");
  cleaned = cleaned.replace(/\s*on\w+='[^']*'/gi, "");
  return cleaned;
}

/**
 * Calculate message read rate
 */
export function calculateReadRate(
  totalSent: number,
  totalRead: number,
): number {
  if (totalSent === 0) return 0;
  return Math.round((totalRead / totalSent) * 100 * 100) / 100;
}

/**
 * Calculate message delivery rate
 */
export function calculateDeliveryRate(
  totalSent: number,
  totalDelivered: number,
): number {
  if (totalSent === 0) return 0;
  return Math.round((totalDelivered / totalSent) * 100 * 100) / 100;
}

/**
 * Get message age in hours
 */
export function getMessageAge(createdAt: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

/**
 * Check if message is recent (within X hours)
 */
export function isRecentMessage(createdAt: Date, hours = 24): boolean {
  return getMessageAge(createdAt) <= hours;
}

/**
 * Format message timestamp
 */
export function formatMessageTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes === 0 ? "À l'instant" : `Il y a ${diffMinutes} min`;
  }

  if (diffHours < 24) {
    return `Il y a ${Math.floor(diffHours)} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  // Format as date
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Group messages by date
 */
export function groupMessagesByDate<T extends { createdAt: Date }>(
  messages: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  messages.forEach((message) => {
    const dateKey = message.createdAt.toISOString().split("T")[0];
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, message]);
  });

  return grouped;
}

/**
 * Get next valid statuses for current status
 */
export function getNextValidStatuses(
  currentStatus: MessageStatus,
): MessageStatus[] {
  const transitions: Record<MessageStatus, MessageStatus[]> = {
    [MessageStatus.DRAFT]: [MessageStatus.SENT],
    [MessageStatus.SENT]: [MessageStatus.DELIVERED, MessageStatus.FAILED],
    [MessageStatus.DELIVERED]: [MessageStatus.READ],
    [MessageStatus.READ]: [MessageStatus.ARCHIVED],
    [MessageStatus.FAILED]: [MessageStatus.SENT],
    [MessageStatus.ARCHIVED]: [],
  };
  return transitions[currentStatus] || [];
}

/**
 * Validate status transition
 */
export function isValidStatusTransition(
  from: MessageStatus,
  to: MessageStatus,
): boolean {
  const validNext = getNextValidStatuses(from);
  return validNext.includes(to);
}

/**
 * Calculate estimated reading time (words per minute)
 */
export function calculateReadingTime(
  text: string,
  wordsPerMinute = 200,
): number {
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Detect message language (basic)
 */
export function detectLanguage(text: string): "fr" | "en" | "unknown" {
  const frenchWords = ["le", "la", "de", "et", "un", "une", "pour", "dans"];
  const englishWords = ["the", "and", "of", "to", "in", "for", "with"];

  const lowerText = text.toLowerCase();
  const frenchCount = frenchWords.filter((word) =>
    lowerText.includes(word),
  ).length;
  const englishCount = englishWords.filter((word) =>
    lowerText.includes(word),
  ).length;

  if (frenchCount > englishCount) return "fr";
  if (englishCount > frenchCount) return "en";
  return "unknown";
}

/**
 * Generate message signature
 */
export function generateSignature(
  senderName: string,
  senderEmail: string,
): string {
  return `\n\n---\n${senderName}\n${senderEmail}`;
}

/**
 * Extract mentions from message (@username)
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (!mentions.includes(match[1])) {
      mentions.push(match[1]);
    }
  }

  return mentions;
}

/**
 * Extract hashtags from message (#tag)
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    if (!hashtags.includes(match[1])) {
      hashtags.push(match[1]);
    }
  }

  return hashtags;
}

/**
 * Check if message needs urgent notification
 */
export function needsUrgentNotification(priority: MessagePriority): boolean {
  return [MessagePriority.HIGH, MessagePriority.URGENT].includes(priority);
}

/**
 * Get notification sound based on priority
 */
export function getNotificationSound(priority: MessagePriority): string {
  const sounds: Record<MessagePriority, string> = {
    [MessagePriority.LOW]: "soft-beep",
    [MessagePriority.NORMAL]: "notification",
    [MessagePriority.HIGH]: "alert",
    [MessagePriority.URGENT]: "urgent-alarm",
  };
  return sounds[priority];
}

/**
 * Format bulk message summary
 */
export function formatBulkMessageSummary(
  recipientCount: number,
  type: MessageType,
): string {
  return `${recipientCount} destinataire${recipientCount > 1 ? "s" : ""} - ${getMessageTypeLabel(type)}`;
}

/**
 * Validate message schedule time
 */
export function isValidScheduleTime(scheduledAt: Date): boolean {
  const now = new Date();
  const maxFuture = new Date();
  maxFuture.setFullYear(maxFuture.getFullYear() + 1);

  return scheduledAt > now && scheduledAt < maxFuture;
}
