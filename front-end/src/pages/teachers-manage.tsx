import React from 'react';
import { TeachersManagePage } from '@/features/teachers';

/**
 * Teachers Management Page - Routing Wrapper
 *
 * Lightweight routing page that imports and renders the Teachers Management feature page.
 * This maintains the feature-based architecture while keeping pages/ as a thin routing layer.
 */
const TeachersManage: React.FC = () => {
  return <TeachersManagePage />;
};

export default TeachersManage;
