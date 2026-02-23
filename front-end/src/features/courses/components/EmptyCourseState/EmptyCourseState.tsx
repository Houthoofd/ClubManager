/**
 * EmptyCourseState Component
 *
 * Displays appropriate empty state based on context (no data vs no search results).
 * Atomic component with single responsibility: render empty states.
 * Fully internationalized with i18n support.
 */

import React from "react";
import { EmptyState, Title, EmptyStateBody } from "@patternfly/react-core";
import { CalendarAltIcon, SearchIcon } from '@/shared/icons';
import { useTranslation } from "react-i18next";

export interface EmptyCourseStateProps {
  /** Whether this is a search result (vs initial empty state) */
  isSearchResult?: boolean;

  /** Custom title override */
  title?: string;

  /** Custom description override */
  description?: string;

  /** Additional actions or content */
  children?: React.ReactNode;
}

export const EmptyCourseState: React.FC<EmptyCourseStateProps> = ({
  isSearchResult = false,
  title,
  description,
  children,
}) => {
  const { t } = useTranslation();

  const defaultTitle = isSearchResult
    ? t("courses.list.noCourses")
    : t("courses.manage.noCourses");

  const defaultDescription = isSearchResult
    ? t("common.messages.noResults")
    : t("courses.manage.noCoursesMessage");

  const Icon = isSearchResult ? SearchIcon : CalendarAltIcon;

  return (
    <EmptyState>
      <Icon size="xl" style={{ marginBottom: "16px", fontSize: "48px" }} />
      <Title headingLevel="h4" size="lg">
        {title || defaultTitle}
      </Title>
      <EmptyStateBody>{description || defaultDescription}</EmptyStateBody>
      {children}
    </EmptyState>
  );
};

export default EmptyCourseState;
