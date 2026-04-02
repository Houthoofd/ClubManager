/**
 * ProfessorsListPage
 *
 * Page principale de gestion des professeurs.
 * Affiche la liste/grille des professeurs avec possibilité de création, édition et suppression.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfessorsList, ProfessorForm } from '@/features/professors';
import type { ProfessorListItem, ProfessorResponse } from '@/features/professors';
import { Button } from '@/shared/ui/Button';

export const ProfessorsListPage: React.FC = () => {
  const navigate = useNavigate();

  // État pour le modal de création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // État pour le modal d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProfessorId, setSelectedProfessorId] = useState<number | undefined>();

  /**
   * Ouvre le modal de création
   */
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  /**
   * Ferme le modal de création
   */
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  /**
   * Handler pour la création réussie d'un professeur
   */
  const handleCreateSuccess = (professor: ProfessorResponse) => {
    setIsCreateModalOpen(false);
    // Optionnel: Rediriger vers la page de détails
    // navigate(`/professors/${professor.id}`);
  };

  /**
   * Ouvre le modal d'édition
   */
  const handleEdit = (professor: ProfessorListItem) => {
    setSelectedProfessorId(professor.id);
    setIsEditModalOpen(true);
  };

  /**
   * Ferme le modal d'édition
   */
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProfessorId(undefined);
  };

  /**
   * Handler pour la mise à jour réussie d'un professeur
   */
  const handleUpdateSuccess = (professor: ProfessorResponse) => {
    setIsEditModalOpen(false);
    setSelectedProfessorId(undefined);
  };

  /**
   * Handler pour clic sur un professeur (navigation vers détails)
   */
  const handleProfessorClick = (professor: ProfessorListItem) => {
    navigate(`/professors/${professor.id}`);
  };

  /**
   * Handler pour suppression (géré par ProfessorsList)
   */
  const handleDelete = (professor: ProfessorListItem) => {
    console.log('Professor deleted:', professor.nom_complet);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Professeurs</h1>
              <p className="mt-2 text-sm text-gray-600">
                Gérez les professeurs et leurs cours assignés
              </p>
            </div>

            {/* Bouton Nouveau professeur */}
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nouveau professeur
            </Button>
          </div>
        </div>

        {/* Liste des professeurs */}
        <ProfessorsList
          viewMode="grid"
          showFilters={true}
          onProfessorClick={handleProfessorClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Modal de création */}
        {isCreateModalOpen && (
          <Modal
            isOpen={isCreateModalOpen}
            onClose={handleCloseCreateModal}
            title="Nouveau professeur"
            size="large"
          >
            <ProfessorForm
              mode="create"
              onSuccess={handleCreateSuccess}
              onCancel={handleCloseCreateModal}
            />
          </Modal>
        )}

        {/* Modal d'édition */}
        {isEditModalOpen && selectedProfessorId && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            title="Modifier le professeur"
            size="large"
          >
            <ProfessorForm
              mode="edit"
              professorId={selectedProfessorId}
              onSuccess={handleUpdateSuccess}
              onCancel={handleCloseEditModal}
            />
          </Modal>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Modal Component
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'medium',
  children,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
  };

  // Fermer sur Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Content */}
        <div
          className={`
            relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}
            transform transition-all
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fermer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorsListPage;
