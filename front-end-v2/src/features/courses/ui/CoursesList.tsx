/**
 * CoursesList Component
 *
 * Displays a list of courses in a grid layout.
 * Following FSD architecture and using PatternFly components.
 */

import React from "react";
import {
  Grid,
  GridItem,
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateBody,
  Spinner,
  Alert,
  AlertActionCloseButton,
} from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";
import { useCourses } from "../model/useCourses";
import { CourseCard } from "./CourseCard";
import type { CourseFilters } from "../model/types";

interface CoursesListProps {
  filters?: CourseFilters;
}

/**
 * Liste des cours avec gestion du chargement et des erreurs
 *
 * @example
 * ```tsx
 * <CoursesList filters={{ type: 'krav-maga', level: 'beginner' }} />
 * ```
 */
export const CoursesList: React.FC<CoursesListProps> = ({ filters }) => {
  const { data: courses, isLoading, error } = useCourses(filters);
  const [showError, setShowError] = React.useState(true);

  React.useEffect(() => {
    setShowError(true);
  }, [error]);

  if (isLoading) {
    return (
      <EmptyState>
        <EmptyStateHeader
          titleText="Chargement des cours..."
          headingLevel="h2"
          icon={<EmptyStateIcon icon={Spinner} />}
        />
      </EmptyState>
    );
  }

  if (error && showError) {
    return (
      <Alert
        variant="danger"
        title="Erreur de chargement"
        actionClose={
          <AlertActionCloseButton onClose={() => setShowError(false)} />
        }
      >
        {error.message}
      </Alert>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <EmptyState>
        <EmptyStateHeader
          titleText="Aucun cours trouvé"
          headingLevel="h2"
          icon={<EmptyStateIcon icon={SearchIcon} />}
        />
        <EmptyStateBody>
          Aucun cours ne correspond à vos critères de recherche.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Grid hasGutter>
      {courses.map((course) => (
        <GridItem span={12} md={6} lg={4} key={course.id}>
          <CourseCard course={course} />
        </GridItem>
      ))}
    </Grid>
  );
};
