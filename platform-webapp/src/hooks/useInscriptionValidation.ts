import React, { useState, useCallback } from 'react';
import { FormData } from '../types/inscriptionTypes';
import { userInscriptionSchema } from '../../../packages/types/dist/index';

interface ValidationState {
  prenom: { isValid: boolean; message: string };
  nom: { isValid: boolean; message: string };
  email: { isValid: boolean; message: string };
  password: { isValid: boolean; message: string };
  confirmPassword: { isValid: boolean; message: string };
  date_naissance: { isValid: boolean; message: string };
  abonnement: { isValid: boolean; message: string };
  genre: { isValid: boolean; message: string };
}

// État initial avec toutes les propriétés définies
const initialValidationState: ValidationState = {
  prenom: { isValid: false, message: '' },
  nom: { isValid: false, message: '' },
  email: { isValid: false, message: '' },
  password: { isValid: false, message: '' },
  confirmPassword: { isValid: false, message: '' },
  date_naissance: { isValid: false, message: '' },
  abonnement: { isValid: false, message: '' },
  genre: { isValid: false, message: '' }
};

export const useInscriptionValidation = (form: FormData, setPasswordStrength: (strength: number) => void) => {
  const [validation, setValidation] = useState<ValidationState>(initialValidationState);

  // Calculateur de force du mot de passe
  const calculatePasswordStrength = useCallback((password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 15;
    if (/[@$!%*?&]/.test(password)) strength += 15;
    return Math.min(100, strength);
  }, []);

  // Validation d'un champ individuel en utilisant le schéma Zod
  const validateField = useCallback((fieldName: string, value: string) => {
    let fieldValidation: { isValid: boolean; message: string };

    // Validation spéciale pour la confirmation de mot de passe
    if (fieldName === 'confirmPassword') {
      if (!value || value.length === 0) {
        fieldValidation = { isValid: false, message: 'Confirmation du mot de passe requise' };
      } else if (value !== form.password) {
        fieldValidation = { isValid: false, message: 'Les mots de passe ne correspondent pas' };
      } else {
        fieldValidation = { isValid: true, message: '' };
      }
    }
    // Validation spéciale pour les champs select (abonnement/genre)
    else if (fieldName === 'abonnement') {
      if (!value || value.trim().length === 0) {
        fieldValidation = { isValid: false, message: 'Abonnement requis' };
      } else {
        fieldValidation = { isValid: true, message: '' };
      }
    }
    else if (fieldName === 'genre') {
      if (!value || value.trim().length === 0) {
        fieldValidation = { isValid: false, message: 'Genre requis' };
      } else {
        fieldValidation = { isValid: true, message: '' };
      }
    }
    // Validation avec le schéma Zod pour les autres champs
    else {
      try {
        // Préparer les données pour la validation Zod
        const testData = {
          prenom: fieldName === 'prenom' ? value : form.prenom || 'test',
          nom: fieldName === 'nom' ? value : form.nom || 'test',
          nom_utilisateur: form.nom_utilisateur || 'test.user',
          email: fieldName === 'email' ? value : form.email || 'test@example.com',
          password: fieldName === 'password' ? value : form.password || 'TestPass123!',
          date: fieldName === 'date_naissance' ? value : form.date_naissance || '2000-01-01', // CORRECTION: utiliser 'date'
          genre_id: Number(form.genre) || 1,
          abonnement_id: Number(form.abonnement) || 1,
          date_inscription: new Date().toISOString().split('T')[0],
          status_id: 1,
          grade_id: 1
        };

        // Valider le champ spécifique avec le schéma Zod
        const fieldSchema = userInscriptionSchema.shape[fieldName === 'date_naissance' ? 'date' : fieldName as keyof typeof userInscriptionSchema.shape];
        
        if (fieldSchema) {
          const valueToValidate = fieldName === 'email' ? value.toLowerCase() : 
                                 fieldName === 'date_naissance' ? value : value;
          fieldSchema.parse(valueToValidate);
          fieldValidation = { isValid: true, message: '' };
          
          // Calculer la force du mot de passe si c'est le champ password
          if (fieldName === 'password') {
            const strength = calculatePasswordStrength(value);
            setPasswordStrength(strength);
          }
        } else {
          // Fallback pour les champs non trouvés dans le schéma
          fieldValidation = { isValid: value.trim().length > 0, message: value.trim().length > 0 ? '' : 'Ce champ est requis' };
        }
        
      } catch (error: any) {
        // Extraire le message d'erreur Zod
        const zodError = error.errors?.[0]?.message || error.message || 'Valeur invalide';
        fieldValidation = { isValid: false, message: zodError };
        
        // Réinitialiser la force du mot de passe si c'est le champ password et qu'il est invalide
        if (fieldName === 'password') {
          setPasswordStrength(0);
        }
      }
    }

    // Mettre à jour l'état de validation
    setValidation(prev => ({
      ...prev,
      [fieldName]: fieldValidation
    }));

    // CORRECTION: Re-valider la confirmation de mot de passe si le mot de passe principal change
    if (fieldName === 'password' && form.confirmPassword) {
      const confirmValidation = form.confirmPassword === value 
        ? { isValid: true, message: '' }
        : { isValid: false, message: 'Les mots de passe ne correspondent pas' };
      
      setValidation(prev => ({
        ...prev,
        confirmPassword: confirmValidation
      }));
    }

    // NOUVEAU: Si on modifie confirmPassword, vérifier immédiatement avec le password actuel
    if (fieldName === 'confirmPassword') {
      // La validation est déjà faite ci-dessus
      return;
    }
  }, [form, calculatePasswordStrength, setPasswordStrength]);

  // Vérifier si le formulaire est complet et valide
  const checkFormComplete = useCallback(() => {
    const requiredFields = [
      'prenom', 'nom', 'email', 'password', 'confirmPassword', 
      'date_naissance', 'abonnement', 'genre'
    ];
    
    // Vérifier que tous les champs requis sont remplis
    const isComplete = requiredFields.every(field => {
      const value = form[field as keyof FormData];
      return value !== undefined && value !== null && String(value).trim() !== '';
    });

    // Vérifier que tous les champs sont valides
    const allFieldsValid = requiredFields.every(field => {
      const fieldValidation = validation[field as keyof ValidationState];
      const isValid = fieldValidation?.isValid ?? false;
      
      // Debug pour identifier le champ qui pose problème
      if (!isValid) {
        console.log(`❌ Champ invalide: ${field}`, {
          value: form[field as keyof FormData],
          validation: fieldValidation
        });
      }
      
      return isValid;
    });
    
    // CORRECTION: Vérification spéciale pour confirmPassword
    const passwordsMatch = form.password === form.confirmPassword && form.password.length > 0;
    if (!passwordsMatch) {
      console.log('❌ Mots de passe ne correspondent pas:', {
        password: form.password,
        confirmPassword: form.confirmPassword,
        match: form.password === form.confirmPassword
      });
      
      // Forcer la re-validation de confirmPassword
      if (form.confirmPassword) {
        setValidation(prev => ({
          ...prev,
          confirmPassword: {
            isValid: form.password === form.confirmPassword,
            message: form.password === form.confirmPassword ? '' : 'Les mots de passe ne correspondent pas'
          }
        }));
      }
    }
    
    // Test final avec le schéma Zod complet - CORRECTION DÉFINITIVE DES NOMS DE CHAMPS
    let zodValidationPassed = false;
    if (isComplete && allFieldsValid && passwordsMatch) {
      try {
        // CORRECTION CRITIQUE: Le schéma attend 'abonnement' et 'genre' comme nombres, pas 'abonnement_id' et 'genre_id'
        const fullData = {
          prenom: String(form.prenom).trim(),
          nom: String(form.nom).trim(),
          nom_utilisateur: String(form.nom_utilisateur || `${form.prenom}.${form.nom}`).toLowerCase().replace(/\s/g, ''),
          email: String(form.email).toLowerCase().trim(),
          password: String(form.password),
          // Le schéma attend 'date' pas 'date_naissance'
          date: String(form.date_naissance), 
          // CORRECTION FINALE: Le schéma attend 'abonnement' et 'genre' comme nombres
          abonnement: parseInt(String(form.abonnement), 10),
          genre: parseInt(String(form.genre), 10),
          date_inscription: new Date().toISOString().split('T')[0],
          status_id: 1,
          grade_id: 1
        };
        
        // Vérifications préliminaires strictes
        if (!fullData.date || !/^\d{4}-\d{2}-\d{2}$/.test(fullData.date)) {
          console.log('❌ [checkFormComplete] Date invalide:', fullData.date);
          zodValidationPassed = false;
        } else if (isNaN(fullData.genre) || fullData.genre <= 0) {
          console.log('❌ [checkFormComplete] Genre invalide:', form.genre, '->', fullData.genre);
          zodValidationPassed = false;
        } else if (isNaN(fullData.abonnement) || fullData.abonnement <= 0) {
          console.log('❌ [checkFormComplete] Abonnement invalide:', form.abonnement, '->', fullData.abonnement);
          zodValidationPassed = false;
        } else {
          console.log('🔍 [checkFormComplete] Données formatées pour Zod (CORRIGÉES):', fullData);
          console.log('🔍 [checkFormComplete] Types des champs critiques:', {
            date: typeof fullData.date,
            genre: typeof fullData.genre,
            abonnement: typeof fullData.abonnement,
            genre_value: fullData.genre,
            abonnement_value: fullData.abonnement
          });
          
          const result = userInscriptionSchema.safeParse(fullData);
          
          if (result.success) {
            zodValidationPassed = true;
            console.log('✅ [checkFormComplete] Validation Zod finale réussie');
          } else {
            zodValidationPassed = false;
            console.log('❌ [checkFormComplete] Erreurs Zod détaillées:', result.error);
            
            // CORRECTION: Accès correct aux erreurs Zod
            if (result.error && result.error.errors && Array.isArray(result.error.errors)) {
              result.error.errors.forEach((err, index) => {
                console.log(`Erreur ${index + 1}:`, {
                  champ: err.path ? err.path.join('.') : 'racine',
                  message: err.message || 'Message manquant',
                  code: err.code || 'Code manquant',
                  attendu: (err as any).expected || 'N/A',
                  reçu: (err as any).received || 'N/A',
                  valeur_fournie: err.path ? err.path.reduce((obj, key) => obj?.[key], fullData) : 'N/A'
                });
              });
            } else {
              console.log('❌ Structure d\'erreur Zod inattendue:', result.error);
            }
          }
        }
      } catch (error) {
        console.error('🔍 [checkFormComplete] Exception lors de la validation Zod:', error);
        zodValidationPassed = false;
      }
    }

    const finalCheck = isComplete && allFieldsValid && zodValidationPassed && passwordsMatch;

    console.log('🔍 [checkFormComplete] Vérification complétude avec Zod:', {
      isComplete,
      allFieldsValid,
      passwordsMatch,
      zodValidationPassed,
      finalCheck,
      formData: {
        genre: form.genre,
        abonnement: form.abonnement,
        date_naissance: form.date_naissance,
        email: form.email,
        password: form.password?.slice(0, 3) + '***', // Masquer le mot de passe dans les logs
        confirmPassword: form.confirmPassword?.slice(0, 3) + '***'
      },
      validation: Object.keys(validation).reduce((acc, key) => ({
        ...acc,
        [key]: {
          isValid: validation[key as keyof ValidationState]?.isValid ?? false,
          message: validation[key as keyof ValidationState]?.message ?? 'Non défini'
        }
      }), {})
    });

    return finalCheck;
  }, [form, validation]);

  // Initialiser la validation pour tous les champs au premier rendu
  React.useEffect(() => {
    const requiredFields = ['prenom', 'nom', 'email', 'password', 'confirmPassword', 'date_naissance', 'abonnement', 'genre'];
    
    requiredFields.forEach(field => {
      const value = form[field as keyof FormData];
      if (value && String(value).trim() !== '') {
        validateField(field, String(value));
      }
    });
  }, []); // Seulement au premier rendu

  return {
    validation,
    validateField,
    checkFormComplete
  };
};
