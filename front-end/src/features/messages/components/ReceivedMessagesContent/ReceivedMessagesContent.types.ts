/**
 * ReceivedMessagesContent Types
 *
 * Type definitions for ReceivedMessagesContent component.
 */

export interface ReceivedMessagesContentProps {
  /** Array of received messages to display */
  messages: Array<{
    id: string | number;
    subject: string;
    content?: string;
    sender: {
      id?: number | string;
      first_name?: string;
      last_name?: string;
      prenom?: string;
      nom?: string;
      email?: string;
    };
    type?: string;
    created_at?: string;
    date?: string;
    read?: boolean;
    lu?: boolean;
  }>;

  /** Click handler for message cards */
  onMessageClick?: (messageId: string | number) => void;

  /** Handler for marking message as read */
  onMarkAsRead?: (messageId: string | number) => void;

  /** Handler for deleting message */
  onDelete?: (messageId: string | number) => void;

  /** Loading state */
  isLoading?: boolean;

  /** Whether to group messages by date (today/yesterday/older) */
  groupByDate?: boolean;

  /** Whether to show search functionality */
  showSearch?: boolean;

  /** Additional CSS classes */
  className?: string;
}
