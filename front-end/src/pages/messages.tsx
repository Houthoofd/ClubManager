import React from 'react';
import { MessagesPage } from '@/features/messages';

/**
 * Messages Page - Routing Wrapper
 *
 * Lightweight routing page that imports and renders the Messages feature page.
 * This maintains the feature-based architecture while keeping pages/ as a thin routing layer.
 */
const Messages: React.FC = () => {
  return <MessagesPage />;
};

export default Messages;
