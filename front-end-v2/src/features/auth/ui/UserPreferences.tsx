/**
 * UserPreferences Component
 *
 * Composant pour gérer les préférences utilisateur.
 * Permet de modifier les notifications, la langue, le thème, etc.
 */

import React, { useState, useEffect } from 'react';
import { usePreferences } from '../model/useAuth';
import { Button } from '@/shared/ui/Button';

export const UserPreferences: React.FC = () => {
  const { preferences, isLoading, updatePreferences } = usePreferences();

  const [formData, setFormData] = useState({
    emailNotifications: false,
    smsNotifications: false,
    language: 'fr',
    theme: 'light',
  });

  // Initialiser le formulaire avec les préférences actuelles
  useEffect(() => {
    if (preferences) {
      setFormData({
        emailNotifications: preferences.emailNotifications,
        smsNotifications: preferences.smsNotifications,
        language: preferences.language,
        theme: preferences.theme,
      });
    }
  }, [preferences]);

  // Gestionnaire de changement de checkbox
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Gestionnaire de changement de select
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gestionnaire de soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updatePreferences.mutateAsync(formData);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Préférences
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section Notifications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Notifications
            </h3>
            <div className="space-y-4">
              {/* Notifications par email */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="emailNotifications"
                    name="emailNotifications"
                    type="checkbox"
                    checked={formData.emailNotifications}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                    Notifications par email
                  </label>
                  <p className="text-sm text-gray-500">
                    Recevoir des notifications sur les cours, paiements et événements importants par email.
                  </p>
                </div>
              </div>

              {/* Notifications par SMS */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="smsNotifications"
                    name="smsNotifications"
                    type="checkbox"
                    checked={formData.smsNotifications}
                    onChange={handleCheckboxChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="smsNotifications" className="font-medium text-gray-700">
                    Notifications par SMS
                  </label>
                  <p className="text-sm text-gray-500">
                    Recevoir des notifications urgentes par SMS (rappels de cours, annulations).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section Langue */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Langue
            </h3>
            <div className="max-w-xs">
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Langue de l'interface
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleSelectChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>

          {/* Section Apparence */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Apparence
            </h3>
            <div className="max-w-xs">
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                Thème
              </label>
              <select
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleSelectChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="auto">Automatique (selon système)</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Le thème automatique s'adapte aux préférences de votre système.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={updatePreferences.isPending}
              >
                {updatePreferences.isPending ? 'Enregistrement...' : 'Enregistrer les préférences'}
              </Button>
            </div>

            {/* Message d'erreur */}
            {updatePreferences.isError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Une erreur est survenue lors de la mise à jour des préférences.
                </p>
              </div>
            )}

            {/* Message de succès */}
            {updatePreferences.isSuccess && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Préférences mises à jour avec succès !
                </p>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Section Informations supplémentaires */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              À propos de vos préférences
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Vos préférences sont enregistrées sur votre compte et synchronisées sur tous vos appareils.
                Vous pouvez les modifier à tout moment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
