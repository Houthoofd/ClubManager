/**
 * Lightweight routing page for Course Management
 *
 * This page serves as a thin routing layer that imports and renders
 * the main AddCoursePage component from the courses feature.
 */

import { AddCoursePage } from '@/features/courses';

export default function CoursesManagePage() {
  return <AddCoursePage />;
}
