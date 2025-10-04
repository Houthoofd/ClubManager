import React, { useState, useEffect } from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Button,
  Alert,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  PageSection,
  Bullseye,
  AlertVariant,
  HelperText,
  HelperTextItem,
  ValidatedOptions
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { userInscriptionSchema } from '../../../packages/types/dist/index';
import {
  useAbonnementOptions,
  useGenreOptions,
  useVerifierUtilisateur,
  useInscrireUtilisateur
} from '../hooks/useInscriptions';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { clearAllAuthData } from '../utils/authCleaner';
import '../styles/connexion.css';
import InformationModal from '../components/modals/InformationModal';

// Expressions régulières pour validations (suppression téléphone)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]{2,30}$/;

// Liste des domaines email temporaires/jetables à bloquer
const TEMPORARY_EMAIL_DOMAINS = [
  '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org',
  'yopmail.com', 'maildrop.cc', 'throwaway.email', 'getnada.com'
];

// Mots de passe faibles à interdire
const WEAK_PASSWORDS = [
  'password', '123456', 'azerty', 'qwerty', 'admin', 'root', 'test', 'user',
  'motdepasse', 'password123', '123456789', 'abcdef', 'letmein'
];

interface ValidationState {
  [key: string]: {
    isValid: boolean;
    message: string;
    validated: ValidatedOptions;
  };
}

