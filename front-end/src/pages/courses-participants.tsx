/**
 * Lightweight routing page for Course Participants
 *
 * This page serves as a thin routing layer that imports and renders
 * the main ParticipantsPage component from the courses feature.
 */

import { ParticipantsPage } from '@/features/courses';

export default function CoursesParticipantsPage() {
  return <ParticipantsPage />;
}
