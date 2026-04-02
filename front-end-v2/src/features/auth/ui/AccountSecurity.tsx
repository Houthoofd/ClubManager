/**
 * AccountSecurity Component
 *
 * Composant pour gérer la sécurité du compte utilisateur.
 * Permet de changer le mot de passe, désactiver le compte, exporter les données (RGPD), etc.
 */

import React, { useState } from 'react';
import { useAuth, useAccountManagement } from '../model/useAuth';
import { Button } from '@/shared/ui/Button';

export const AccountSecurity: React.FC = () => {
  const { changePassword } = useAuth();
  const { deactivateAccount, requestDataExport, requestAccountDeletion } = useAccountManagement();

  // État pour le changement de mot de passe
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // État pour la désactivation du compte
  const [deactivationReason, setDeactivationReason] = useState('');
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);

  // État pour la suppression du compte
  const [deletionPassword, setDeletionPassword] = useState('');
  const [showDeletionModal, setShowDeletionModal] = useState(false);

  // Gestionnaire de changement pour le formulaire de mot de passe
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  // Validation du formulaire de mot de passe
  const validatePasswordForm = (): string | null => {
    if (!passwordForm.currentPassword) {
      return 'Veuillez entrer votre mot de passe actuel';
    }
    if (!passwordForm.newPassword) {
      return 'Veuillez entrer un nouveau mot de passe';
    }
    if (passwordForm.newPassword.length < 8) {
      return 'Le nouveau mot de passe doit contenir au moins 8 caractères';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return 'Les mots de passe ne correspondent pas';
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      return 'Le nouveau mot de passe doit être différent de l\'ancien';
    }
    return null;
  };

  // Gestionnaire de soumission du changement de mot de passe
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validatePasswordForm();
    if (error) {
      alert(error);
      return;
    }

    try {
      await changePassword.mutateAsync(passwordForm);
      // Réinitialiser le formulaire
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Mot de passe modifié avec succès !');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Erreur lors du changement de mot de passe. Veuillez vérifier votre mot de passe actuel.');
    }
  };

  // Gestionnaire d'export des données
  const handleDataExport = async () => {
    if (!window.confirm('Voulez-vous télécharger une copie de vos données personnelles ?')) {
      return;
    }

    try {
      const result = await requestDataExport.mutateAsync();
      if (result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
        alert(`Le téléchargement va commencer. Le lien expire le ${new Date(result.expiresAt).toLocaleDateString('fr-FR')}`);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Erreur lors de l\'export des données. Veuillez réessayer plus tard.');
    }
  };

  // Gestionnaire de désactivation du compte
  const handleDeactivateAccount = async () => {
    if (!deactivationReason.trim()) {
      alert('Veuillez indiquer une raison pour la désactivation');
      return;
    }

    try {
      await deactivateAccount.mutateAsync(deactivationReason);
      alert('Votre compte a été désactivé. Vous allez être déconnecté.');
      setShowDeactivationModal(false);
    } catch (error) {
      console.error('Error deactivating account:', error);
      alert('Erreur lors de la désactivation du compte.');
    }
  };

  // Gestionnaire de suppression du compte
  const handleDeleteAccount = async () => {
    if (!deletionPassword) {
      alert('Veuillez entrer votre mot de passe pour confirmer');
      return;
    }

    try {
      await requestAccountDeletion.mutateAsync(deletionPassword);
      alert('Votre demande de suppression a été enregistrée. Vous recevrez un email de confirmation.');
      setShowDeletionModal(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Erreur lors de la demande de suppression. Vérifiez votre mot de passe.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Section Changement de mot de passe */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Sécurité du compte
        </h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Changer le mot de passe
            </h3>

            <div className="space-y-4 max-w-md">
              {/* Mot de passe actuel */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  minLength={8}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 8 caractères
                </p>
              </div>

              {/* Confirmation du nouveau mot de passe */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Indicateur de force du mot de passe */}
              {passwordForm.newPassword && (
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordForm.newPassword.length < 8
                            ? 'w-1/3 bg-red-500'
                            : passwordForm.newPassword.length < 12
                            ? 'w-2/3 bg-yellow-500'
                            : 'w-full bg-green-500'
                        }`}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {passwordForm.newPassword.length < 8
                        ? 'Faible'
                        : passwordForm.newPassword.length < 12
                        ? 'Moyen'
                        : 'Fort'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button
                type="submit"
                variant="primary"
                disabled={changePassword.isPending}
              >
                {changePassword.isPending ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Section RGPD - Export des données */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Vos données personnelles (RGPD)
        </h3>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                Télécharger vos données
              </h4>
              <p className="mt-1 text-sm text-gray-500">
                Conformément au RGPD, vous pouvez télécharger une copie de toutes vos données personnelles.
              </p>
              <Button
                variant="secondary"
                onClick={handleDataExport}
                disabled={requestDataExport.isPending}
                className="mt-3"
              >
                {requestDataExport.isPending ? 'Préparation...' : 'Télécharger mes données'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section Zone de danger */}
      <div className="bg-white shadow rounded-lg p-6 border-2 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-4">
          Zone de danger
        </h3>

        <div className="space-y-6">
          {/* Désactiver le compte */}
          <div className="pb-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Désactiver le compte
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  Désactivez temporairement votre compte. Vous pourrez le réactiver plus tard en vous reconnectant.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => setShowDeactivationModal(true)}
                className="ml-4"
              >
                Désactiver
              </Button>
            </div>
          </div>

          {/* Supprimer le compte */}
          <div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Supprimer définitivement le compte
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  Supprimez définitivement votre compte et toutes vos données. Cette action est irréversible.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => setShowDeletionModal(true)}
                className="ml-4"
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de désactivation */}
      {showDeactivationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Désactiver le compte
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Votre compte sera temporairement désactivé. Vous pourrez le réactiver en vous reconnectant.
            </p>

            <div className="mb-6">
              <label htmlFor="deactivationReason" className="block text-sm font-medium text-gray-700 mb-2">
                Raison de la désactivation
              </label>
              <textarea
                id="deactivationReason"
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Pourquoi désactivez-vous votre compte ?"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDeactivateAccount}
                disabled={deactivateAccount.isPending}
              >
                {deactivateAccount.isPending ? 'Désactivation...' : 'Confirmer la désactivation'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeactivationModal(false);
                  setDeactivationReason('');
                }}
                disabled={deactivateAccount.isPending}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Supprimer définitivement le compte
                </h3>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Attention :</strong> Cette action est irréversible. Toutes vos données seront définitivement supprimées après un délai de 30 jours.
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="deletionPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer avec votre mot de passe
              </label>
              <input
                type="password"
                id="deletionPassword"
                value={deletionPassword}
                onChange={(e) => setDeletionPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Votre mot de passe"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={requestAccountDeletion.isPending}
              >
                {requestAccountDeletion.isPending ? 'Suppression...' : 'Je comprends, supprimer mon compte'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeletionModal(false);
                  setDeletionPassword('');
                }}
                disabled={requestAccountDeletion.isPending}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
