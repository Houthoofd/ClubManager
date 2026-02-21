/**
 * Message Formatters
 *
 * Utility functions for formatting message-related data.
 * Pure functions with single responsibility.
 * Supports i18n for date/time formatting and localized strings.
 */

/**
 * Formats a date string to French locale format
 * @param dateString - ISO date string or date-compatible string
 * @returns Formatted date string (dd/mm/yyyy)
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString("fr-FR");
  } catch {
    return dateString;
  }
};

/**
 * Formats a date string to time format
 * @param dateString - ISO date string or date-compatible string
 * @returns Formatted time string (HH:MM)
 */
export const formatTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

/**
 * Formats a date string to full date and time
 * @param dateString - ISO date string or date-compatible string
 * @returns Formatted date and time string
 */
export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

/**
 * Formats a relative time string (e.g., "il y a 2 heures")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return formatDate(dateString);
  } catch {
    return dateString;
  }
};

/**
 * Normalizes search term for matching
 * @param searchValue - Raw search input
 * @returns Normalized lowercase trimmed search term
 */
export const normalizeSearchTerm = (searchValue: string): string => {
  return searchValue.toLowerCase().trim();
};

/**
 * Creates a searchable string from message data
 * @param message - Message object with searchable fields
 * @returns Concatenated searchable string
 */
export const createMessageSearchableString = (message: {
  subject?: string;
  content?: string;
  senderName?: string;
  type?: string;
}): string => {
  const parts = [
    message.subject || "",
    message.content || "",
    message.senderName || "",
    message.type || "",
  ];
  return parts.join(" ").toLowerCase();
};

/**
 * Truncates text to a maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return "";
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Truncates message subject
 * @param subject - Message subject
 * @param maxLength - Maximum length
 * @returns Truncated subject
 */
export const truncateSubject = (subject: string, maxLength: number = 50): string => {
  return truncateText(subject, maxLength);
};

/**
 * Truncates message content preview
 * @param content - Message content
 * @param maxLength - Maximum length
 * @returns Truncated content preview
 */
export const truncateContent = (content: string, maxLength: number = 150): string => {
  return truncateText(content, maxLength);
};

/**
 * Formats sender name from user object
 * @param sender - Sender user object
 * @returns Formatted sender name
 */
export const formatSenderName = (sender: {
  first_name?: string;
  last_name?: string;
  prenom?: string;
  nom?: string;
  email?: string;
}): string => {
  const firstName = sender.first_name || sender.prenom || "";
  const lastName = sender.last_name || sender.nom || "";
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  if (sender.email) {
    return sender.email;
  }

  return "Inconnu";
};

/**
 * Formats recipient names from array
 * @param recipients - Array of recipient user objects
 * @returns Comma-separated recipient names
 */
export const formatRecipientNames = (
  recipients: Array<{
    first_name?: string;
    last_name?: string;
    prenom?: string;
    nom?: string;
    email?: string;
  }>
): string => {
  if (!recipients || recipients.length === 0) {
    return "Aucun destinataire";
  }

  if (recipients.length === 1) {
    return formatSenderName(recipients[0]);
  }

  const names = recipients.map(formatSenderName);

  if (names.length <= 3) {
    return names.join(", ");
  }

  return `${names.slice(0, 2).join(", ")} et ${names.length - 2} autre${
    names.length - 2 > 1 ? "s" : ""
  }`;
};

/**
 * Formats message type for display
 * @param type - Message type code
 * @returns Formatted message type
 */
export const formatMessageType = (type: string): string => {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

/**
 * Checks if a message is unread
 * @param message - Message object
 * @returns True if message is unread
 */
export const isMessageUnread = (message: { read?: boolean; lu?: boolean }): boolean => {
  return !(message.read ?? message.lu ?? false);
};

/**
 * Formats unread count for display
 * @param count - Number of unread messages
 * @returns Formatted count string
 */
export const formatUnreadCount = (count: number): string => {
  if (count === 0) return "";
  if (count > 99) return "99+";
  return count.toString();
};

/**
 * Groups messages by date (today, yesterday, older)
 * @param messages - Array of messages
 * @returns Grouped messages object
 */
export const groupMessagesByDate = <T extends { created_at?: string; date?: string }>(
  messages: T[]
): { today: T[]; yesterday: T[]; older: T[] } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return messages.reduce(
    (groups, message) => {
      const messageDate = new Date(message.created_at || message.date || "");
      const messageDateOnly = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      );

      if (messageDateOnly.getTime() === today.getTime()) {
        groups.today.push(message);
      } else if (messageDateOnly.getTime() === yesterday.getTime()) {
        groups.yesterday.push(message);
      } else {
        groups.older.push(message);
      }

      return groups;
    },
    { today: [] as T[], yesterday: [] as T[], older: [] as T[] }
  );
};

/**
 * Sorts messages by date (newest first)
 * @param messages - Array of messages
 * @returns Sorted messages
 */
export const sortMessagesByDate = <T extends { created_at?: string; date?: string }>(
  messages: T[]
): T[] => {
  return [...messages].sort((a, b) => {
    const dateA = new Date(a.created_at || a.date || 0);
    const dateB = new Date(b.created_at || b.date || 0);
    return dateB.getTime() - dateA.getTime();
  });
};

/**
 * Formats search results message
 * @param count - Number of items found
 * @param total - Total number of items
 * @returns Formatted message string
 */
export const formatSearchResultsMessage = (count: number, total: number): string => {
  const plural = count > 1 ? "s" : "";
  const foundPlural = count > 1 ? "s" : "";
  return `${count} message${plural} trouvé${foundPlural} sur ${total}`;
};

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Extracts plain text from HTML content
 * @param html - HTML string
 * @returns Plain text content
 */
export const stripHtml = (html: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
};
