/**
 * ProfessorDetailPage
 *
 * Page de détails d'un professeur avec onglets.
 * Affiche les informations complètes, les cours assignés et les statistiques.
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useProfessor,
  useProfessorStats,
  useProfessorCourses,
  useDeleteProfessor,
  useToggleProfessorActive,
  useProfessorPhoto,
  ProfessorForm,
  getProfessorInitials,
  hasPhoto,
} from '@/features/professors';
import { Button } from '@/shared/ui/Button';

type TabType = 'info' | 'courses' | 'stats';

export const ProfessorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const professorId = id ? parseInt(id, 10) : undefined;

  // État
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Hooks
  const { data: professor, isLoading, error } = useProfessor(professorId!);
  const { data: stats } = useProfessorStats(professorId!);
  const { data: courses } = useProfessorCourses(professorId!);
  const deleteProfessor = useDeleteProfessor();
  const toggleActive = useToggleProfessorActive();
  const { uploadAvatar, deleteAvatar } = useProfessorPhoto();

  // Handlers
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!professorId) return;

    try {
      await deleteProfessor.mutateAsync(professorId);
      navigate('/professors');
    } catch (error) {
      console.error('Error deleting professor:', error);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleToggleActive = async () => {
    if (!professorId || !professor) return;

    try {
      await toggleActive.mutateAsync({
        id: professorId,
        actif: !professor.actif,
      });
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !professorId) return;

    try {
      await uploadAvatar.mutateAsync({ id: professorId, file });
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  const handleAvatarDelete = async () => {
    if (!professorId) return;

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      return;
    }

    try {
      await deleteAvatar.mutateAsync(professorId);
    } catch (error) {
      console.error('Error deleting avatar:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Error state
  if (error || !professor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Professeur introuvable
          </h2>
          <p className="text-gray-600 mb-4">
            Le professeur que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => navigate('/professors')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const initials = getProfessorInitials(professor);
  const hasProfilePhoto = hasPhoto(professor);

  const tabs = [
    { id: 'info' as TabType, label: 'Informations', icon: '👤' },
    { id: 'courses' as TabType, label: 'Cours', icon: '📚', count: courses?.length || 0 },
    { id: 'stats' as TabType, label: 'Statistiques', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link to="/professors" className="text-primary-600 hover:text-primary-700">
                Professeurs
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">{professor.nom_complet}</li>
          </ol>
        </nav>

        {/* Header avec photo et actions */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 h-32"></div>

          <div className="px-6 pb-6">
            {/* Avatar et nom */}
            <div className="relative -mt-16 mb-4 flex items-end justify-between">
              <div className="flex items-end gap-4">
                {/* Avatar */}
                <div className="relative">
                  {hasProfilePhoto ? (
                    <img
                      src={professor.photo_url}
                      alt={professor.nom_complet}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-white"
                      style={{ backgroundColor: professor.grade?.couleur || '#6B7280' }}
                    >
                      {initials}
                    </div>
                  )}

                  {/* Boutons photo */}
                  <div className="absolute bottom-0 right-0 flex gap-1">
                    <label
                      htmlFor="avatar-upload"
                      className="cursor-pointer bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition"
                      title="Changer la photo"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />

                    {hasProfilePhoto && (
                      <button
                        onClick={handleAvatarDelete}
                        className="bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition"
                        title="Supprimer la photo"
                      >
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Informations */}
                <div className="pb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {professor.nom_complet}
                  </h1>
                  {professor.specialite && (
                    <p className="text-gray-600 mt-1">{professor.specialite}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {professor.grade && (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: professor.grade.couleur || '#6B7280' }}
                      >
                        {professor.grade.nom}
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        professor.actif
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {professor.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pb-2">
                <Button
                  variant="secondary"
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier
                </Button>

                <Button
                  variant={professor.actif ? 'secondary' : 'primary'}
                  onClick={handleToggleActive}
                  disabled={toggleActive.isPending}
                >
                  {professor.actif ? 'Désactiver' : 'Activer'}
                </Button>

                <Button
                  variant="danger"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-sm font-medium text-center
                    hover:bg-gray-50 focus:z-10 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'text-primary-700 border-b-2 border-primary-700'
                        : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                    }
                  `}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-gray-900 text-xs">
                        {tab.count}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'info' && <InfoTab professor={professor} />}
            {activeTab === 'courses' && <CoursesTab courses={courses || []} />}
            {activeTab === 'stats' && <StatsTab stats={stats} />}
          </div>
        </div>

        {/* Modal d'édition */}
        {isEditModalOpen && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            title="Modifier le professeur"
            size="large"
          >
            <ProfessorForm
              mode="edit"
              professorId={professorId}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </Modal>
        )}

        {/* Modal de suppression */}
        {isDeleteModalOpen && (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Supprimer le professeur"
            size="small"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Supprimer {professor.nom_complet} ?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Cette action est irréversible. Tous les cours assignés seront également affectés.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleteProfessor.isPending}
                >
                  {deleteProfessor.isPending ? 'Suppression...' : 'Supprimer'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleteProfessor.isPending}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Tab Components
// ============================================================================

const InfoTab: React.FC<{ professor: any }> = ({ professor }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoField label="Email" value={professor.email} icon="📧" />
        <InfoField label="Téléphone" value={professor.telephone} icon="📱" />
        <InfoField label="Spécialité" value={professor.specialite} icon="🥋" />
        <InfoField
          label="Grade"
          value={professor.grade?.nom}
          badge={professor.grade?.couleur}
        />
        <InfoField
          label="Statut"
          value={professor.actif ? 'Actif' : 'Inactif'}
          badge={professor.actif ? '#10B981' : '#6B7280'}
        />
        <InfoField
          label="Membre depuis"
          value={new Date(professor.created_at).toLocaleDateString('fr-FR')}
          icon="📅"
        />
      </div>
    </div>
  );
};

const CoursesTab: React.FC<{ courses: any[] }> = ({ courses }) => {
  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun cours assigné</h3>
        <p className="mt-1 text-sm text-gray-500">
          Ce professeur n'a pas encore de cours assignés.
        </p>
      </div>
    );
  }

  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div
          key={course.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {course.type_cours}
              </h3>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {jours[course.jour_semaine]}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {course.heure_debut} - {course.heure_fin}
                </span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                course.active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {course.active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

const StatsTab: React.FC<{ stats: any }> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Cours total"
          value={stats.nombre_cours_total || 0}
          icon="📚"
          color="blue"
        />
        <StatCard
          label="Cours actifs"
          value={stats.nombre_cours_actifs || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          label="Prochains cours"
          value={stats.prochains_cours?.length || 0}
          icon="📅"
          color="purple"
        />
      </div>

      {/* Prochains cours */}
      {stats.prochains_cours && stats.prochains_cours.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prochains cours</h3>
          <div className="space-y-3">
            {stats.prochains_cours.map((course: any, index: number) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{course.type_cours}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(course.date).toLocaleDateString('fr-FR')} à {course.heure_debut}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

const InfoField: React.FC<{
  label: string;
  value?: string;
  icon?: string;
  badge?: string;
}> = ({ label, value, icon, badge }) => {
  if (!value) return null;

  return (
    <div>
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {badge ? (
          <span
            className="px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: badge }}
          >
            {value}
          </span>
        ) : (
          <span className="text-gray-900">{value}</span>
        )}
      </dd>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'purple';
}> = ({ label, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`text-4xl ${colors[color]} rounded-full p-3`}>
          {icon}
        </div>
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
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, size = 'medium', children }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorDetailPage;
