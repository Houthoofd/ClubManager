/**
 * ====================================================================
 * MESSAGE SERVICE - Business Logic Layer
 * ====================================================================
 *
 * Service contenant la logique métier pour la gestion des messages.
 * Gère le formatage, le filtrage, les threads, la lecture, etc.
 *
 * @module features/messages/services
 */

// ============================================================================
// Types
// ============================================================================

export interface Message {
  id: string;
  objet: string;
  contenu: string;
  expediteur: {
    id: string;
    nom: string;
    prenom: string;
    email?: string;
  };
  destinataire: {
    id: string;
    nom: string;
    prenom: string;
    email?: string;
  };
  dateEnvoi: string;
  lu: boolean;
  important?: boolean;
  archive?: boolean;
  reponseA?: string; // ID du message parent (thread)
  pieceJointe?: string[];
  categorie?: MessageCategory;
}

export type MessageCategory = 'GENERAL' | 'URGENT' | 'REMINDER' | 'NOTIFICATION' | 'ADMIN';

export interface MessageThread {
  root: Message;
  replies: Message[];
  totalMessages: number;
  lastActivity: string;
  hasUnread: boolean;
}

export interface MessageFilters {
  search?: string;
  lu?: boolean;
  important?: boolean;
  archive?: boolean;
  categorie?: MessageCategory;
  expediteurId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MessageStats {
  totalMessages: number;
  unreadMessages: number;
  importantMessages: number;
  archivedMessages: number;
  todayMessages: number;
  averageResponseTime?: number;
}

// ============================================================================
// Message Display & Formatting
// ============================================================================

/**
 * Formate le nom complet d'un expéditeur/destinataire
 *
 * @param person - Personne (expediteur ou destinataire)
 * @returns Nom complet
 */
export const formatPersonName = (person: { nom: string; prenom: string }): string => {
  return `${person.prenom} ${person.nom}`.trim();
};

/**
 * Formate la date d'envoi du message
 *
 * @param date - Date ISO string
 * @returns Date formatée (ex: "15 janvier 2024 à 14:30")
 */
export const formatMessageDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formate la date de manière relative (il y a X minutes/heures/jours)
 *
 * @param date - Date ISO string
 * @returns Date relative (ex: "il y a 2 heures")
 */
export const formatMessageDateRelative = (date: string): string => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'À l\'instant';
  if (diffMinutes < 60) return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

  return formatMessageDate(date);
};

/**
 * Tronque le contenu du message pour prévisualisation
 *
 * @param contenu - Contenu du message
 * @param maxLength - Longueur maximale (défaut: 100)
 * @returns Contenu tronqué
 */
export const truncateMessageContent = (contenu: string, maxLength: number = 100): string => {
  if (contenu.length <= maxLength) return contenu;
  return `${contenu.substring(0, maxLength)}...`;
};

/**
 * Formate la catégorie du message
 *
 * @param categorie - Catégorie du message
 * @returns { label: string, variant: string, icon: string }
 */
export const formatMessageCategory = (
  categorie?: MessageCategory
): { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'default'; icon: string } => {
  const categoryMap = {
    GENERAL: { label: 'Général', variant: 'default' as const, icon: '📧' },
    URGENT: { label: 'Urgent', variant: 'danger' as const, icon: '⚠️' },
    REMINDER: { label: 'Rappel', variant: 'warning' as const, icon: '⏰' },
    NOTIFICATION: { label: 'Notification', variant: 'info' as const, icon: '🔔' },
    ADMIN: { label: 'Administration', variant: 'success' as const, icon: '⚙️' },
  };

  return categorie ? categoryMap[categorie] : categoryMap.GENERAL;
};

// ============================================================================
// Message State & Status
// ============================================================================

/**
 * Vérifie si un message est non lu
 *
 * @param message - Message
 * @returns true si non lu
 */
export const isUnread = (message: Message): boolean => {
  return !message.lu;
};

/**
 * Vérifie si un message a été envoyé aujourd'hui
 *
 * @param message - Message
 * @returns true si envoyé aujourd'hui
 */
