/**
 * ProfessorForm Component
 *
 * Composant de formulaire complet pour créer et modifier des professeurs.
 * Gère la validation en temps réel, l'upload de photos, et l'intégration avec l'API.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ProfessorResponse,
  CreateProfessorData,
  ProfessorValidationErrors,
} from '../model/types';
import {
  useCreateProfessor,
  useUpdateProfessor,
  useProfessor,
  useCheckEmailExists,
} from '../model/useProfessors';
import { useProfessorPhoto } from '../model/useProfessors';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ProfessorFormProps {
  professorId?: number;
  mode: 'create' | 'edit';
  onSuccess?: (professor: ProfessorResponse) => void;
  onCancel?: () => void;
}

interface FormData {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  specialite: string;
  grade_id: string;
  actif: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const SPECIALITE_SUGGESTIONS = [
  'Karaté',
  'Judo',
  'Taekwondo',
  'Aikido',
  'Jiu-Jitsu',
  'Kung-Fu',
  'Muay Thai',
  'Krav Maga',
  'Boxe',
  'MMA',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+33|0)[1-9](\d{2}){4}$/;

const DEBOUNCE_DELAY = 500; // ms

// ============================================================================
// ProfessorForm Component
// ============================================================================

export const ProfessorForm: React.FC<ProfessorFormProps> = ({
  professorId,
  mode,
  onSuccess,
  onCancel,
}) => {
  // ============================================================================
  // Hooks & State
  // ============================================================================

  const [formData, setFormData] = useState<FormData>({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    specialite: '',
    grade_id: '',
    actif: true,
  });

  const [errors, setErrors] = useState<ProfessorValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string>('');
  const [showSpecialiteSuggestions, setShowSpecialiteSuggestions] =
    useState(false);
  const [emailCheckDebounce, setEmailCheckDebounce] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const specialiteInputRef = useRef<HTMLInputElement>(null);
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout>();

  // React Query hooks
  const { professor: existingProfessor, isLoading: isLoadingProfessor } =
    useProfessor(professorId || 0);
  const createProfessor = useCreateProfessor();
  const updateProfessor = useUpdateProfessor();
  const { uploadPhoto, deletePhoto } = useProfessorPhoto();

  // Email validation hook (debounced)
  const { exists: emailExists, isLoading: isCheckingEmail } =
    useCheckEmailExists(emailCheckDebounce, professorId, emailCheckDebounce !== '');

  // ============================================================================
  // Effects
  // ============================================================================

  // Load existing professor data in edit mode
  useEffect(() => {
    if (mode === 'edit' && existingProfessor) {
      setFormData({
        prenom: existingProfessor.prenom || '',
        nom: existingProfessor.nom || '',
        email: existingProfessor.email || '',
        telephone: existingProfessor.telephone || '',
        specialite: existingProfessor.specialite || '',
        grade_id: existingProfessor.grade?.id?.toString() || '',
        actif: existingProfessor.actif ?? true,
      });

      if (existingProfessor.photo_url) {
        setExistingPhotoUrl(existingProfessor.photo_url);
      }
    }
  }, [mode, existingProfessor]);

  // Debounce email check
  useEffect(() => {
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    if (formData.email && EMAIL_REGEX.test(formData.email)) {
      emailCheckTimeoutRef.current = setTimeout(() => {
        setEmailCheckDebounce(formData.email);
      }, DEBOUNCE_DELAY);
    } else {
      setEmailCheckDebounce('');
    }

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [formData.email]);

  // Update email error when check completes
  useEffect(() => {
    if (emailCheckDebounce && emailExists && touched.email) {
      setErrors((prev) => ({
        ...prev,
        email: 'Cet email est déjà utilisé par un autre professeur',
      }));
    } else if (emailCheckDebounce && !emailExists && errors.email?.includes('déjà utilisé')) {
      setErrors((prev) => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  }, [emailExists, emailCheckDebounce, touched.email]);

  // ============================================================================
  // Validation
  // ============================================================================

  const validateField = useCallback(
    (name: keyof FormData, value: string | boolean): string | undefined => {
      switch (name) {
        case 'prenom':
          if (!value || (typeof value === 'string' && value.trim().length === 0)) {
            return 'Le prénom est requis';
          }
          if (typeof value === 'string' && value.trim().length < 2) {
            return 'Le prénom doit contenir au moins 2 caractères';
          }
          break;

        case 'nom':
          if (!value || (typeof value === 'string' && value.trim().length === 0)) {
            return 'Le nom est requis';
          }
          if (typeof value === 'string' && value.trim().length < 2) {
            return 'Le nom doit contenir au moins 2 caractères';
          }
          break;

        case 'email':
          if (value && typeof value === 'string' && value.trim().length > 0) {
            if (!EMAIL_REGEX.test(value.trim())) {
              return 'Format d\'email invalide';
            }
          }
          break;

        case 'telephone':
          if (value && typeof value === 'string' && value.trim().length > 0) {
            const cleanPhone = value.trim().replace(/\s/g, '');
            if (!PHONE_REGEX.test(cleanPhone)) {
              return 'Format de téléphone invalide (ex: 0612345678)';
            }
          }
          break;

        case 'specialite':
          if (value && typeof value === 'string' && value.trim().length > 100) {
            return 'La spécialité ne peut pas dépasser 100 caractères';
          }
          break;

        default:
          break;
      }

      return undefined;
    },
    [],
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: ProfessorValidationErrors = {};

    // Required fields
    const prenomError = validateField('prenom', formData.prenom);
    if (prenomError) newErrors.prenom = prenomError;

    const nomError = validateField('nom', formData.nom);
    if (nomError) newErrors.nom = nomError;

    // Optional fields with validation
    if (formData.email) {
      const emailError = validateField('email', formData.email);
      if (emailError) newErrors.email = emailError;
      if (emailExists) {
        newErrors.email = 'Cet email est déjà utilisé par un autre professeur';
      }
    }

    if (formData.telephone) {
      const telephoneError = validateField('telephone', formData.telephone);
      if (telephoneError) newErrors.telephone = telephoneError;
    }

    if (formData.specialite) {
      const specialiteError = validateField('specialite', formData.specialite);
      if (specialiteError) newErrors.specialite = specialiteError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, emailExists, validateField]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof ProfessorValidationErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof ProfessorValidationErrors];
        return newErrors;
      });
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate on blur
    const error = validateField(name as keyof FormData, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({
        ...prev,
        general: 'Le fichier doit être une image',
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        general: 'L\'image ne peut pas dépasser 5 MB',
      }));
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingPhoto = async () => {
    if (!professorId || !existingPhotoUrl) return;

    try {
      await deletePhoto.mutateAsync(professorId);
      setExistingPhotoUrl('');
      setSuccessMessage('Photo supprimée avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: 'Erreur lors de la suppression de la photo',
      }));
    }
  };

  const handleSpecialiteClick = () => {
    setShowSpecialiteSuggestions(true);
  };

  const handleSpecialiteSuggestionSelect = (suggestion: string) => {
    setFormData((prev) => ({ ...prev, specialite: suggestion }));
    setShowSpecialiteSuggestions(false);
  };

  const handleClickOutsideSpecialite = useCallback((e: MouseEvent) => {
    if (
      specialiteInputRef.current &&
      !specialiteInputRef.current.contains(e.target as Node)
    ) {
      setShowSpecialiteSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (showSpecialiteSuggestions) {
      document.addEventListener('mousedown', handleClickOutsideSpecialite);
      return () => {
        document.removeEventListener('mousedown', handleClickOutsideSpecialite);
      };
    }
  }, [showSpecialiteSuggestions, handleClickOutsideSpecialite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      prenom: true,
      nom: true,
      email: true,
      telephone: true,
      specialite: true,
      grade_id: true,
    });

    // Validate
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare data
      const data: CreateProfessorData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim() || undefined,
        telephone: formData.telephone.trim() || undefined,
        specialite: formData.specialite.trim() || undefined,
        grade_id: formData.grade_id ? parseInt(formData.grade_id, 10) : undefined,
        actif: formData.actif,
      };

      let result: ProfessorResponse;

      if (mode === 'create') {
        // Create professor
        const createResult = await createProfessor.mutateAsync(data);
        result = createResult.professor;

        // Upload photo if provided
        if (photoFile && result.id) {
          await uploadPhoto.mutateAsync({
            id: result.id,
            file: photoFile,
          });
        }

        setSuccessMessage('Professeur créé avec succès !');
      } else if (mode === 'edit' && professorId) {
        // Update professor
        const updateResult = await updateProfessor.mutateAsync({
          id: professorId,
          data,
        });
        result = updateResult.professor;

        // Upload new photo if provided
        if (photoFile && professorId) {
          await uploadPhoto.mutateAsync({
            id: professorId,
            file: photoFile,
          });
        }

        setSuccessMessage('Professeur mis à jour avec succès !');
      } else {
        throw new Error('Invalid mode or missing professor ID');
      }

      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(result);
        }, 1000);
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      setErrors({
        general:
          error?.message ||
          'Une erreur est survenue lors de l\'enregistrement',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // ============================================================================
  // Filter specialite suggestions
  // ============================================================================

  const filteredSuggestions = SPECIALITE_SUGGESTIONS.filter((suggestion) =>
    suggestion.toLowerCase().includes(formData.specialite.toLowerCase()),
  );

  // ============================================================================
  // Render
  // ============================================================================

  if (mode === 'edit' && isLoadingProfessor) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Créer un professeur' : 'Modifier le professeur'}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {mode === 'create'
              ? 'Remplissez les informations pour créer un nouveau professeur'
              : 'Modifiez les informations du professeur'}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <svg
              className="w-5 h-5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <svg
              className="w-5 h-5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{errors.general}</span>
          </div>
        )}

        {/* Form Fields */}
        <div className="bg-white px-6 py-6 space-y-6">
          {/* Row 1: Prénom & Nom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prénom */}
            <div>
              <label
                htmlFor="prenom"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Prénom <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`
                    w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.prenom && touched.prenom ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="Jean"
                  autoComplete="given-name"
                />
                {errors.prenom && touched.prenom && (
                  <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>
                )}
              </div>
            </div>

            {/* Nom */}
            <div>
              <label
                htmlFor="nom"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nom <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`
                    w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.nom && touched.nom ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="Dupont"
                  autoComplete="family-name"
                />
                {errors.nom && touched.nom && (
                  <p className="mt-1 text-sm text-red-600">{errors.nom}</p>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Email & Téléphone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
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
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`
                    w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.email && touched.email ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="jean.dupont@example.com"
                  autoComplete="email"
                />
                {isCheckingEmail && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label
                htmlFor="telephone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
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
                </div>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`
                    w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.telephone && touched.telephone ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="0612345678"
                  autoComplete="tel"
                />
              </div>
              {errors.telephone && touched.telephone && (
                <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>
              )}
            </div>
          </div>

          {/* Row 3: Spécialité & Grade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Spécialité */}
            <div className="relative" ref={specialiteInputRef}>
              <label
                htmlFor="specialite"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Spécialité
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="specialite"
                  name="specialite"
                  value={formData.specialite}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onFocus={handleSpecialiteClick}
                  disabled={isSubmitting}
                  className={`
                    w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.specialite && touched.specialite ? 'border-red-500' : 'border-gray-300'}
                  `}
                  placeholder="Karaté"
                  autoComplete="off"
                />
              </div>
              {errors.specialite && touched.specialite && (
                <p className="mt-1 text-sm text-red-600">{errors.specialite}</p>
              )}

              {/* Suggestions dropdown */}
              {showSpecialiteSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSpecialiteSuggestionSelect(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grade */}
            <div>
              <label
                htmlFor="grade_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Grade
              </label>
              <select
                id="grade_id"
                name="grade_id"
                value={formData.grade_id}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`
                  w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${errors.grade_id && touched.grade_id ? 'border-red-500' : 'border-gray-300'}
                `}
              >
                <option value="">Sélectionner un grade</option>
                {/* TODO: Integrate with lookup service for grades */}
                <option value="1">Ceinture blanche</option>
                <option value="2">Ceinture jaune</option>
                <option value="3">Ceinture orange</option>
                <option value="4">Ceinture verte</option>
                <option value="5">Ceinture bleue</option>
                <option value="6">Ceinture marron</option>
                <option value="7">Ceinture noire</option>
              </select>
              {errors.grade_id && touched.grade_id && (
                <p className="mt-1 text-sm text-red-600">{errors.grade_id}</p>
              )}
            </div>
          </div>

          {/* Row 4: Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            <div className="flex items-start space-x-4">
              {/* Preview */}
              <div className="flex-shrink-0">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isSubmitting}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ) : existingPhotoUrl ? (
                  <div className="relative">
                    <img
                      src={existingPhotoUrl}
                      alt="Photo actuelle"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveExistingPhoto}
                      disabled={isSubmitting || deletePhoto.isPending}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="photo"
                  name="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Choisir une photo
                  </div>
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPG, GIF jusqu'à 5 MB
                </p>
              </div>
            </div>
          </div>

          {/* Row 5: Actif Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label
                htmlFor="actif"
                className="text-sm font-medium text-gray-700"
              >
                Statut
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {formData.actif
                  ? 'Le professeur est actif et visible'
                  : 'Le professeur est inactif et masqué'}
              </p>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                role="switch"
                aria-checked={formData.actif}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, actif: !prev.actif }))
                }
                disabled={isSubmitting}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                  ${formData.actif ? 'bg-green-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${formData.actif ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
              <span
                className={`ml-3 text-sm font-medium ${
                  formData.actif ? 'text-green-700' : 'text-gray-700'
                }`}
              >
                {formData.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || isCheckingEmail}
            className="px-6 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enregistrement...
              </>
            ) : (
              <>
                {mode === 'create' ? 'Créer' : 'Enregistrer'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfessorForm;
