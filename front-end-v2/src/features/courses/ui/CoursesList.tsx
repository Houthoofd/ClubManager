/**
 * CoursesList Component
 *
 * Displays a list of courses in a grid layout.
 * Following FSD architecture and using PatternFly components.
 */

import React from 'react';
import { useCourses } from '../model/useCourses';
import { CourseCard } from './CourseCard';
import type { CourseFilters } from '../model/types';

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

  if (isLoading) {
    return (
      <div className="pf-v6-u-text-align-center pf-v6-u-py-2xl">
        <div className="pf-v6-c-spinner" role="progressbar">
          <span className="pf-v6-c-spinner__clipper"></span>
          <span className="pf-v6-c-spinner__lead-ball"></span>
          <span className="pf-v6-c-spinner__tail-ball"></span>
        </div>
        <p className="pf-v6-u-mt-md">Chargement des cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-v6-c-alert pf-m-danger pf-m-inline" aria-label="Erreur">
        <div className="pf-v6-c-alert__icon">
          <i className="fas fa-fw fa-exclamation-circle" aria-hidden="true"></i>
        </div>
        <div className="pf-v6-c-alert__title">
          <h4 className="pf-v6-c-alert__title-text">Erreur de chargement</h4>
        </div>
        <div className="pf-v6-c-alert__description">
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="pf-v6-c-empty-state pf-m-lg">
        <div className="pf-v6-c-empty-state__content">
          <div className="pf-v6-c-empty-state__icon">
            <i className="fas fa-search" aria-hidden="true"></i>
          </div>
          <h2 className="pf-v6-c-empty-state__title">
            Aucun cours trouvé
          </h2>
          <div className="pf-v6-c-empty-state__body">
            Aucun cours ne correspond à vos critères de recherche.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pf-v6-l-grid pf-m-gutter"
      style={{
        '--pf-v6-l-grid--GridTemplateColumns--min': '300px',
      } as React.CSSProperties}
    >
      {courses.map((course) => (
        <div key={course.id} className="pf-v6-l-grid__item">
          <CourseCard course={course} />
        </div>
      ))}
    </div>
  );
};
