/**
 * TeacherList Component
 *
 * Renders a list of teacher cards with optional empty state.
 * Atomic component with single responsibility: display teacher list.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { TeacherCard } from "../TeacherCard";
import { EmptyTeacherState } from "../EmptyTeacherState";
import type { TeacherListItem } from "../../types";

export interface TeacherListProps {
  /** Array of teachers to display */
  teachers: TeacherListItem[];

  /** Whether this is a filtered/searched list */
  isFiltered?: boolean;

  /** Click handler for teacher cards */
  onTeacherClick?: (teacherId: string) => void;

  /** Custom actions for each teacher card */
  renderActions?: (teacher: TeacherListItem) => React.ReactNode;

  /** Custom empty state component */
  emptyState?: React.ReactNode;

  /** Loading state */
  isLoading?: boolean;

  /** Additional CSS classes */
  className?: string;
}

export const TeacherList: React.FC<TeacherListProps> = ({
  teachers,
  isFiltered = false,
  onTeacherClick,
  renderActions,
  emptyState,
  isLoading = false,
  className = "",
}) => {
  // Show loading state
  if (isLoading) {
    return null; // Parent should handle loading spinner
  }

  // Show empty state if no teachers
  if (teachers.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    return <EmptyTeacherState isSearchResult={isFiltered} />;
  }

  // Render teacher list
  return (
    <div className={`teachers-list ${className}`}>
      {teachers.map((teacher) => (
        <TeacherCard
          key={teacher.id}
          id={teacher.id}
          userId={teacher.user_id}
          firstName={teacher.first_name}
          lastName={teacher.last_name}
          email={teacher.email}
          specialization={teacher.specialization}
          bio={teacher.bio}
          certifications={teacher.certifications}
          active={teacher.active}
          hireDate={teacher.hire_date}
          onClick={onTeacherClick}
          actions={renderActions ? renderActions(teacher) : undefined}
        />
      ))}
    </div>
  );
};

export default TeacherList;
