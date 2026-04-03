/**
 * @page MyEnrollmentsPage
 * @description Page affichant toutes les inscriptions de l'utilisateur connecté
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MyEnrollmentsList,
  EnrollmentStatus,
  type EnrollmentFilters,
  type Enrollment,
} from '@/features/enrollment';

/**
 * Page "Mes Inscriptions"
 *
 * Affiche la liste complète des inscriptions de l'utilisateur avec :
 * - Filtres par statut
 * - Recherche par nom de cours
 * - Navigation vers les détails
 */
export default function MyEnrollmentsPage() {
  const navigate = useNavigate();

  // État des filtres
  const [filters, setFilters] = useState<EnrollmentFilters>({
    status: [
      EnrollmentStatus.CONFIRMED,
      EnrollmentStatus.PENDING,
      EnrollmentStatus.WAITLIST,
    ],
  });

  // Handler pour le clic sur une inscription
  const handleEnrollmentClick = (enrollment: Enrollment) => {
    // Navigation vers le détail du cours
    navigate(`/courses/${enrollment.courseId}`);
  };

  // Handler pour changer les filtres de statut
  const handleStatusFilterChange = (statuses: EnrollmentStatus[]) => {
    setFilters((prev) => ({
      ...prev,
      status: statuses,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mes Inscriptions
        </h1>
        <p className="text-gray-600">
          Gérez vos inscriptions aux cours et suivez leur statut
        </p>
      </div>

      {/* Filtres rapides */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusFilterChange([
            EnrollmentStatus.CONFIRMED,
            EnrollmentStatus.PENDING,
            EnrollmentStatus.WAITLIST,
          ])}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filters.status?.length === 3
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes les inscriptions actives
        </button>

        <button
          onClick={() => handleStatusFilterChange([EnrollmentStatus.CONFIRMED])}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filters.status?.length === 1 && filters.status[0] === EnrollmentStatus.CONFIRMED
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Confirmées uniquement
        </button>

        <button
          onClick={() => handleStatusFilterChange([EnrollmentStatus.WAITLIST])}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filters.status?.length === 1 && filters.status[0] === EnrollmentStatus.WAITLIST
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Liste d'attente
        </button>

        <button
          onClick={() => handleStatusFilterChange([
            EnrollmentStatus.CANCELLED,
            EnrollmentStatus.REJECTED,
          ])}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filters.status?.length === 2 && filters.status.includes(EnrollmentStatus.CANCELLED)
              ? 'bg-gray-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Historique
        </button>
      </div>

      {/* Liste des inscriptions */}
      <MyEnrollmentsList
        filters={filters}
        showFilters={true}
        onEnrollmentClick={handleEnrollmentClick}
        emptyMessage="Aucune inscription trouvée. Explorez nos cours et inscrivez-vous !"
        className="bg-white rounded-lg shadow"
      />

      {/* Actions rapides */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => navigate('/courses')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Découvrir les cours
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}
