/**
 * MessageCard Component Types
 *
 * Type definitions for the MessageCard component
 */

export interface MessageSender {
  /** Sender ID */
  id?: number | string;

  /** First name (English convention) */
  first_name?: string;

  /** Last name (English convention) */
  last_name?: string;

  /** First name (French convention) */
  prenom?: string;

  /** Last name (French convention) */
  nom?: string;

  /** Email address */
  email?: string;
}

export interface MessageCardProps {
  /** Unique message identifier */
  id: string | number;

  /** Message subject/title */
  subject: string;

  /** Message content/body */
  content?: string;

  /** Sender user object */
  sender: MessageSender;

  /** Message type (e.g., "Notification", "Announcement") */
  type?: string;

  /** Message creation date (ISO string) */
  createdAt: string;

  /** Whether the message has been read */
  read?: boolean;

  /** Optional click handler */
  onClick?: (messageId: string | number) => void;

  /** Optional actions menu (kebab, buttons, etc.) */
  actions?: React.ReactNode;

  /** Additional CSS classes */
  className?: string;

  /** Whether to show content preview */
  showPreview?: boolean;
}

export interface MessageCardHeaderProps {
  subject: string;
  read?: boolean;
  actions?: React.ReactNode;
}

export interface MessageCardMetaProps {
  sender: MessageSender;
  createdAt: string;
  type?: string;
  read?: boolean;
}

export interface MessageCardPreviewProps {
  content: string;
  maxLength?: number;
}
