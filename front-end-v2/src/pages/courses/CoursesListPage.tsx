/**
 * CoursesListPage
 *
 * Page displaying the list of available courses with filters.
 * Following FSD architecture.
 */

import React, { useState } from 'react';
import { CoursesList } from '@/features/courses';
import type { CourseFilters } from '@/features/courses';

/**
 * Page principale pour afficher la liste des cours
 */
export const CoursesListPage: React.FC = () => {
  const [filters, setFilters] = useState<CourseFilters>({});

  return (
    <div className="pf-v6-c-page__main-section">
      <div className="pf-v6-c-content">
        <div className="pf-v6-u-mb-lg">
          <h1 className="pf-v6-c-title pf-m-2xl">Nos Cours</h1>
          <p className="pf-v6-u-color-200 pf-v6-u-font-size-lg">
            Découvrez notre catalogue de cours et inscrivez-vous dès maintenant
          </p>
        </div>

        {/* Filters section - to be implemented */}
        <div className="pf-v6-u-mb-lg">
          {/* TODO: Add CourseFilters component here */}
        </div>

        {/* Courses list */}
        <CoursesList filters={filters} />
      </div>
    </div>
  );
};
