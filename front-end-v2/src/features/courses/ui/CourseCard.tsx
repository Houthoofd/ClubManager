/**
 * CourseCard Component
 *
 * Displays a course in a card format with key information.
 * Following FSD architecture and using PatternFly components.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { Course } from '../model/types';
import { COURSE_TYPE_LABELS, COURSE_LEVEL_LABELS } from '../model/types';

interface CourseCardProps {
  course: Course;
}

/**
 * Carte d'affichage d'un cours
 *
 * @example
 * ```tsx
 * <CourseCard course={course} />
 * ```
 */
export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const availableSpots = course.capacity - course.enrolled;
  const isFull = availableSpots <= 0;
  const isAlmostFull = availableSpots > 0 && availableSpots <= 3;

  return (
    <div className="pf-v6-c-card pf-m-hoverable">
      <div className="pf-v6-c-card__header">
        <div className="pf-v6-c-card__title">
          <h3>{course.name}</h3>
        </div>
        <div className="pf-v6-c-card__actions">
          <span
            className={`pf-v6-c-label ${
              course.status === 'active'
                ? 'pf-m-green'
                : course.status === 'full'
                ? 'pf-m-orange'
                : 'pf-m-grey'
            }`}
          >
            <span className="pf-v6-c-label__content">
              {course.status === 'active' && 'Actif'}
              {course.status === 'full' && 'Complet'}
              {course.status === 'inactive' && 'Inactif'}
            </span>
          </span>
        </div>
      </div>

      <div className="pf-v6-c-card__body">
        <p className="pf-v6-u-color-200 pf-v6-u-mb-md">
          {course.description.length > 120
            ? `${course.description.substring(0, 120)}...`
            : course.description}
        </p>

        <div className="pf-v6-u-mb-sm">
          <dl className="pf-v6-c-description-list pf-m-horizontal-on-sm">
            <div className="pf-v6-c-description-list__group">
              <dt className="pf-v6-c-description-list__term">
                <span className="pf-v6-c-description-list__text">Type</span>
              </dt>
              <dd className="pf-v6-c-description-list__description">
                <div className="pf-v6-c-description-list__text">
                  <span className="pf-v6-c-label pf-m-blue">
                    <span className="pf-v6-c-label__content">
                      {COURSE_TYPE_LABELS[course.type]}
                    </span>
                  </span>
                </div>
              </dd>
            </div>

            <div className="pf-v6-c-description-list__group">
              <dt className="pf-v6-c-description-list__term">
                <span className="pf-v6-c-description-list__text">Niveau</span>
              </dt>
              <dd className="pf-v6-c-description-list__description">
                <div className="pf-v6-c-description-list__text">
                  <span
                    className={`pf-v6-c-label ${
                      course.level === 'beginner'
                        ? 'pf-m-green'
                        : course.level === 'intermediate'
                        ? 'pf-m-orange'
                        : 'pf-m-red'
                    }`}
                  >
                    <span className="pf-v6-c-label__content">
                      {COURSE_LEVEL_LABELS[course.level]}
                    </span>
                  </span>
                </div>
              </dd>
            </div>

            <div className="pf-v6-c-description-list__group">
              <dt className="pf-v6-c-description-list__term">
                <span className="pf-v6-c-description-list__text">Durée</span>
              </dt>
              <dd className="pf-v6-c-description-list__description">
                <div className="pf-v6-c-description-list__text">
                  {course.duration} min
                </div>
              </dd>
            </div>

            <div className="pf-v6-c-description-list__group">
              <dt className="pf-v6-c-description-list__term">
                <span className="pf-v6-c-description-list__text">Places</span>
              </dt>
              <dd className="pf-v6-c-description-list__description">
                <div className="pf-v6-c-description-list__text">
                  <span
                    className={`pf-v6-u-font-weight-bold ${
                      isFull
                        ? 'pf-v6-u-danger-color-100'
                        : isAlmostFull
                        ? 'pf-v6-u-warning-color-100'
                        : 'pf-v6-u-success-color-100'
                    }`}
                  >
                    {availableSpots} / {course.capacity}
                  </span>
                </div>
              </dd>
            </div>

            {course.professor && (
              <div className="pf-v6-c-description-list__group">
                <dt className="pf-v6-c-description-list__term">
                  <span className="pf-v6-c-description-list__text">
                    Professeur
                  </span>
                </dt>
                <dd className="pf-v6-c-description-list__description">
                  <div className="pf-v6-c-description-list__text">
                    {course.professor.firstName} {course.professor.lastName}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="pf-v6-c-card__footer">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span className="pf-v6-u-font-size-xl pf-v6-u-font-weight-bold pf-v6-u-primary-color-100">
            {course.price} €
          </span>
          <Link
            to={`/courses/${course.id}`}
            className="pf-v6-c-button pf-m-primary"
          >
            Voir détails
          </Link>
        </div>
      </div>
    </div>
  );
};
