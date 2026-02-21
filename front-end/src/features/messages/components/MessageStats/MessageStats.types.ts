/**
 * MessageStats Types
 *
 * Type definitions for MessageStats component.
 */

export interface MessageStatsProps {
  /** Total number of messages */
  totalMessages?: number;

  /** Number of unread messages */
  unreadMessages?: number;

  /** Number of read messages */
  readMessages?: number;

  /** Whether to show total messages stat */
  showTotal?: boolean;

  /** Whether to show unread messages stat */
  showUnread?: boolean;

  /** Whether to show read messages stat */
  showRead?: boolean;

  /** Layout variant */
  variant?: "horizontal" | "vertical";

  /** Additional CSS classes */
  className?: string;
}
