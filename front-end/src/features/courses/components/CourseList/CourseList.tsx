/**
 * CourseList Component
 *
 * Renders a list of course cards, optionally grouped by day.
 * Atomic component with single responsibility: display course list.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { Title, Divider } from "@patternfly/react-core";
import { useTranslation } from "react-i18next";
import { CourseCard } from "../CourseCard";
import { EmptyCourseState } from "../EmptyCourseState";
import {
  groupCoursesByDay,
  sortDays,
  sortCoursesByTime,
} from "../../utils/course-formatters";

export interface CourseItem {
  id: string | number;
  type_cours?: string;
  nom?: string;
  jour_semaine?: string;
  jour?: string;
  heure_debut: string;
  heure_fin: string;
  professeurs?: Array<{
    id?: number | string;
    nom?: string;
    prenom?: string;
    first_name?: string;
    last_name?: string;
  }>;
}

export interface CourseListProps {
  /** Array of courses to display */
  courses: CourseItem[];

  /** Whether to group courses by day */
  groupByDay?: boolean;

  /** Whether this is a filtered/searched list */
  isFiltered?: boolean;

  /** Click handler for course cards */
  onCourseClick?: (courseId: string | number) => void;

  /** Custom actions for each course card */
  renderActions?: (course: CourseItem) => React.ReactNode;

  /** Custom empty state component */
  emptyState?: React.ReactNode;

  /** Loading state */
  isLoading?: boolean;

  /** Additional CSS classes */
  className?: string;
}

export const CourseList: React.FC<CourseListProps> = ({
  courses,
  groupByDay = true,
  isFiltered = false,
  onCourseClick,
  renderActions,
  emptyState,
  isLoading = false,
  className = "",
}) => {
  const { t } = useTranslation();

  // Show loading state
  if (isLoading) {
    return null; // Parent should handle loading spinner
  }

  // Show empty state if no courses
  if (courses.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    return <EmptyCourseState isSearchResult={isFiltered} />;
  }

  // Render grouped by day
  if (groupByDay) {
    const grouped = groupCoursesByDay(courses);
    const sortedDays = sortDays(Object.keys(grouped));

    return (
      <div className={`course-list course-list--grouped ${className}`}>
        {sortedDays.map((day, index) => {
          const dayCourses = sortCoursesByTime(grouped[day]);

          return (
            <div key={day} className="course-list__day-group">
              {/* Day Header */}
              <Title
                headingLevel="h3"
                size="lg"
                style={{
                  marginTop: index > 0 ? "2rem" : "0",
                  marginBottom: "1rem",
                  textTransform: "capitalize",
                }}
              >
                {t(`courses.add.days.${day.charAt(0).toUpperCase() + day.slice(1)}`) || day}
              </Title>
              <Divider style={{ marginBottom: "1rem" }} />

              {/* Courses for this day */}
              <div className="course-list__day-courses">
                {dayCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    type={course.type_cours || ""}
                    name={course.nom}
                    day={course.jour_semaine || course.jour}
                    startTime={course.heure_debut}
                    endTime={course.heure_fin}
                    instructors={course.professeurs || []}
                    onClick={onCourseClick}
                    actions={renderActions ? renderActions(course) : undefined}
                    showDay={false}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Render flat list (no grouping)
  const sortedCourses = sortCoursesByTime(courses);

  return (
    <div className={`course-list course-list--flat ${className}`}>
      {sortedCourses.map((course) => (
        <CourseCard
          key={course.id}
          id={course.id}
          type={course.type_cours || ""}
          name={course.nom}
          day={course.jour_semaine || course.jour}
          startTime={course.heure_debut}
          endTime={course.heure_fin}
          instructors={course.professeurs || []}
          onClick={onCourseClick}
          actions={renderActions ? renderActions(course) : undefined}
          showDay={true}
        />
      ))}
    </div>
  );
};

export default CourseList;
