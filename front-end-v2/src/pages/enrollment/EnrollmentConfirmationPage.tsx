/**
 * @page EnrollmentConfirmationPage
 * @description Page de confirmation après inscription à un cours
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useEnrollment,
  EnrollmentStatusBadge,
  UnenrollButton,
  EnrollmentStatus,
} from '@/features/enrollment';

/**
 * Page de confirmation d'inscription
 *
 * Affichée après une inscription réussie, elle montre :
 * - Les détails de l'inscription
 * - Le statut (confirmé ou liste d'attente)
 * - Les informations du cours
 * - Les actions possibles
 */
export default function EnrollmentConfirmationPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();

  const {
    data: enrollment,
    isLoading,
    error,
  } = useEnrollment(enrollmentId || '');

  useEffect(() => {
    if (!enrollmentId) {
      navigate('/my-enrollments');
    }
  }, [enrollmentId, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !enrollment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">
              Inscription introuvable
            </h2>
            <p className="text-red-700 mb-6">
              Nous n'avons pas pu trouver les détails de cette inscription.
            </p>
            <button
              onClick={() => navigate('/my-enrollments')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Voir mes inscriptions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isConfirmed = enrollment.status === EnrollmentStatus.CONFIRMED;
  const isWaitlisted = enrollment.status === EnrollmentStatus.WAITLIST;
  const isPending = enrollment.status === EnrollmentStatus.PENDING;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            {isConfirmed && '🎉'}
            {isWaitlisted && '⏳'}
            {isPending && '⏱️'}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isConfirmed && 'Inscription confirmée !'}
            {isWaitlisted && 'Ajouté à la liste d\'attente'}
            {isPending && 'Inscription en attente'}
          </h1>
          <p className="text-gray-600">
            {isConfirmed &&
              'Vous êtes maintenant inscrit(e) à ce cours. Un email de confirmation vous a été envoyé.'}
            {isWaitlisted &&
              `Vous êtes en position ${enrollment.waitlistPosition || '-'} sur la liste d'attente. Nous vous notifierons dès qu'une place se libère.`}
            {isPending &&
              'Votre inscription est en attente de validation. Vous recevrez une notification dès qu\'elle sera confirmée.'}
          </p>
        </div>

        {/* Enrollment Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Détails de l'inscription
            </h2>
            <EnrollmentStatusBadge
              status={enrollment.status}
              waitlistPosition={enrollment.waitlistPosition}
              showLabel={true}
              size="md"
            />
          </div>

          {/* Course Info */}
          {enrollment.course && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {enrollment.course.name}
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Date de début:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(enrollment.course.startDate).toLocaleDateString(
                      'fr-FR',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500">Date de fin:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(enrollment.course.endDate).toLocaleDateString(
                      'fr-FR',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>

                {enrollment.course.professorName && (
                  <div>
                    <span className="text-gray-500">Professeur:</span>
                    <p className="font-medium text-gray-900">
                      {enrollment.course.professorName}
                    </p>
                  </div>
                )}

                {enrollment.course.maxCapacity && (
                  <div>
                    <span className="text-gray-500">Capacité:</span>
                    <p className="font-medium text-gray-900">
                      {enrollment.course.currentEnrollments || 0} /{' '}
                      {enrollment.course.maxCapacity} inscrits
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enrollment Meta */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Numéro d'inscription:</span>
              <span className="font-mono font-medium text-gray-900">
                {enrollment.id}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Date d'inscription:</span>
              <span className="font-medium text-gray-900">
                {new Date(enrollment.enrolledAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {enrollment.notes && (
              <div className="pt-3 border-t border-gray-200">
                <span className="text-gray-500 block mb-1">Notes:</span>
                <p className="text-gray-900 italic">{enrollment.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps / Info Boxes */}
        {isConfirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2 flex items-center">
              <span className="mr-2">✓</span>
              Prochaines étapes
            </h3>
            <ul className="text-sm text-green-800 space-y-1 ml-6 list-disc">
              <li>Consultez votre email pour les détails du cours</li>
              <li>Ajoutez les dates à votre calendrier</li>
              <li>
                Vous pouvez annuler jusqu'à 24h avant le début du cours
              </li>
            </ul>
          </div>
        )}

        {isWaitlisted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
              <span className="mr-2">ℹ️</span>
              Liste d'attente
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1 ml-6 list-disc">
              <li>
                Vous êtes en position {enrollment.waitlistPosition} sur la liste
              </li>
              <li>Vous serez notifié par email si une place se libère</li>
              <li>
                Votre position peut évoluer si d'autres personnes se désinscrivent
              </li>
              <li>
                Vous pouvez annuler votre demande à tout moment
              </li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate(`/courses/${enrollment.courseId}`)}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Voir le cours
          </button>

          <button
            onClick={() => navigate('/my-enrollments')}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Mes inscriptions
          </button>

          {(isConfirmed || isWaitlisted) && (
            <UnenrollButton
              enrollmentId={enrollment.id}
              courseName={enrollment.course?.name}
              onSuccess={() => navigate('/my-enrollments')}
              confirmMessage={
                isWaitlisted
                  ? 'Êtes-vous sûr de vouloir quitter la liste d\'attente ?'
                  : 'Êtes-vous sûr de vouloir annuler cette inscription ?'
              }
              className="flex-1"
            />
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Une question ?{' '}
            <button
              onClick={() => navigate('/contact')}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Contactez-nous
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
