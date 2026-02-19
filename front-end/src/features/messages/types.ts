// ============================================================================
// Messages Feature Types
// ============================================================================

/**
 * Message Type
 * Représente un type/template de message prédéfini
 */
export interface MessageType {
  id: number;
  type_name: string;
  title?: string;
  description?: string;
  content?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Message
 * Représente un message envoyé
 */
export interface Message {
  id: number;
  sender_id: number;
  type_message_id?: number;
  subject?: string;
  content: string;
  sent_at?: string;
  created_at?: string;
  sender?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  messageType?: {
    id: number;
    type_name: string;
    description?: string;
  };
}

/**
 * Message Recipient
 * Représente la relation entre un message et un destinataire
 */
export interface MessageRecipient {
  id: number;
  message_id: number;
  recipient_id: number;
  read: boolean;
  read_at?: string;
  deleted: boolean;
  created_at?: string;
  message?: Message;
}

/**
 * Message avec état de lecture (pour l'UI)
 */
export interface MessageWithStatus {
  id: number;
  title: string;
  content: string;
  sender: string;
  date_envoi: string;
  lu: boolean;
  date_lecture?: string;
  type?: string;
  message_id?: number;
  recipient_id?: number;
}

/**
 * Suggested Message
 * Message suggéré basé sur le profil utilisateur
 */
export interface SuggestedMessage {
  typeId: number;
  raison: string;
}

/**
 * Input pour créer un type de message
 */
export interface CreateMessageTypeInput {
  type_name: string;
  description?: string;
  active?: boolean;
}

/**
 * Input pour mettre à jour un type de message
 */
export interface UpdateMessageTypeInput {
  type_name?: string;
  description?: string;
  active?: boolean;
}

/**
 * Input pour envoyer un message
 */
export interface SendMessageInput {
  sender_id: number;
  type_message_id?: number;
  subject?: string;
  content: string;
  recipient_ids: number[];
}

/**
 * Réponse après suppression
 */
export interface DeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Compteur de messages non lus
 */
export interface UnreadMessagesCount {
  count: number;
}

/**
 * Props pour les composants de tab
 */
export interface MessagesTabProps {
  messagesRecus: MessageWithStatus[];
  onMessageClick: (message: MessageWithStatus) => void;
  onMarkAsRead: (messageId: number) => void;
  onDeleteMessage: (messageId: number) => void;
  onShowDeleteModal: (message: MessageWithStatus) => void;
}

export interface MessageTypesTabProps {
  typesMessages: MessageType[];
  editingId: number | null;
  editFormData: { title: string; content: string };
  onEditStart: (id: number, title: string, content: string) => void;
  onEditCancel: () => void;
  onEditSave: (id: number) => void;
  onDelete: (id: number) => void;
  onFormDataChange: (field: string, value: string) => void;
}

/**
 * Props pour le formulaire d'envoi de message
 */
export interface SendMessageFormProps {
  utilisateurs: any[];
  typesMessages: MessageType[];
  selectedUsers: number[];
  selectedType: string;
  isLoading: boolean;
  onUserSelect: (userId: number) => void;
  onUserRemove: (userId: number) => void;
  onTypeSelect: (typeId: string) => void;
  onSendMessage: () => void;
}

/**
 * État de la page messages
 */
export interface MessagesPageState {
  activeTabKey: string;
  selectedMessage: MessageWithStatus | null;
  isDetailModalOpen: boolean;
  isDeleteModalOpen: boolean;
  messageToDelete: MessageWithStatus | null;
  editingMessageTypeId: number | null;
  editFormData: {
    title: string;
    content: string;
  };
}
