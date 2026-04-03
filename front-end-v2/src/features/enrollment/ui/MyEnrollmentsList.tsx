/**
 * Enrollment Feature - MyEnrollmentsList Component
 *
 * List component for displaying the current user's enrollments.
 * Includes filtering, sorting, and status-based views.
 */

import React, { useState } from 'react';
import { useMyEnrollments } from '../model/useEnrollment';
import { EnrollmentStatus, formatEnrollmentDate } from '../model/types';
import { EnrollmentStatusBadge } from './EnrollmentStatusBadge';
import { UnenrollButton } from './UnenrollButton';
import type { EnrollmentFilters } from '../model/types';

// ============================================================================
// Props
// ============================================================================

export interface MyEnrollmentsListProps {
  /** Initial filters to apply */
  initialFilters?: EnrollmentFilters;

  /** Show filter controls */
  showFilters?: boolean;

  /** Show unenroll button for active enrollments */
  showUnenrollButton?: boolean;

  /** Custom className */
  className?: string;

  /** Callback when enrollment is clicked */
  onEnrollmentClick?: (enrollmentId: number) => void;

  /** Show course details */
  showCourseDetails?: boolean;

  /** Empty state message */
  emptyMessage?: string;
}

// ============================================================================
// MyEnrollmentsList Component
// ============================================================================

export const MyEnrollmentsList: React.FC<MyEnrollmentsListProps> = ({
  initialFilters,
  showFilters = true,
  showUnenrollButton = true,
  className = '',
  onEnrollmentClick,
  showCourseDetails = true,
  emptyMessage = 'Vous n\'avez aucune inscription pour le moment.',
}) => {
  // ========================================
  // State
  // ========================================

  const [filters, setFilters] = useState<EnrollmentFilters>({
    includeCourse: showCourseDetails,
    sortBy: 'enrolledAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  const [selectedStatus, setSelectedStatus] = useState<EnrollmentStatus | 'all'>('all');

  // ========================================
  // Hooks
  // ========================================

  const { data: enrollments, isLoading, error } = useMyEnrollments(filters);

  // ========================================
  // Handlers
  // ========================================

  const handleStatusFilter = (status: EnrollmentStatus | 'all') => {
    setSelectedStatus(status);
    setFilters({
      ...filters,
      status: status === 'all' ? undefined : status,
    });
  };

  const handleSortChange = (sortBy: EnrollmentFilters['sortBy']) => {
    setFilters({
      ...filters,
      sortBy,
    });
  };

  // ========================================
  // Computed Values
  // ========================================

  const activeEnrollments = enrollments?.filter(
    e => e.status === EnrollmentStatus.CONFIRMED || e.status === EnrollmentStatus.PENDING
  ) || [];

  const waitlistedEnrollments = enrollments?.filter(
    e => e.status === EnrollmentStatus.WAITLIST
  ) || [];

  const pastEnrollments = enrollments?.filter(
    e => e.status === EnrollmentStatus.CANCELLED || e.status === EnrollmentStatus.REJECTED
  ) || [];

  // ========================================
  // Render Helpers
  // ========================================

  const renderEnrollmentCard = (enrollment: typeof enrollments[0]) => {
    const canUnenroll = enrollment.status === EnrollmentStatus.CONFIRMED ||
                        enrollment.status === EnrollmentStatus.PENDING ||
                        enrollment.status === EnrollmentStatus.WAITLIST;

    return (
      <div
        key={enrollment.id}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          {/* Course Info */}
          <div
            className="flex-1 cursor-pointer"
            onClick={() => onEnrollmentClick?.(enrollment.id)}
          >
            {enrollment.course && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {enrollment.course.title}
                </h3>
                {enrollment.course.code && (
                  <p className="text-sm text-gray-500 mb-2">
                    Code: {enrollment.course.code}
                  </p>
                )}
                {enrollment.course.professorName && (
                  <p className="text-sm text-gray-600 mb-2">
                    Professeur: {enrollment.course.professorName}
                  </p>
                )}
                {enrollment.course.schedule && (
                  <p className="text-sm text-gray-600 mb-2">
                    📅 {enrollment.course.schedule}
                  </p>
                )}
                {enrollment.course.location && (
                  <p className="text-sm text-gray-600 mb-2">
                    📍 {enrollment.course.location}
                  </p>
                )}
              </>
            )}

            {/* Enrollment Info */}
            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-500">
                Inscrit le: {formatEnrollmentDate(enrollment.enrolledAt)}
              </p>
              {enrollment.notes && (
                <p className="text-sm text-gray-600 italic">
                  Note: {enrollment.notes}
                </p>
              )}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex flex-col items-end space-y-2 ml-4">
            <EnrollmentStatusBadge
              status={enrollment.status}
              waitlistPosition={enrollment.waitlistPosition}
              size="medium"
            />

            {showUnenrollButton && canUnenroll && (
              <UnenrollButton
                enrollmentId={enrollment.id}
                courseId={enrollment.courseId}
                variant="outline"
                size="small"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // Render Loading State
  // ========================================

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // ========================================
  // Render Error State
  // ========================================

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-800">
          Erreur lors du chargement des inscriptions: {error.message}
        </p>
      </div>
    );
  }

  // ========================================
  // Render Empty State
  // ========================================

  if (!enrollments || enrollments.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-600 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  // ========================================
  // Render Main Content
  // ========================================

  return (
    <div className={className}>
      {/* Filters */}
      {showFilters && (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Statut:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusFilter('all')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous ({enrollments.length})
                </button>
                <button
                  onClick={() => handleStatusFilter(EnrollmentStatus.CONFIRMED)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedStatus === EnrollmentStatus.CONFIRMED
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Confirmé ({activeEnrollments.length})
                </button>
                <button
                  onClick={() => handleStatusFilter(EnrollmentStatus.WAITLIST)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedStatus === EnrollmentStatus.WAITLIST
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Liste d'attente ({waitlistedEnrollments.length})
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-sm font-medium text-gray-700">Trier par:</span>
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value as EnrollmentFilters['sortBy'])}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="enrolledAt">Date d'inscription</option>
                <option value="updatedAt">Dernière mise à jour</option>
                <option value="status">Statut</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Enrollments List */}
      <div className="space-y-4">
        {enrollments.map(renderEnrollmentCard)}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total: {enrollments.length} inscription(s)</span>
          {activeEnrollments.length > 0 && (
            <span className="text-green-600 font-medium">
              {activeEnrollments.length} active(s)
            </span>
          )}
          {waitlistedEnrollments.length > 0 && (
            <span className="text-blue-600 font-medium">
              {waitlistedEnrollments.length} en attente
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyEnrollmentsList;
