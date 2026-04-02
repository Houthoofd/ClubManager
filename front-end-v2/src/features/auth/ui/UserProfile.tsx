/**
 * UserProfile Component
 *
 * Composant pour afficher et éditer le profil utilisateur.
 * Permet de modifier les informations personnelles, l'avatar, etc.
 */

import React, { useState } from 'react';
import { useProfile, useAvatar } from '../model/useAuth';
import { Button } from '@/shared/ui/Button';

export const UserProfile: React.FC = () => {
  const { profile, isLoading, updateProfile } = useProfile();
  const { uploadAvatar, deleteAvatar } = useAvatar();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    telephone: '',
    adresse: '',
    dateOfBirth: '',
  });

  // Initialiser le formulaire avec les données du profil
  React.useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        username: profile.username || '',
        email: profile.email || '',
        telephone: profile.telephone || '',
        adresse: profile.adresse || '',
        dateOfBirth: profile.dateOfBirth || '',
      });
    }
  }, [profile]);

  // Gestionnaire de changement de formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gestionnaire de soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProfile.mutateAsync(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Gestionnaire d'upload d'avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB');
      return;
    }

    try {
      await uploadAvatar.mutateAsync(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  // Gestionnaire de suppression d'avatar
  const handleAvatarDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
      return;
    }

    try {
      await deleteAvatar.mutateAsync();
    } catch (error) {
      console.error('Error deleting avatar:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Impossible de charger le profil</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header avec avatar */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 h-32"></div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="inline-block">
              <img
                src={profile.photo_url || `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&size=128&background=random`}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />

              {/* Boutons d'action sur l'avatar */}
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
                  disabled={uploadAvatar.isPending}
                />

                {profile.photo_url && (
                  <button
                    onClick={handleAvatarDelete}
                    disabled={deleteAvatar.isPending}
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
          </div>

          {/* Nom et rôle */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-gray-600">@{profile.username}</p>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              {profile.role}
            </div>
          </div>

          {/* Bouton d'édition */}
          {!isEditing && (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
            >
              Modifier le profil
            </Button>
          )}
        </div>
      </div>

      {/* Formulaire d'édition */}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Modifier les informations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prénom */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Prénom
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Nom */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Nom
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Nom d'utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Téléphone */}
            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Date de naissance */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Adresse */}
            <div className="md:col-span-2">
              <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <textarea
                id="adresse"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditing(false)}
              disabled={updateProfile.isPending}
            >
              Annuler
            </Button>
          </div>

          {/* Message d'erreur */}
          {updateProfile.isError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Une erreur est survenue lors de la mise à jour du profil.
              </p>
            </div>
          )}

          {/* Message de succès */}
          {updateProfile.isSuccess && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                Profil mis à jour avec succès !
              </p>
            </div>
          )}
        </form>
      ) : (
        /* Affichage des informations */
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Informations personnelles
          </h2>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.telephone || 'Non renseigné'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Date de naissance</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('fr-FR') : 'Non renseigné'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Statut</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.status}</dd>
            </div>

            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Adresse</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.adresse || 'Non renseigné'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Membre depuis</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Dernière connexion</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('fr-FR') : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};
