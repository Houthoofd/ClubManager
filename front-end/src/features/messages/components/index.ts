/**
 * Messages Components - Barrel Export
 *
 * Re-exports all components for the messages feature.
 * Centralizes component imports for cleaner imports elsewhere.
 *
 * Usage:
 *   import { MessageCard, SendMessageForm, MessageTypeCard } from '@/features/messages/components';
 */

// ============================================================================
// Message Display Components
// ============================================================================

export { default as MessageCard } from './MessageCard';
export { default as MessageDetailModal } from './MessageDetailModal';

// ============================================================================
// Message Type Components
// ============================================================================

export { default as MessageTypeCard } from './MessageTypeCard';
export { default as MessageTypeSelector } from './MessageTypeSelector';
export { default as CreateMessageTypeForm } from './CreateMessageTypeForm';

// ============================================================================
// Message Tabs
// ============================================================================

export { default as MessageTypesListTab } from './MessageTypesListTab';
export { default as MessagesReadTab } from './MessagesReadTab';
export { default as MessagesReceivedTab } from './MessagesReceivedTab';

// ============================================================================
// Send Message Components
// ============================================================================

export { default as SendMessageForm } from './SendMessageForm';
export { default as SendMessageModal } from './SendMessageModal';
export { default as SendMessageConfirmModal } from './SendMessageConfirmModal';

// ============================================================================
// User Selection Components
// ============================================================================

export { default as UserSelector } from './UserSelector';

// ============================================================================
// Modal Components
// ============================================================================

export { default as DeleteMessageModal } from './DeleteMessageModal';

// ============================================================================
// Sub-folder Components
// ============================================================================

// Note: messages-legacy subfolder components can be added here if needed
// export * from './messages-legacy';
