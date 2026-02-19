/**
 * Lightweight routing page for Course Enrollment
 *
 * This page serves as a thin routing layer that imports and renders
 * the main InscriptionPage component from the courses feature.
 */

import { InscriptionPage } from '@/features/courses';

export default function CoursesEnrollPage() {
  return <InscriptionPage />;
}
