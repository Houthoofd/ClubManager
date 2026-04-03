/**
 * CourseDetailPage
 *
 * Page displaying detailed information about a specific course.
 * Following FSD architecture.
 */

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCourseDetail } from '@/features/courses';
import { COURSE_TYPE_LABELS, COURSE_LEVEL_LABELS } from '@/features/courses';

/**
 * Page de détails d'un cours
 */
export const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const courseId = id ? parseInt(id, 10) : 0;

  const { data: course, isLoading, error } = useCourseDetail(courseId);

  if (isLoading) {
    return (
      <div className="pf-v6-c-page__main-section">
        <div className="pf-v6-u-text-align-center pf-v6-u-py-2xl">
          <div className="pf-v6-c-spinner" role="progressbar">
            <span className="pf-v6-c-spinner__clipper"></span>
            <span className="pf-v6-c-spinner__lead-ball"></span>
            <span className="pf-v6-c-spinner__tail-ball"></span>
          </div>
          <p className="pf-v6-u-mt-md">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="pf-v6-c-page__main-section">
        <div className="pf-v6-c-alert pf-m-danger pf-m-inline" aria-label="Erreur">
          <div className="pf-v6-c-alert__icon">
            <i className="fas fa-fw fa-exclamation-circle" aria-hidden="true"></i>
          </div>
          <div className="pf-v6-c-alert__title">
            <h4 className="pf-v6-c-alert__title-text">Cours introuvable</h4>
          </div>
          <div className="pf-v6-c-alert__description">
            <p>{error?.message || 'Le cours demandé n\'existe pas.'}</p>
          </div>
          <div className="pf-v6-c-alert__action">
            <button
              className="pf-v6-c-button pf-m-link pf-m-inline"
              onClick={() => navigate('/courses')}
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableSpots = course.capacity - course.enrolled;
  const isFull = availableSpots <= 0;
  const isAlmostFull = availableSpots > 0 && availableSpots <= 3;

  return (
    <div className="pf-v6-c-page__main-section">
      <div className="pf-v6-c-content">
        {/* Breadcrumb */}
        <nav className="pf-v6-c-breadcrumb pf-v6-u-mb-lg" aria-label="breadcrumb">
          <ol className="pf-v6-c-breadcrumb__list">
            <li className="pf-v6-c-breadcrumb__item">
              <Link to="/courses" className="pf-v6-c-breadcrumb__link">
                Cours
              </Link>
            </li>
            <li className="pf-v6-c-breadcrumb__item">
              <span className="pf-v6-c-breadcrumb__item-divider">
                <i className="fas fa-angle-right" aria-hidden="true"></i>
              </span>
              <span className="pf-v6-c-breadcrumb__link pf-m-current" aria-current="page">
                {course.name}
              </span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="pf-v6-u-mb-lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h1 className="pf-v6-c-title pf-m-2xl pf-v6-u-mb-sm">{course.name}</h1>
              <div className="pf-v6-u-mb-sm">
                <span className="pf-v6-c-label pf-m-blue pf-v6-u-mr-sm">
                  <span className="pf-v6-c-label__content">
                    {COURSE_TYPE_LABELS[course.type]}
                  </span>
                </span>
                <span
                  className={`pf-v6-c-label pf-v6-u-mr-sm ${
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
            <div className="pf-v6-u-text-align-right">
              <div className="pf-v6-c-title pf-m-2xl pf-v6-u-primary-color-100 pf-v6-u-mb-sm">
                {course.price} €
              </div>
              <button
                className="pf-v6-c-button pf-m-primary pf-m-display-lg"
                disabled={isFull || course.status !== 'active'}
              >
                {isFull ? 'Complet' : 'S\'inscrire'}
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="pf-v6-l-grid pf-m-gutter">
          <div className="pf-v6-l-grid__item pf-m-8-col-on-lg">
            {/* Description */}
            <div className="pf-v6-c-card pf-v6-u-mb-lg">
              <div className="pf-v6-c-card__header">
                <div className="pf-v6-c-card__title">
                  <h2 className="pf-v6-c-title pf-m-lg">Description</h2>
                </div>
              </div>
              <div className="pf-v6-c-card__body">
                <p>{course.description}</p>
              </div>
            </div>

            {/* Sessions - Placeholder */}
            <div className="pf-v6-c-card">
              <div className="pf-v6-c-card__header">
                <div className="pf-v6-c-card__title">
                  <h2 className="pf-v6-c-title pf-m-lg">Prochaines sessions</h2>
                </div>
              </div>
              <div className="pf-v6-c-card__body">
                <div className="pf-v6-c-empty-state pf-m-sm">
                  <div className="pf-v6-c-empty-state__content">
                    <div className="pf-v6-c-empty-state__icon">
                      <i className="fas fa-calendar" aria-hidden="true"></i>
                    </div>
                    <div className="pf-v6-c-empty-state__body">
                      Les sessions seront disponibles prochainement.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="pf-v6-l-grid__item pf-m-4-col-on-lg">
            {/* Course info */}
            <div className="pf-v6-c-card pf-v6-u-mb-lg">
              <div className="pf-v6-c-card__header">
                <div className="pf-v6-c-card__title">
                  <h2 className="pf-v6-c-title pf-m-lg">Informations</h2>
                </div>
              </div>
              <div className="pf-v6-c-card__body">
                <dl className="pf-v6-c-description-list">
                  <div className="pf-v6-c-description-list__group">
                    <dt className="pf-v6-c-description-list__term">
                      <span className="pf-v6-c-description-list__text">Durée</span>
                    </dt>
                    <dd className="pf-v6-c-description-list__description">
                      <div className="pf-v6-c-description-list__text">
                        {course.duration} minutes
                      </div>
                    </dd>
                  </div>

                  <div className="pf-v6-c-description-list__group">
                    <dt className="pf-v6-c-description-list__term">
                      <span className="pf-v6-c-description-list__text">Capacité</span>
                    </dt>
                    <dd className="pf-v6-c-description-list__description">
                      <div className="pf-v6-c-description-list__text">
                        {course.capacity} personnes max
                      </div>
                    </dd>
                  </div>

                  <div className="pf-v6-c-description-list__group">
                    <dt className="pf-v6-c-description-list__term">
                      <span className="pf-v6-c-description-list__text">Places disponibles</span>
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
                        <span className="pf-v6-c-description-list__text">Professeur</span>
                      </dt>
                      <dd className="pf-v6-c-description-list__description">
                        <div className="pf-v6-c-description-list__text">
                          <Link to={`/professors/${course.professor.id}`} className="pf-v6-c-button pf-m-link pf-m-inline">
                            {course.professor.firstName} {course.professor.lastName}
                          </Link>
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Alert for low availability */}
            {isAlmostFull && !isFull && (
              <div className="pf-v6-c-alert pf-m-warning pf-m-inline" aria-label="Avertissement">
                <div className="pf-v6-c-alert__icon">
                  <i className="fas fa-fw fa-exclamation-triangle" aria-hidden="true"></i>
                </div>
                <div className="pf-v6-c-alert__title">
                  <h4 className="pf-v6-c-alert__title-text">Places limitées</h4>
                </div>
                <div className="pf-v6-c-alert__description">
                  <p>Il ne reste que {availableSpots} place{availableSpots > 1 ? 's' : ''} disponible{availableSpots > 1 ? 's' : ''} !</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
