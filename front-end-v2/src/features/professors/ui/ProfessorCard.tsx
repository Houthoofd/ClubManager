/**
 * ProfessorCard Component
 *
 * Composant pour afficher les informations d'un professeur sous forme de carte.
 * Utilisé dans les listes et grilles de professeurs.
 */

import React from 'react';
import type { ProfessorListItem } from '../model/types';
import { getProfessorInitials, hasPhoto } from '../model/types';

export interface ProfessorCardProps {
  professor: ProfessorListItem;
  onClick?: (professor: ProfessorListItem) => void;
  onEdit?: (professor: ProfessorListItem) => void;
  onDelete?: (professor: ProfessorListItem) => void;
  onToggleActive?: (professor: ProfessorListItem) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const ProfessorCard: React.FC<ProfessorCardProps> = ({
  professor,
  onClick,
  onEdit,
  onDelete,
  onToggleActive,
  showActions = true,
  compact = false,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(professor);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(professor);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(professor);
    }
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleActive) {
      onToggleActive(professor);
    }
  };

  const initials = getProfessorInitials(professor);
  const hasProfilePhoto = hasPhoto(professor);

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${!professor.actif ? 'opacity-60' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={handleClick}
    >
      {/* Header avec photo et statut */}
      <div className="flex items-start gap-3 mb-3">
        {/* Photo ou initiales */}
        <div className="flex-shrink-0">
          {hasProfilePhoto ? (
            <img
              src={professor.photo_url}
              alt={professor.nom_complet}
              className={`
                rounded-full object-cover
                ${compact ? 'w-12 h-12' : 'w-16 h-16'}
              `}
            />
          ) : (
            <div
              className={`
                rounded-full flex items-center justify-center font-semibold text-white
                ${compact ? 'w-12 h-12 text-sm' : 'w-16 h-16 text-lg'}
              `}
              style={{
                backgroundColor: professor.grade_couleur || '#6B7280',
              }}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Informations principales */}
        <div className="flex-1 min-w-0">
          <h3
            className={`
              font-semibold text-gray-900 truncate
              ${compact ? 'text-base' : 'text-lg'}
            `}
          >
            {professor.nom_complet}
          </h3>

          {professor.specialite && (
            <p className="text-sm text-gray-600 truncate">
              {professor.specialite}
            </p>
          )}

          {professor.grade_nom && (
            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {professor.grade_nom}
            </div>
          )}
        </div>

        {/* Badge de statut */}
        <div className="flex-shrink-0">
          {professor.actif ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Actif
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Inactif
            </span>
          )}
        </div>
      </div>

      {/* Informations de contact */}
      {!compact && (
        <div className="space-y-1 mb-3">
          {professor.email && (
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="truncate">{professor.email}</span>
            </div>
          )}

          {professor.telephone && (
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span className="truncate">{professor.telephone}</span>
            </div>
          )}
        </div>
      )}

      {/* Statistiques */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-600">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <span>
            {professor.nombre_cours} cours{professor.nombre_cours !== 1 ? '' : ''}
          </span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
                title="Modifier"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}

            {onToggleActive && (
              <button
                onClick={handleToggleActive}
                className={`
                  p-1.5 rounded transition-colors
                  ${
                    professor.actif
                      ? 'hover:bg-gray-100 text-gray-600 hover:text-orange-600'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-green-600'
                  }
                `}
                title={professor.actif ? 'Désactiver' : 'Activer'}
              >
                {professor.actif ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </button>
            )}

            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                title="Supprimer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
