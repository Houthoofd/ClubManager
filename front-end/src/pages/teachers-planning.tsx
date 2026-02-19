import React from 'react';
import { TeacherPlanningPage } from '@/features/teachers';

/**
 * Teacher Planning Page - Routing Wrapper
 *
 * Lightweight routing page that imports and renders the Teacher Planning feature page.
 * This maintains the feature-based architecture while keeping pages/ as a thin routing layer.
 */
const TeacherPlanning: React.FC = () => {
  return <TeacherPlanningPage />;
};

export default TeacherPlanning;