// Page d'inscription
export const InscriptionPage: React.FC = () => {
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    confirmPassword: '',
    date_naissance: '',
    abonnement: '',
    genre: '',
    nom_utilisateur: ''
  });

  const [validation, setValidation] = useState<ValidationState>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showInformationModal, setShowInformationModal] = useState(false);
  const [informationModalData, setInformationModalData] = useState<{
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    details?: any;
  } | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [existingUserData, setExistingUserData] = useState<any>(null);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [backendVerificationDone, setBackendVerificationDone] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  
  const dispatch = useDispatch();

  // NOUVEAU: Nettoyer l'authentification au chargement de la page d'inscription
  useEffect(() => {
    clearAllAuthData();
    dispatch(logout());
  }, [dispatch]);

  // Utilisation des hooks React Query
  const { data: abonnementOptions = [] } = useAbonnementOptions();
  const { data: genreOptions = [] } = useGenreOptions();
  const verifierUtilisateur = useVerifierUtilisateur();
  const inscrireUtilisateur = useInscrireUtilisateur();

  console.log('Abonnement Options:', abonnementOptions);
  console.log('Genre Options:', genreOptions);

  // Fonction de validation du prénom
  const validatePrenom = (value: string) => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      return {
        isValid: false,
        message: 'Le prénom est obligatoire',
        validated: ValidatedOptions.error
      };
    }
    
    if (trimmedValue.length < 2) {
      return {
        isValid: false,
        message: 'Le prénom doit contenir au moins 2 caractères',
        validated: ValidatedOptions.error
      };
    }
    
    if (trimmedValue.length > 30) {
      return {
        isValid: false,
        message: 'Le prénom ne peut pas dépasser 30 caractères',
        validated: ValidatedOptions.error
      };
    }
    
    if (!NAME_REGEX.test(trimmedValue)) {
      return {
        isValid: false,
        message: 'Le prénom ne peut contenir que des lettres, espaces, apostrophes et tirets',
        validated: ValidatedOptions.error
      };
    }
    
    if (/^\s|\s$/.test(value)) {
      return {
        isValid: false,
        message: 'Le prénom ne peut pas commencer ou finir par un espace',
        validated: ValidatedOptions.error
      };
    }
    
    return {
      isValid: true,
      message: 'Prénom valide',
      validated: ValidatedOptions.success
    };
  };

  // Fonction de validation du nom
  const validateNom = (value: string) => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      return {
        isValid: false,
        message: 'Le nom est obligatoire',
        validated: ValidatedOptions.error
      };
    }
    
    if (trimmedValue.length < 2) {
      return {
        isValid: false,
        message: 'Le nom doit contenir au moins 2 caractères',
        validated: ValidatedOptions.error
      };
    }
    
    if (trimmedValue.length > 30) {
      return {
        isValid: false,
        message: 'Le nom ne peut pas dépasser 30 caractères',
        validated: ValidatedOptions.error
      };
    }
    
    if (!NAME_REGEX.test(trimmedValue)) {
      return {
        isValid: false,
        message: 'Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets',
        validated: ValidatedOptions.error
      };
    }
    
    return {
      isValid: true,
      message: 'Nom valide',
      validated: ValidatedOptions.success
    };
  };

  // Fonction de validation de l'email
  const validateEmail = (value: string) => {
    const trimmedValue = value.trim().toLowerCase();
    
    if (!trimmedValue) {
      return {
        isValid: false,
        message: 'L\'email est obligatoire',
        validated: ValidatedOptions.error
      };
    }
    
    if (!EMAIL_REGEX.test(trimmedValue)) {
      return {
        isValid: false,
        message: 'Format d\'email invalide',
        validated: ValidatedOptions.error
      };
    }
    
    const domain = trimmedValue.split('@')[1];
    if (TEMPORARY_EMAIL_DOMAINS.includes(domain)) {
      return {
        isValid: false,
        message: 'Les adresses email temporaires ne sont pas autorisées',
        validated: ValidatedOptions.error
      };
    }
    
    if (trimmedValue.length > 100) {
      return {
        isValid: false,
        message: 'L\'email ne peut pas dépasser 100 caractères',
        validated: ValidatedOptions.error
      };
    }
    
    return {
      isValid: true,
      message: 'Email valide',
      validated: ValidatedOptions.success
    };
  };

  // Fonction de calcul de la force du mot de passe
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    
    // Longueur
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Caractères
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;
    
    // Absence de patterns communs
    if (!/(.)\1{2,}/.test(password)) strength += 1; // Pas de répétitions
    if (!/123|abc|qwe/i.test(password)) strength += 1; // Pas de séquences
    
    return Math.min(strength, 8);
  };

  // Fonction de validation du mot de passe
  const validatePassword = (value: string) => {
    if (!value) {
      return {
        isValid: false,
        message: 'Le mot de passe est obligatoire',
        validated: ValidatedOptions.error
      };
    }
    
    if (value.length < 8) {
      return {
        isValid: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
        validated: ValidatedOptions.error
      };
    }
    
    if (value.length > 128) {
      return {
        isValid: false,
        message: 'Le mot de passe ne peut pas dépasser 128 caractères',
        validated: ValidatedOptions.error
      };
    }
    
    if (WEAK_PASSWORDS.includes(value.toLowerCase())) {
      return {
        isValid: false,
        message: 'Ce mot de passe est trop commun, choisissez-en un autre',
        validated: ValidatedOptions.error
      };
    }
    
    const strength = calculatePasswordStrength(value);
    setPasswordStrength(strength);
    
    if (strength < 4) {
      return {
        isValid: false,
        message: 'Mot de passe trop faible',
        validated: ValidatedOptions.warning
      };
    }
    
    if (!PASSWORD_REGEX.test(value)) {
      return {
        isValid: false,
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
        validated: ValidatedOptions.error
      };
    }
    
    return {
      isValid: true,
      message: 'Mot de passe fort',
      validated: ValidatedOptions.success
    };
  };

  // Fonction de validation de la confirmation du mot de passe
  const validateConfirmPassword = (value: string) => {
    if (!value) {
      return {
        isValid: false,
        message: 'La confirmation du mot de passe est obligatoire',
        validated: ValidatedOptions.error
      };
    }
    
    if (value !== form.password) {
      return {
        isValid: false,
        message: 'Les mots de passe ne correspondent pas',
        validated: ValidatedOptions.error
      };
    }
    
    return {
      isValid: true,
      message: 'Confirmation correcte',
      validated: ValidatedOptions.success
    };
  };

  // Fonction de validation de la date de naissance RENFORCÉE avec âge minimum strict
  const validateDateNaissance = (value: string) => {
    if (!value) {
      return {
        isValid: false,
        message: 'La date de naissance est obligatoire',
        validated: ValidatedOptions.error
      };
    }
    
    const birthDate = new Date(value);
    const today = new Date();
    
    // Réinitialiser l'heure pour une comparaison précise
    today.setHours(23, 59, 59, 999);
    birthDate.setHours(0, 0, 0, 0);
    
    // Vérification de la validité de la date
    if (isNaN(birthDate.getTime())) {
      return {
        isValid: false,
        message: 'Date invalide',
        validated: ValidatedOptions.error
      };
    }
    
    // VALIDATION PRINCIPALE: Date dans le futur strictement interdite
    if (birthDate > today) {
      return {
        isValid: false,
        message: 'La date de naissance ne peut pas être dans le futur',
        validated: ValidatedOptions.error
      };
    }
    
    // Vérification date d'aujourd'hui (naissance le jour même interdite)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (birthDate.getTime() === todayStart.getTime()) {
      return {
        isValid: false,
        message: 'La date de naissance ne peut pas être aujourd\'hui',
        validated: ValidatedOptions.error
      };
    }
    
    // VALIDATION STRICTE ÂGE MINIMUM: 5 ans révolus EXACTEMENT
    const cinqAnsAujourdHui = new Date();
    cinqAnsAujourdHui.setFullYear(today.getFullYear() - 5);
    cinqAnsAujourdHui.setHours(23, 59, 59, 999);
    
    if (birthDate > cinqAnsAujourdHui) {
      // Calculer l'âge exact en années, mois et jours
      const diffTime = today.getTime() - birthDate.getTime();
      const ageInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const ageInYears = Math.floor(ageInDays / 365.25);
      
      return {
        isValid: false,
        message: `Âge insuffisant: vous avez ${ageInYears} an(s). Minimum requis: 5 ans révolus`,
        validated: ValidatedOptions.error
      };
    }
    
    // Vérification âge maximum (100 ans)
    const maxAgeDate = new Date();
    maxAgeDate.setFullYear(today.getFullYear() - 100);
    
    if (birthDate < maxAgeDate) {
      return {
        isValid: false,
        message: 'Date de naissance trop ancienne (maximum 100 ans)',
        validated: ValidatedOptions.error
      };
    }
    
    // Validation des années cohérentes (pas avant 1900)
    if (birthDate.getFullYear() < 1900) {
      return {
        isValid: false,
        message: 'Date de naissance non valide (minimum année 1900)',
        validated: ValidatedOptions.error
      };
    }
    
    // Calculer et afficher l'âge exact pour confirmation
    const ageInYears = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    
    return {
      isValid: true,
      message: `Date de naissance valide (âge: ${ageInYears} ans)`,
      validated: ValidatedOptions.success
    };
  };

  // Fonction de validation générique
  const validateField = (name: string, value: string) => {
    let result;
    
    switch (name) {
      case 'prenom':
        result = validatePrenom(value);
        break;
      case 'nom':
        result = validateNom(value);
        break;
      case 'email':
        result = validateEmail(value);
        break;
      case 'password':
        result = validatePassword(value);
        break;
      case 'confirmPassword':
        result = validateConfirmPassword(value);
        break;
      case 'date_naissance':
        result = validateDateNaissance(value);
        break;
      default:
        result = {
          isValid: true,
          message: '',
          validated: ValidatedOptions.default
        };
    }
    
    setValidation(prev => ({
      ...prev,
      [name]: result
    }));
    
    return result;
  };

  // Vérification de la validité globale du formulaire
  const checkFormValidity = () => {
    const requiredFields = ['prenom', 'nom', 'email', 'password', 'confirmPassword', 'date_naissance', 'abonnement', 'genre'];
    const allValid = requiredFields.every(field => {
      const fieldValidation = validation[field];
      return fieldValidation && fieldValidation.isValid;
    });
    
    setIsFormValid(allValid && form.abonnement && form.genre);
  };

  // Effect pour vérifier la validité du formulaire
  useEffect(() => {
    checkFormValidity();
  }, [validation, form.abonnement, form.genre]);

  // Vérification si le formulaire est complet (tous les champs requis remplis et valides)
  const checkFormComplete = () => {
    const requiredFields = ['prenom', 'nom', 'email', 'password', 'confirmPassword', 'date_naissance'];
    
    // Vérifier que tous les champs requis sont remplis
    const allFieldsFilled = requiredFields.every(field => {
      const value = form[field as keyof typeof form];
      return value && value.toString().trim() !== '';
    });
    
    // Vérifier que les selects sont remplis
    const selectsFilled = form.abonnement && form.genre;
    
    // Vérifier que tous les champs sont valides
    const allFieldsValid = requiredFields.every(field => {
      const fieldValidation = validation[field];
      return fieldValidation && fieldValidation.isValid;
    });
    
    const isComplete = allFieldsFilled && selectsFilled && allFieldsValid;
    setIsFormComplete(isComplete);
    
    console.log('🔍 Form Complete Check:', {
      allFieldsFilled,
      selectsFilled,
      allFieldsValid,
      isComplete,
      validation,
      form: {
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        date_naissance: form.date_naissance,
        abonnement: form.abonnement,
        genre: form.genre
      }
    });
    
    // Si le formulaire devient complet ET qu'on n'a pas encore fait la vérification
    if (isComplete && !backendVerificationDone && !isCheckingUser) {
      console.log('🚀 Déclenchement de la vérification backend');
      triggerBackendVerification();
    }
    
    // Si le formulaire n'est plus complet, réinitialiser les vérifications
    if (!isComplete && backendVerificationDone) {
      console.log('🔄 Réinitialisation de la vérification (formulaire incomplet)');
      setBackendVerificationDone(false);
      setUserExists(false);
      setCanSubmit(false);
    }
  };

  // Fonction pour déclencher la vérification backend uniquement quand le formulaire est complet
  const triggerBackendVerification = async () => {
    console.log('🔍 triggerBackendVerification called', { 
      isFormComplete, 
      isCheckingUser, 
      backendVerificationDone,
      form: {
        nom: form.nom,
        prenom: form.prenom,
        date_naissance: form.date_naissance
      }
    });
    
    if (!isFormComplete || isCheckingUser || backendVerificationDone) {
      console.log('🚫 Vérification annulée:', { isFormComplete, isCheckingUser, backendVerificationDone });
      return;
    }

    // Vérifier que les champs critiques sont bien remplis
    if (!form.nom || !form.prenom || !form.date_naissance) {
      console.log('🚫 Champs critiques manquants:', { nom: form.nom, prenom: form.prenom, date_naissance: form.date_naissance });
      return;
    }

    console.log('✅ Démarrage de la vérification backend');
    setIsCheckingUser(true);
    setBackendVerificationDone(false);
    
    try {
      const response = await verifierUtilisateur.mutateAsync({
        nom: form.nom,
        prenom: form.prenom,
        date_naissance: form.date_naissance
      });
      
      // Vérification réussie - utilisateur n'existe pas
      setUserExists(false);
      setExistingUserData(null);
      setCanSubmit(true);
      
    } catch (error: any) {
      console.log('❌ Erreur lors de la vérification:', error);
      
      if (error.message && error.message.includes('existe déjà')) {
        console.log('⚠️ Utilisateur existe déjà');
        setUserExists(true);
        setExistingUserData({
          nom: form.nom,
          prenom: form.prenom,
          date_naissance: form.date_naissance,
          status: 'Utilisateur existant'
        });
        
        // Afficher la modal d'information SANS détails utilisateur
        setInformationModalData({
          title: 'Utilisateur déjà existant',
          message: 'Une personne avec ce nom, prénom et date de naissance est déjà inscrite dans notre système.',
          type: 'warning',
          details: {
            actions: [
              {
                label: 'Aller à la connexion',
                action: () => {
                  window.location.href = `${window.location.origin}/pages/connexion`;
                },
                variant: 'primary' as const
              },
              {
                label: 'Modifier les données',
                action: () => {
                  // Permettre à l'utilisateur de modifier ses données
                  setBackendVerificationDone(false);
                  setUserExists(false);
                  setExistingUserData(null);
                  setCanSubmit(false);
                },
                variant: 'secondary' as const
              }
            ]
          }
        });
        setShowInformationModal(true);
        setCanSubmit(false);
      } else {
        console.log('❓ Autre erreur - permettre la soumission');
        // Autre erreur - permettre la soumission
        setUserExists(false);
        setExistingUserData(null);
        setCanSubmit(true);
      }
    } finally {
      setIsCheckingUser(false);
      setBackendVerificationDone(true);
      console.log('🏁 Vérification backend terminée');
    }
  };

  // Effect pour vérifier si le formulaire est complet à chaque changement
  useEffect(() => {
    checkFormComplete();
  }, [validation, form]);

  // NOUVEAU: Effect séparé pour déclencher la vérification backend
  useEffect(() => {
    if (isFormComplete && !backendVerificationDone && !isCheckingUser) {
      console.log('🚀 Déclenchement automatique de la vérification backend via useEffect');
      // Petite temporisation pour éviter les appels multiples
      const timeoutId = setTimeout(() => {
        triggerBackendVerification();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isFormComplete, backendVerificationDone, isCheckingUser, form.nom, form.prenom, form.date_naissance]);

  // Génération automatique du nom d'utilisateur (plus simple maintenant)
  useEffect(() => {
    if (form.prenom && form.nom) {
      // Plus besoin de complexité - le userId assure l'unicité
      const nom_utilisateur = `${form.prenom.toLowerCase().replace(/\s/g, '')}.${form.nom.toLowerCase().replace(/\s/g, '')}`;
      setForm(prev => ({ ...prev, nom_utilisateur }));
    }
  }, [form.prenom, form.nom]);

  const handleChange = (value: string, name: string) => {
    setForm({ ...form, [name]: value });
    setError('');
    
    // Si l'utilisateur modifie des champs critiques après vérification, réinitialiser
    if (['prenom', 'nom', 'date_naissance'].includes(name) && backendVerificationDone) {
      console.log('🔄 Champ critique modifié - réinitialisation');
      setBackendVerificationDone(false);
      setUserExists(false);
      setCanSubmit(false);
    }
    
    // Validation en temps réel pour certains champs
    if (['prenom', 'nom', 'email', 'password', 'confirmPassword', 'date_naissance'].includes(name)) {
      setTimeout(() => validateField(name, value), 300); // Debounce
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    console.log('🚀 Tentative de soumission du formulaire');
    console.log('📋 État actuel:', {
      isFormComplete,
      backendVerificationDone,
      userExists,
      canSubmit,
      isCheckingUser
    });

    // Vérification que le formulaire est complet et vérifié
    if (!isFormComplete) {
      setError("Veuillez remplir tous les champs obligatoires.");
      console.log('❌ Formulaire incomplet');
      return;
    }

    if (isCheckingUser) {
      setError("Vérification en cours, veuillez patienter...");
      console.log('❌ Vérification en cours');
      return;
    }

    if (!backendVerificationDone) {
      setError("Vérification de l'utilisateur en cours...");
      console.log('❌ Vérification backend non terminée - déclenchement manuel');
      // FORCER la vérification si pas encore fait
      await triggerBackendVerification();
      return;
    }

    if (userExists) {
      setInformationModalData({
        title: 'Impossible de continuer',
        message: 'Une personne avec ces informations (nom, prénom, date de naissance) existe déjà. Veuillez modifier vos données ou vous connecter.',
        type: 'error',
        details: {
          actions: [
            {
              label: 'Aller à la connexion',
              action: () => {
                window.location.href = `${window.location.origin}/pages/connexion`;
              },
              variant: 'primary' as const
            }
          ]
        }
      });
      setShowInformationModal(true);
      return;
    }

    if (!canSubmit) {
      setError("Le formulaire n'est pas prêt pour la soumission.");
      console.log('❌ canSubmit = false');
      return;
    }

    console.log('✅ Toutes les vérifications passées - validation Zod');

    // Validation avec Zod
    const formWithUsername = { ...form };
    const result = userInscriptionSchema.safeParse({
      ...formWithUsername,
      date: form.date_naissance
    });
    
    if (!result.success) {
      console.log('❌ Échec validation Zod:', result.error);
      setError(result.error.errors[0]?.message || "Données invalides.");
      return;
    }

    console.log('✅ Validation Zod réussie - passage au récapitulatif');
    // Passer directement au récapitulatif sans nouvelle vérification
    setShowRecap(true);
  };

  const handleCloseInformationModal = () => {
    setShowInformationModal(false);
    setInformationModalData(null);
  };

  // Composant pour afficher la force du mot de passe
  const PasswordStrengthIndicator = () => {
    const getStrengthColor = () => {
      if (passwordStrength < 3) return '#dc3545';
      if (passwordStrength < 6) return '#ffc107';
      return '#28a745';
    };
    
    const getStrengthText = () => {
      if (passwordStrength < 3) return 'Faible';
      if (passwordStrength < 6) return 'Moyen';
      return 'Fort';
    };
    
    return (
      <div style={{ marginTop: '0.5rem' }}>
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#e9ecef',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(passwordStrength / 8) * 100}%`,
            height: '100%',
            backgroundColor: getStrengthColor(),
            transition: 'all 0.3s ease'
          }} />
        </div>
        <small style={{ color: getStrengthColor(), fontWeight: 600 }}>
          Force: {getStrengthText()}
        </small>
      </div>
    );
  };

  const handleCancelRecap = () => {
    setShowRecap(false);
    setModalMessage(null);
  };

  const handleConfirm = async () => {
    setModalMessage(null);

    try {
      // Prépare le payload complet pour le backend
      const dataToSend = {
        prenom: form.prenom,
        nom: form.nom,
        nom_utilisateur: form.nom_utilisateur,
        email: form.email,
        password: form.password,
        genre_id: Number(form.genre),
        abonnement_id: Number(form.abonnement),
        date_naissance: form.date_naissance,
        date_inscription: new Date().toISOString().split('T')[0],
        status_id: 1,
        grade_id: 1,
      };
      console.log('[Inscription] Données envoyées au backend :', dataToSend);
      
      const result = await inscrireUtilisateur.mutateAsync(dataToSend);
      
      // NOUVEAU: Nettoyer à nouveau après inscription réussie
      clearAllAuthData();
      dispatch(logout());
      
      setModalMessage(`Inscription réussie ! Votre identifiant unique est : ${result.generatedUserId || 'sera affiché lors de la connexion'}`);
      setSuccess(true);
      setShowRecap(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('[Inscription] Erreur:', err);
      
      // Gestion spécifique des erreurs d'utilisateur existant
      if (err.message && err.message.includes('est déjà inscrite')) {
        setShowRecap(false);
        setInformationModalData({
          title: 'Utilisateur déjà existant',
          message: 'Cette personne est déjà inscrite dans notre système.',
          type: 'warning',
          details: {
            actions: [
              {
                label: 'Aller à la connexion',
                action: () => {
                  window.location.href = `${window.location.origin}/pages/connexion`;
                },
                variant: 'primary' as const
              },
              {
                label: 'Modifier les informations',
                action: () => {
                  // Réinitialiser le formulaire pour permettre la modification
                  setBackendVerificationDone(false);
                  setUserExists(false);
                  setCanSubmit(false);
                },
                variant: 'secondary' as const
              }
            ]
          }
        });
        setShowInformationModal(true);
      } else {
        // Autres erreurs
        setModalMessage(err.message || "Erreur lors de l'inscription.");
      }
    }
  };

  return (
    <div className="inscription-page">
      {/* Background decorative elements */}
      <div className="login-background-decoration" />

      <PageHeader
        title="Club Manager"
        subtitle="Inscrivez-vous pour rejoindre notre club"
        variant="inscription"
      />

      <PageSection style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem' }}>
        <Bullseye style={{ width: '100%' }}>
          <div className="login-container" style={{ maxWidth: '600px' }}>
            {/* Logo/Icon section */}
            <div className="login-header">
              <div className="login-logo">🥋</div>
              <h1 className="login-title">Rejoignez-nous</h1>
              <p className="login-subtitle">
                Créez votre compte pour commencer votre parcours
              </p>
            </div>

            <Form onSubmit={handleSubmit} className="login-form">
              {error && (
                <Alert
                  variant={AlertVariant.danger}
                  title="Erreur d'inscription"
                  isInline
                  className="login-error"
                >
                  {error}
                </Alert>
              )}

              {/* Debug info - À supprimer en production */}
              {process.env.NODE_ENV === 'development' && (
                <div style={{ 
                  background: '#f0f0f0', 
                  padding: '10px', 
                  borderRadius: '4px', 
                  marginBottom: '1rem',
                  fontSize: '12px'
                }}>
                  <strong>Debug:</strong><br/>
                  FormComplete: {isFormComplete ? '✅' : '❌'}<br/>
                  BackendDone: {backendVerificationDone ? '✅' : '❌'}<br/>
                  UserExists: {userExists ? '❌' : '✅'}<br/>
                  CanSubmit: {canSubmit ? '✅' : '❌'}<br/>
                  Checking: {isCheckingUser ? '⏳' : '✅'}<br/>
                  <strong>Champs critiques:</strong><br/>
                  Nom: {form.nom || 'VIDE'}<br/>
                  Prénom: {form.prenom || 'VIDE'}<br/>
                  Date: {form.date_naissance || 'VIDE'}<br/>
                  <button 
                    type="button" 
                    onClick={() => triggerBackendVerification()}
                    style={{ marginTop: '5px', padding: '2px 5px', fontSize: '10px' }}
                  >
                    Force Check
                  </button>
                </div>
              )}

              {/* Indicateur de progression du formulaire */}
              {!isFormComplete && (
                <Alert
                  variant={AlertVariant.info}
                  title="Remplissez tous les champs requis"
                  isInline
                >
                  Veuillez compléter tous les champs obligatoires pour activer la vérification.
                </Alert>
              )}

              {/* Indicateur de vérification en cours */}
              {isFormComplete && isCheckingUser && (
                <Alert
                  variant={AlertVariant.info}
                  title="Vérification en cours..."
                  isInline
                >
                  Vérification de l'existence de l'utilisateur...
                </Alert>
              )}

              {/* Succès de la vérification */}
              {isFormComplete && backendVerificationDone && !userExists && !isCheckingUser && (
                <Alert
                  variant={AlertVariant.success}
                  title="Vérification réussie"
                  isInline
                >
                  ✅ Aucun utilisateur existant trouvé. Vous pouvez procéder à l'inscription.
                </Alert>
              )}

              {/* Alerte si utilisateur existe */}
              {userExists && existingUserData && (
                <Alert
                  variant={AlertVariant.warning}
                  title="Utilisateur existant détecté"
                  isInline
                >
                  ⚠️ Un utilisateur avec ces informations existe déjà.
                </Alert>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormGroup 
                  label="Prénom" 
                  isRequired 
                  fieldId="prenom" 
                  className="login-form-group"
                  validated={validation.prenom?.validated}
                >
                  <TextInput
                    isRequired
                    type="text"
                    id="prenom"
                    name="prenom"
                    value={form.prenom}
                    onChange={e => handleChange(e.currentTarget.value, 'prenom')}
                    placeholder="Entrez votre prénom"
                    className="login-input"
                    validated={validation.prenom?.validated}
                    maxLength={30}
                  />
                  {validation.prenom && (
                    <HelperText>
                      <HelperTextItem variant={validation.prenom.validated}>
                        {validation.prenom.message}
                      </HelperTextItem>
                    </HelperText>
                  )}
                </FormGroup>

                <FormGroup 
                  label="Nom" 
                  isRequired 
                  fieldId="nom" 
                  className="login-form-group"
                  validated={validation.nom?.validated}
                >
                  <TextInput
                    isRequired
                    type="text"
                    id="nom"
                    name="nom"
                    value={form.nom}
                    onChange={e => handleChange(e.currentTarget.value, 'nom')}
                    placeholder="Entrez votre nom"
                    className="login-input"
                    validated={validation.nom?.validated}
                    maxLength={30}
                  />
                  {validation.nom && (
                    <HelperText>
                      <HelperTextItem variant={validation.nom.validated}>
                        {validation.nom.message}
                      </HelperTextItem>
                    </HelperText>
                  )}
                </FormGroup>
              </div>

              <FormGroup 
                label="Email" 
                isRequired 
                fieldId="email" 
                className="login-form-group"
                validated={validation.email?.validated}
              >
                <TextInput
                  isRequired
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={e => handleChange(e.currentTarget.value, 'email')}
                  placeholder="Entrez votre email"
                  className="login-input"
                  validated={validation.email?.validated}
                  maxLength={100}
                />
                {validation.email && (
                  <HelperText>
                    <HelperTextItem variant={validation.email.validated}>
                      {validation.email.message}
                    </HelperTextItem>
                  </HelperText>
                )}
              </FormGroup>

              <FormGroup 
                label="Mot de passe" 
                isRequired 
                fieldId="password" 
                className="login-form-group"
                validated={validation.password?.validated}
              >
                <TextInput
                  isRequired
                  type="password"
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={e => handleChange(e.currentTarget.value, 'password')}
                  onFocus={() => setShowPasswordRequirements(true)}
                  onBlur={() => setShowPasswordRequirements(false)}
                  placeholder="Créez un mot de passe"
                  className="login-input"
                  validated={validation.password?.validated}
                  maxLength={128}
                />
                {form.password && <PasswordStrengthIndicator />}
                {showPasswordRequirements && (
                  <HelperText>
                    <HelperTextItem>
                      Le mot de passe doit contenir :
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                        <li>Au moins 8 caractères</li>
                        <li>Une majuscule et une minuscule</li>
                        <li>Au moins un chiffre</li>
                        <li>Un caractère spécial (@$!%*?&)</li>
                      </ul>
                    </HelperTextItem>
                  </HelperText>
                )}
                {validation.password && !showPasswordRequirements && (
                  <HelperText>
                    <HelperTextItem variant={validation.password.validated}>
                      {validation.password.message}
                    </HelperTextItem>
                  </HelperText>
                )}
              </FormGroup>

              <FormGroup 
                label="Confirmer le mot de passe" 
                isRequired 
                fieldId="confirmPassword" 
                className="login-form-group"
                validated={validation.confirmPassword?.validated}
              >
                <TextInput
                  isRequired
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={e => handleChange(e.currentTarget.value, 'confirmPassword')}
                  placeholder="Confirmez votre mot de passe"
                  className="login-input"
                  validated={validation.confirmPassword?.validated}
                />
                {validation.confirmPassword && (
                  <HelperText>
                    <HelperTextItem variant={validation.confirmPassword.validated}>
                      {validation.confirmPassword.message}
                    </HelperTextItem>
                  </HelperText>
                )}
              </FormGroup>

              <FormGroup 
                label="Date de naissance" 
                isRequired 
                fieldId="date_naissance" 
                className="login-form-group"
                validated={validation.date_naissance?.validated}
              >
                <TextInput
                  isRequired
                  type="date"
                  id="date_naissance"
                  name="date_naissance"
                  value={form.date_naissance}
                  onChange={e => handleChange(e.currentTarget.value, 'date_naissance')}
                  className="login-input"
                  validated={validation.date_naissance?.validated}
                  // VALIDATION HTML5 RENFORCÉE: Empêche la sélection de dates futures
                  max={new Date().toISOString().split('T')[0]}
                  // VALIDATION STRICTE: Maximum il y a 5 ans (pour forcer l'âge minimum)
                  min={`${new Date().getFullYear() - 100}-01-01`}
                />
                {validation.date_naissance && (
                  <HelperText>
                    <HelperTextItem variant={validation.date_naissance.validated}>
                      {validation.date_naissance.message}
                    </HelperTextItem>
                  </HelperText>
                )}
                <HelperText>
                  <HelperTextItem>
                    ⚠️ Âge minimum requis : 5 ans révolus
                  </HelperTextItem>
                </HelperText>
              </FormGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormGroup label="Type d'abonnement" isRequired fieldId="abonnement" className="login-form-group">
                  <FormSelect
                    value={form.abonnement}
                    onChange={(_event, value) => handleChange(value, 'abonnement')}
                    aria-label="Type d'abonnement"
                    className="login-input"
                  >
                    <FormSelectOption value="" label="Sélectionner un abonnement" isDisabled />
                    {abonnementOptions.map(option => (
                      <FormSelectOption
                        key={option.value}
                        value={option.value}
                        label={`${option.label} - ${option.prix}€`}
                      />
                    ))}
                  </FormSelect>
                </FormGroup>

                <FormGroup label="Genre" isRequired fieldId="genre" className="login-form-group">
                  <FormSelect
                    value={form.genre}
                    onChange={(_event, value) => handleChange(value, 'genre')}
                    aria-label="Genre"
                    className="login-input"
                  >
                    <FormSelectOption value="" label="Sélectionner un genre" isDisabled />
                    {genreOptions.map(option => (
                      <FormSelectOption
                        key={option.value}
                        value={option.value}
                        label={option.label}
                      />
                    ))}
                  </FormSelect>
                </FormGroup>
              </div>

              {form.nom_utilisateur && (
                <Alert variant="info" isInline title="Informations générées automatiquement">
                  <p><strong>Nom d'utilisateur :</strong> {form.nom_utilisateur}</p>
                  <small>Un identifiant unique (UserId) sera automatiquement généré lors de l'inscription.</small>
                </Alert>
              )}

              <div className="login-actions">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={inscrireUtilisateur.isPending}
                  isDisabled={
                    inscrireUtilisateur.isPending || 
                    !isFormComplete || 
                    !backendVerificationDone || 
                    userExists || 
                    isCheckingUser ||
                    !canSubmit
                  }
                  className="login-button"
                >
                  {isCheckingUser 
                    ? "Vérification..." 
                    : inscrireUtilisateur.isPending 
                      ? "Création du compte..." 
                      : !isFormComplete
                        ? "Completez le formulaire"
                        : !backendVerificationDone
                          ? "Vérification requise"
                          : userExists
                            ? "Utilisateur existant"
                            : canSubmit
                              ? "S'inscrire"
                              : "En attente..."}
                </Button>
              </div>

              <div className="login-footer">
                <p>
                  Déjà un compte ?{' '}
                  <Link to="/pages/connexion" className="login-link">
                    Connectez-vous ici
                  </Link>
                </p>
              </div>
            </Form>
          </div>
        </Bullseye>
      </PageSection>

      {/* Modal de récapitulatif */}
      <Modal
        variant="medium"
        isOpen={showRecap}
        onClose={handleCancelRecap}
        aria-labelledby="recap-modal-title"
      >
        <ModalHeader title="Récapitulatif de l'inscription" />
        <ModalBody>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <p><strong>Prénom :</strong> {form.prenom}</p>
            <p><strong>Nom :</strong> {form.nom}</p>
            <p><strong>Email :</strong> {form.email}</p>
            <p><strong>Genre :</strong> {genreOptions.find(g => g.value === form.genre)?.label || 'Non sélectionné'}</p>
            <p><strong>Date de naissance :</strong> {form.date_naissance}</p>
            <p style={{ margin: 0 }}>
              <strong>Type d'abonnement :</strong> {abonnementOptions.find(a => a.value === form.abonnement)?.label || 'Non sélectionné'}
            </p>
          </div>
          {modalMessage && (
            <Alert
              variant={modalMessage === "Inscription réussie !" ? "success" : "danger"}
              title={modalMessage}
              isInline
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="primary" 
            onClick={handleConfirm}
            isLoading={inscrireUtilisateur.isPending}
            isDisabled={inscrireUtilisateur.isPending}
          >
            {inscrireUtilisateur.isPending ? "Inscription..." : "Confirmer"}
          </Button>
          <Button variant="link" onClick={handleCancelRecap}>
            Annuler
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de succès */}
      <Modal
        variant="small"
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // CORRECTION: Redirection vers la page de connexion après fermeture
          window.location.href = `${window.location.origin}/pages/connexion`;
        }}
        aria-labelledby="success-modal-title"
      >
        <ModalHeader title="Inscription réussie !" />
        <ModalBody>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{
              fontSize: '3rem',
              color: '#28a745',
              marginBottom: '1rem'
            }}>
              ✅
            </div>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>
              Votre inscription a été effectuée avec succès. Vous pouvez maintenant vous connecter.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowSuccessModal(false);
              // CORRECTION: Redirection vers la page de connexion
              window.location.href = `${window.location.origin}/pages/connexion`;
            }}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            Aller à la connexion
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal d'information */}
      {informationModalData && (
        <InformationModal
          isOpen={showInformationModal}
          onClose={handleCloseInformationModal}
          title={informationModalData.title}
          message={informationModalData.message}
          type={informationModalData.type}
          details={informationModalData.details}
        />
      )}
    </div>
  );
};

export default InscriptionPage;