export const isSentToday = (message: Message): boolean => {
  const today = new Date();
  const messageDate = new Date(message.dateEnvoi);

  return (
    messageDate.getDate() === today.getDate() &&
    messageDate.getMonth() === today.getMonth() &&
    messageDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Vérifie si un message est récent (< 24h)
 *
 * @param message - Message
 * @returns true si récent
 */
export const isRecent = (message: Message): boolean => {
  const now = new Date();
  const messageDate = new Date(message.dateEnvoi);
  const diffHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

  return diffHours < 24;
};

/**
 * Vérifie si un message a des pièces jointes
 *
 * @param message - Message
 * @returns true si pièces jointes présentes
 */
export const hasAttachments = (message: Message): boolean => {
  return !!message.pieceJointe && message.pieceJointe.length > 0;
};

/**
 * Compte le nombre de pièces jointes
 *
 * @param message - Message
 * @returns Nombre de pièces jointes
 */
export const getAttachmentCount = (message: Message): number => {
  return message.pieceJointe?.length || 0;
};

// ============================================================================
// Message Threading
// ============================================================================

/**
 * Vérifie si un message est une réponse
 *
 * @param message - Message
 * @returns true si c'est une réponse
 */
export const isReply = (message: Message): boolean => {
  return !!message.reponseA;
};

/**
 * Trouve le message racine d'un thread
 *
 * @param messages - Tous les messages
 * @param messageId - ID du message
 * @returns Message racine
 */
export const findThreadRoot = (messages: Message[], messageId: string): Message | null => {
  const message = messages.find((m) => m.id === messageId);
  if (!message) return null;

  // Si c'est déjà la racine
  if (!message.reponseA) return message;

  // Remonte jusqu'à la racine
  return findThreadRoot(messages, message.reponseA);
};

/**
 * Récupère toutes les réponses d'un message
 *
 * @param messages - Tous les messages
 * @param messageId - ID du message parent
 * @returns Réponses
 */
export const getMessageReplies = (messages: Message[], messageId: string): Message[] => {
  return messages.filter((m) => m.reponseA === messageId);
};

/**
 * Construit un thread complet (racine + réponses)
 *
 * @param messages - Tous les messages
 * @param messageId - ID du message racine ou d'une réponse
 * @returns Thread complet
 */
export const buildMessageThread = (messages: Message[], messageId: string): MessageThread | null => {
  const root = findThreadRoot(messages, messageId);
  if (!root) return null;

  const replies = getMessageReplies(messages, root.id);
  const allThreadMessages = [root, ...replies];

  const lastActivity = allThreadMessages
    .map((m) => new Date(m.dateEnvoi).getTime())
    .reduce((max, current) => Math.max(max, current), 0);

  const hasUnread = allThreadMessages.some((m) => !m.lu);

  return {
    root,
    replies,
    totalMessages: allThreadMessages.length,
    lastActivity: new Date(lastActivity).toISOString(),
    hasUnread,
  };
};

/**
 * Groupe les messages par thread
 *
 * @param messages - Tous les messages
 * @returns Map de threads
 */
export const groupMessagesByThread = (messages: Message[]): MessageThread[] => {
  const processedIds = new Set<string>();
  const threads: MessageThread[] = [];

  messages.forEach((message) => {
    // Skip si déjà traité
    if (processedIds.has(message.id)) return;

    const root = findThreadRoot(messages, message.id);
    if (!root) return;

    // Skip si la racine a déjà été traitée
    if (processedIds.has(root.id)) return;

    const thread = buildMessageThread(messages, root.id);
    if (thread) {
      threads.push(thread);
      // Marque tous les messages du thread comme traités
      [thread.root, ...thread.replies].forEach((m) => processedIds.add(m.id));
    }
  });

  return threads;
};

// ============================================================================
// Message Filtering & Sorting
// ============================================================================

/**
 * Filtre les messages selon des critères
 *
 * @param messages - Liste de messages
 * @param filters - Critères de filtrage
 * @returns Messages filtrés
 */
export const filterMessages = (messages: Message[], filters: MessageFilters): Message[] => {
  return messages.filter((message) => {
    // Recherche textuelle (objet, contenu, expéditeur)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const objet = message.objet.toLowerCase();
      const contenu = message.contenu.toLowerCase();
      const expediteur = formatPersonName(message.expediteur).toLowerCase();

      if (
        !objet.includes(searchLower) &&
        !contenu.includes(searchLower) &&
        !expediteur.includes(searchLower)
      ) {
        return false;
      }
    }

    // Filtre par statut lu/non-lu
    if (filters.lu !== undefined && message.lu !== filters.lu) {
      return false;
    }

    // Filtre par important
    if (filters.important !== undefined && message.important !== filters.important) {
      return false;
    }

    // Filtre par archivé
    if (filters.archive !== undefined && message.archive !== filters.archive) {
      return false;
    }

    // Filtre par catégorie
    if (filters.categorie && message.categorie !== filters.categorie) {
      return false;
    }

    // Filtre par expéditeur
    if (filters.expediteurId && message.expediteur.id !== filters.expediteurId) {
      return false;
    }

    // Filtre par date
    if (filters.dateFrom) {
      if (new Date(message.dateEnvoi) < new Date(filters.dateFrom)) {
        return false;
      }
    }

    if (filters.dateTo) {
      if (new Date(message.dateEnvoi) > new Date(filters.dateTo)) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Trie les messages par date
 *
 * @param messages - Liste de messages
 * @param order - Ordre de tri ('asc' | 'desc')
 * @returns Messages triés
 */
export const sortMessagesByDate = (messages: Message[], order: 'asc' | 'desc' = 'desc'): Message[] => {
  return [...messages].sort((a, b) => {
    const dateA = new Date(a.dateEnvoi).getTime();
    const dateB = new Date(b.dateEnvoi).getTime();

    const comparison = dateA - dateB;
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Trie les messages par importance (important d'abord, puis par date)
 *
 * @param messages - Liste de messages
 * @returns Messages triés
 */
export const sortMessagesByImportance = (messages: Message[]): Message[] => {
  return [...messages].sort((a, b) => {
    // Important d'abord
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;

    // Si même importance, trier par date (plus récent d'abord)
    return new Date(b.dateEnvoi).getTime() - new Date(a.dateEnvoi).getTime();
  });
};

// ============================================================================
// Message Statistics
// ============================================================================

/**
 * Calcule les statistiques des messages
 *
 * @param messages - Liste de messages
 * @returns Statistiques
 */
export const calculateMessageStats = (messages: Message[]): MessageStats => {
  const totalMessages = messages.length;
  const unreadMessages = messages.filter((m) => !m.lu).length;
  const importantMessages = messages.filter((m) => m.important).length;
  const archivedMessages = messages.filter((m) => m.archive).length;
  const todayMessages = messages.filter(isSentToday).length;

  return {
    totalMessages,
    unreadMessages,
    importantMessages,
    archivedMessages,
    todayMessages,
  };
};

/**
 * Groupe les messages par expéditeur
 *
 * @param messages - Liste de messages
 * @returns Map expéditeur -> messages
 */
export const groupMessagesBySender = (messages: Message[]): Record<string, Message[]> => {
  return messages.reduce((acc, message) => {
    const senderId = message.expediteur.id;
    if (!acc[senderId]) {
      acc[senderId] = [];
    }
    acc[senderId].push(message);
    return acc;
  }, {} as Record<string, Message[]>);
};

/**
 * Groupe les messages par date (jour)
 *
 * @param messages - Liste de messages
 * @returns Map date -> messages
 */
export const groupMessagesByDate = (messages: Message[]): Record<string, Message[]> => {
  return messages.reduce((acc, message) => {
    const date = new Date(message.dateEnvoi).toLocaleDateString('fr-FR');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {} as Record<string, Message[]>);
};

// ============================================================================
// Message Actions
// ============================================================================

/**
 * Marque un message comme lu
 *
 * @param message - Message
 * @returns Message mis à jour
 */
export const markAsRead = (message: Message): Message => {
  return { ...message, lu: true };
};

/**
 * Marque un message comme non lu
 *
 * @param message - Message
 * @returns Message mis à jour
 */
export const markAsUnread = (message: Message): Message => {
  return { ...message, lu: false };
};

/**
 * Marque un message comme important
 *
 * @param message - Message
 * @returns Message mis à jour
 */
export const toggleImportant = (message: Message): Message => {
  return { ...message, important: !message.important };
};

/**
 * Archive/Désarchive un message
 *
 * @param message - Message
 * @returns Message mis à jour
 */
export const toggleArchive = (message: Message): Message => {
  return { ...message, archive: !message.archive };
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Valide qu'un message peut être envoyé
 *
 * @param objet - Objet du message
 * @param contenu - Contenu du message
 * @param destinataireId - ID du destinataire
 * @returns { valid: boolean, errors: string[] }
 */
export const validateMessage = (
  objet: string,
  contenu: string,
  destinataireId?: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!objet || objet.trim().length === 0) {
    errors.push('L\'objet du message est requis');
  } else if (objet.length > 200) {
    errors.push('L\'objet ne peut pas dépasser 200 caractères');
  }

  if (!contenu || contenu.trim().length === 0) {
    errors.push('Le contenu du message est requis');
  } else if (contenu.length > 5000) {
    errors.push('Le contenu ne peut pas dépasser 5000 caractères');
  }

  if (!destinataireId) {
    errors.push('Un destinataire doit être sélectionné');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// Export all
// ============================================================================

export default {
  // Formatting
  formatPersonName,
  formatMessageDate,
  formatMessageDateRelative,
  truncateMessageContent,
  formatMessageCategory,

  // State
  isUnread,
  isSentToday,
  isRecent,
  hasAttachments,
  getAttachmentCount,

  // Threading
  isReply,
  findThreadRoot,
  getMessageReplies,
  buildMessageThread,
  groupMessagesByThread,

  // Filtering & Sorting
  filterMessages,
  sortMessagesByDate,
  sortMessagesByImportance,

  // Statistics
  calculateMessageStats,
  groupMessagesBySender,
  groupMessagesByDate,

  // Actions
  markAsRead,
  markAsUnread,
  toggleImportant,
  toggleArchive,

  // Validation
  validateMessage,
};
