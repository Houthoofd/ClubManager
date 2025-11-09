import React, { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Tabs,
  Tab,
  TabTitleText,
  PageSection,
  Title,
  Spinner,
  Alert,
  Button,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { EnvelopeIcon, CreditCardIcon } from '@patternfly/react-icons';
import { useUtilisateurById, useUpdateUtilisateur, checkEmailExists } from '../../hooks/useUtilisateurs';
import { useFrequentationByUserId } from '../../hooks/useStatistiques';
import { useAbonnements, useGrades, useStatus, useGenres } from '../../hooks/useInformations';
import { useEcheancesByUserId } from '../../hooks/usePaiements';
import FormulaireUtilisateur from '../../components/utilisateurs/FormulaireUtilisateur';
import EcheancesPaiement from '../../components/utilisateurs/EcheancesPaiement';
import StatistiquesTab from '../../components/compte/StatistiquesTab';
import ConfirmModal from '../../components/common/modal/ConfirmModal';
import ResultModal from '../../components/common/modal/ResultModal';
import ResumeConfirmModal from '../../components/common/modal/ResumeConfirmModal';
import { apiUrl } from '../../pages/apiUrl';
import { useCheckEmail } from '../../hooks/useVerification';

function formatDateForInput(isoDateString: string): string {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface ModificationItem {
  field: string;
  oldValue: string;
  newValue: string;
}

const ConsulterUtilisateurPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const location = useLocation();
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalSuccess, setModalSuccess] = useState<boolean>(false);
  const [modificationsResume, setModificationsResume] = useState<ModificationItem[]>([]);
  const [emailCheckMessage, setEmailCheckMessage] = useState<string>('');
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [modalStep, setModalStep] = useState<'summary' | 'result'>('summary');
  const [pendingChanges, setPendingChanges] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showRappelModal, setShowRappelModal] = useState(false);
  const [rappelLoading, setRappelLoading] = useState(false);

  // Hooks React Query
  const { data: userData, isLoading: loadingUser, error: userError } = useUtilisateurById(id);
  const { data: statFrequentation, isLoading: loadingStats } = useFrequentationByUserId(id);
  const { data: abonnements = [] } = useAbonnements();
  const { data: gradesList = [] } = useGrades();
  const { data: statusList = [] } = useStatus();
  const { data: paiementsEcheances = [] } = useEcheancesByUserId(id);
  const { data: genresList = [] } = useGenres(); // Ajout du hook pour les genres
  const updateUtilisateur = useUpdateUtilisateur();
  const checkEmail = useCheckEmail();


  // État du formulaire
  const [form, setForm] = useState<{
    id: number | null;
    prenom: string;
    nom: string;
    email: string;
    date_naissance: string;
    abonnement: string;
    genres: string;
    grades: string;
    nom_utilisateur: string;
    status: string;
    mot_de_passe: string;
  }>({
    id: null,
    prenom: '',
    nom: '',
    email: '',
    date_naissance: '',
    abonnement: '',
    genres: '',
    grades: '',
    nom_utilisateur: '',
    status: '',
    mot_de_passe: '',
  });

  React.useEffect(() => {
    if (userData?.utilisateur) {
      const utilisateur = userData.utilisateur;
      let mot_de_passe = '';
      if (utilisateur.password) {
        mot_de_passe = '[Mot de passe non affichable : hash bcrypt]';
      }
      setForm({
        id: utilisateur.id ?? null,
        prenom: utilisateur.first_name || '',
        nom: utilisateur.last_name || '',
        email: utilisateur.email || '',
        date_naissance: utilisateur.date_of_birth || '',
        abonnement: String(utilisateur.abonnement ?? ''),
        genres: String(utilisateur.genres ?? ''),
        grades: String(utilisateur.grades ?? ''),
        nom_utilisateur: utilisateur.nom_utilisateur || '',
        status: String(utilisateur.status ?? ''),
        mot_de_passe,
      });
    }
  }, [userData]);

  // Récupération du rôle de l'utilisateur connecté
  React.useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const role = parsedData?.status;
      setUserRole(role);
    }
  }, []);

  // Transformation des données pour GraphiqueLineaire
  const statsDataReady =
    statFrequentation &&
    Array.isArray(statFrequentation.mois) &&
    statFrequentation.mois.length > 0;

  const statFrequentationForGraph = statsDataReady
    ? {
        ...statFrequentation,
        mois: statFrequentation.mois.map((item: any) => ({
          mois: item.mois,
          frequentation: item.frequentation,
          pourcentage_de_cours_valides: item.pourcentageCoursValides,
          nombres_total_de_cours_du_mois: item.totalCoursMois,
        }))
      }
    : undefined;

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    eventKey: string | number
  ) => {
    setActiveTabKey(Number(eventKey));
  };

  const handleEditClick = (field: string) => {
    // Empêcher l'édition du statut si l'utilisateur n'a pas les droits
    if (field === 'status' && !canEditStatus()) {
      setModalMessage('Vous n\'avez pas les permissions pour modifier le statut/rôle.');
      setModalSuccess(false);
      setShowResultModal(true);
      return;
    }

    setEditingFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // AJOUTÉ: États pour la validation email
  const [emailValidation, setEmailValidation] = useState({
    isValid: true,
    message: '',
    isChecking: false
  });

  // AJOUTÉ: Fonction de validation du format email
  const isValidEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // AJOUTÉ: Handler pour la validation de l'email
  const handleEmailValidation = async (email: string) => {
    console.log('🔍 handleEmailValidation: Début validation pour:', email);
    setEmailValidation({ isValid: true, message: '', isChecking: true });
    
    // Vérification du format
    if (!email.trim()) {
      console.log('❌ handleEmailValidation: Email vide');
      setEmailValidation({ isValid: false, message: 'L\'email est requis', isChecking: false });
      return false;
    }
    
    if (!isValidEmailFormat(email)) {
      console.log('❌ handleEmailValidation: Format invalide');
      setEmailValidation({ isValid: false, message: 'Format d\'email invalide', isChecking: false });
      return false;
    }
    
    // Vérification de l'unicité avec le hook
    try {
      console.log('🔍 handleEmailValidation: Vérification unicité...');
      const emailExists = await checkEmail(email);
      
      // Si l'email existe ET que ce n'est pas le même que l'email actuel
      const currentEmail = userData?.utilisateur?.email;
      console.log('📧 handleEmailValidation: Email actuel:', currentEmail, '| Email saisi:', email, '| Existe:', emailExists);
      
      if (emailExists && email !== currentEmail) {
        console.log('❌ handleEmailValidation: Email déjà utilisé');
        setEmailValidation({ 
          isValid: false, 
          message: 'Cette adresse email est déjà utilisée par un autre utilisateur', 
          isChecking: false 
        });
        setEmailCheckMessage('Cette adresse email est déjà utilisée par un autre utilisateur');
        return false;
      }
      
      console.log('✅ handleEmailValidation: Email valide');
      setEmailValidation({ isValid: true, message: 'Email valide', isChecking: false });
      setEmailCheckMessage('Email valide ✓');
      return true;
    } catch (error) {
      console.error('❌ handleEmailValidation: Erreur:', error);
      setEmailValidation({ 
        isValid: false, 
        message: 'Erreur lors de la vérification de l\'email', 
        isChecking: false 
      });
      setEmailCheckMessage('Erreur lors de la vérification de l\'email');
      return false;
    }
  };

  // MODIFIÉ: Handler pour l'email avec validation
  const handleEmailChange = (value: string) => {
    if (emailCheckTimeout) clearTimeout(emailCheckTimeout);
    setForm(prev => ({ ...prev, email: value }));
    setEmailCheckMessage('');
    setEmailValidation({ isValid: true, message: '', isChecking: false });
    
    // Délai pour éviter trop de requêtes
    if (editingFields['email'] && value.trim()) {
      const timeout = setTimeout(() => {
        handleEmailValidation(value);
      }, 500);
      setEmailCheckTimeout(timeout);
    }
  };

  const handleInputChange = (value: string, event: React.FormEvent<HTMLInputElement>) => {
    const name = event.currentTarget.name;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Gestion des résultats de mutation
  React.useEffect(() => {
    if (modalStep === 'result') {
      if (updateUtilisateur.isSuccess) {
        setConfirmModalMessage('Modification réussie !');
        setEditingFields({});
      }
      if (updateUtilisateur.isError) {
        setConfirmModalMessage(updateUtilisateur.error?.message || 'Échec de la modification.');
      }
    }
  }, [updateUtilisateur.isSuccess, updateUtilisateur.isError, updateUtilisateur.error, modalStep]);

  // Fonction pour vérifier si l'utilisateur peut modifier le statut
  const canEditStatus = () => {
    return userRole === 'super-administrateur';
  };

  // Fonction pour formater les modifications
  const formatModifications = (): ModificationItem[] => {
    const modifications: ModificationItem[] = [];
    const originalData = userData?.utilisateur;

    if (editingFields['email'] && form.email !== originalData?.email) {
      modifications.push({
        field: 'Email',
        oldValue: originalData?.email || 'Non défini',
        newValue: form.email
      });
    }
    
    if (editingFields['date_naissance'] && form.date_naissance !== originalData?.date_of_birth) {
      const originalDate = originalData?.date_of_birth ? formatDateForInput(originalData.date_of_birth) : 'Non défini';
      modifications.push({
        field: 'Date de naissance',
        oldValue: originalDate,
        newValue: form.date_naissance
      });
    }
    
    if (editingFields['status'] && form.status !== String(originalData?.status || '')) {
      // Trouver le nom du statut original
      const originalStatusId = originalData?.status;
      let originalStatusName = 'Non défini';
      if (originalStatusId && statusList) {
        const status = statusList.find(s => String(s.id) === String(originalStatusId));
        originalStatusName = status?.nom_status || String(originalStatusId);
      }
      
      // Trouver le nom du nouveau statut
      let newStatusName = form.status;
      if (statusList) {
        const status = statusList.find(s => String(s.id) === form.status);
        newStatusName = status?.nom_status || form.status;
      }
      
      modifications.push({
        field: 'Statut/Rôle',
        oldValue: originalStatusName,
        newValue: newStatusName
      });
    }

    if (editingFields['genres'] && form.genres !== String(originalData?.genres || '')) {
      // Trouver le nom du genre original
      const originalGenreId = originalData?.genres;
      let originalGenreName = 'Non défini';
      if (originalGenreId && genresList) {
        const genre = genresList.find(g => String(g.id) === String(originalGenreId));
        originalGenreName = genre?.genre_name || String(originalGenreId);
      }
      
      // Trouver le nom du nouveau genre
      let newGenreName = form.genres;
      if (genresList) {
        const genre = genresList.find(g => String(g.id) === form.genres);
        newGenreName = genre?.genre_name || form.genres;
      }
      
      modifications.push({
        field: 'Genre',
        oldValue: originalGenreName,
        newValue: newGenreName
      });
    }
    
    if (editingFields['grades'] && form.grades !== String(originalData?.grades || '')) {
      const originalGrade = String(originalData?.grades || 'Non défini');
      modifications.push({
        field: 'Grade',
        oldValue: originalGrade,
        newValue: form.grades
      });
    }
    
    if (editingFields['abonnement'] && form.abonnement !== String(originalData?.abonnement || '')) {
      // Trouver le nom de l'abonnement original
      const originalAbonnementId = originalData?.abonnement;
      let originalAbonnementName = 'Non défini';
      if (originalAbonnementId && abonnements) {
        const abonnement = abonnements.find(a => String(a.id) === String(originalAbonnementId));
        originalAbonnementName = abonnement?.nom_plan || String(originalAbonnementId);
      }
      
      // Trouver le nom du nouvel abonnement
      let newAbonnementName = form.abonnement;
      if (abonnements) {
        const abonnement = abonnements.find(a => String(a.id) === form.abonnement);
        newAbonnementName = abonnement?.nom_plan || form.abonnement;
      }
      
      modifications.push({
        field: 'Abonnement',
        oldValue: originalAbonnementName,
        newValue: newAbonnementName
      });
    }

    return modifications;
  };

  // Fonction pour valider les changements
  const handleValidateChanges = async () => {
    if (!form.id) return;

    // Vérification spéciale pour l'email si modifié
    if (editingFields['email'] && form.email !== userData?.utilisateur?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setModalMessage('Veuillez entrer une adresse email valide.');
        setModalSuccess(false);
        setShowResultModal(true);
        return;
      }
      
      // Vérification de l'unicité
      try {
        console.log('🔍 Vérification unicité email avant sauvegarde:', form.email);
        const emailExists = await checkEmail(form.email);
        console.log('📧 Email exists result:', emailExists);
        
        if (emailExists) {
          setModalMessage('Cette adresse email est déjà utilisée par un autre utilisateur.');
          setModalSuccess(false);
          setShowResultModal(true);
          return;
        }
      } catch (error) {
        console.error('❌ Erreur vérification email:', error);
        setModalMessage('Erreur lors de la vérification de l\'email. Veuillez réessayer.');
        setModalSuccess(false);
        setShowResultModal(true);
        return;
      }
    }

    const modifications = formatModifications();

    if (modifications.length > 0) {
      setModificationsResume(modifications);
      setShowConfirmModal(true);
    } else {
      setModalMessage("Aucune modification détectée.");
      setModalSuccess(false);
      setShowResultModal(true);
    }
  };

  // Fonction pour confirmer les modifications
  const confirmerModifications = async () => {
    setShowConfirmModal(false);
    
    if (!form.id) return;

    // Créer l'objet des changements à envoyer
    const changes: any = { id: form.id };
    
    if (editingFields['email']) changes.email = form.email;
    if (editingFields['date_naissance']) changes.date_of_birth = form.date_naissance;
    if (editingFields['genres']) changes.genres = form.genres;
    if (editingFields['grades']) changes.grades = form.grades;
    if (editingFields['abonnement']) changes.abonnement = form.abonnement;
    if (editingFields['status'] && canEditStatus()) changes.status = form.status; // Ajout du statut

    try {
      await updateUtilisateur.mutateAsync(changes);
      setModalMessage('Les modifications apportées ont été sauvegardées avec succès.');
      setModalSuccess(true);
      setEditingFields({});
    } catch (error) {
      setModalMessage('Une erreur est survenue lors de la sauvegarde des modifications. Veuillez réessayer.');
      setModalSuccess(false);
    }
    
    setShowResultModal(true);
  };

  const handleCloseModal = () => {
    // Si on est à l'étape de résumé, lancer la mutation avant de fermer
    if (pendingChanges && modalStep === 'summary') {
      updateUtilisateur.mutate(pendingChanges);
      setModalStep('result');
      return;
    }
    // Sinon, ferme la modal normalement
    setIsConfirmModalOpen(false);
    setPendingChanges(null);
    setModalStep('summary');
  };

  const annulerModifications = () => {
    setShowConfirmModal(false);
    setModificationsResume([]);
  };

  // Fonction pour envoyer un rappel de paiement
  const handleEnvoyerRappel = async () => {
    if (!userData?.utilisateur?.id) return;
    
    console.log('🔍 [ConsulterUtilisateur] Données complètes paiementsEcheances:', paiementsEcheances);
    console.log('🔍 [ConsulterUtilisateur] Type de paiementsEcheances:', typeof paiementsEcheances);
    console.log('🔍 [ConsulterUtilisateur] Est un tableau:', Array.isArray(paiementsEcheances));
    
    // Vérifier si paiementsEcheances est bien un tableau
    if (!Array.isArray(paiementsEcheances)) {
      console.error('❌ [ConsulterUtilisateur] paiementsEcheances n\'est pas un tableau:', paiementsEcheances);
      setModalMessage('Erreur: Impossible de récupérer les échéances de paiement.');
      setModalSuccess(false);
      setShowResultModal(true);
      return;
    }
    
    console.log('🔍 [ConsulterUtilisateur] Données disponibles pour rappel:', {
      userId: userData.utilisateur.id,
      paiementsEcheances_length: paiementsEcheances.length,
      paiementsEcheances_type: typeof paiementsEcheances,
      paiementsEcheances_isArray: Array.isArray(paiementsEcheances),
      paiementsEcheances_contenu: paiementsEcheances
    });
    
    // Extraire les IDs des échéances en attente avec plus de debug
    const echeancesEnAttente = paiementsEcheances.filter((echeance, index) => {
      console.log(`🔍 [ConsulterUtilisateur] Échéance ${index}:`, echeance);
      console.log(`🔍 [ConsulterUtilisateur] Statut échéance ${index}:`, echeance?.statut);
      return echeance && echeance.statut === 'en attente';
    });
    
    console.log('🔍 [ConsulterUtilisateur] Échéances en attente filtrées:', echeancesEnAttente);
    
    const echeanceIds = echeancesEnAttente.map((echeance, index) => {
      console.log(`🔍 [ConsulterUtilisateur] Extraction ID échéance ${index}:`, echeance.id);
      return echeance.id;
    }).filter(id => id !== undefined && id !== null);
    
    console.log('📧 [ConsulterUtilisateur] Échéances à rappeler:', {
      totalEcheances: paiementsEcheances.length,
      echeancesEnAttente: echeancesEnAttente.length,
      echeanceIds,
      echeanceIds_type: typeof echeanceIds,
      echeanceIds_isArray: Array.isArray(echeanceIds)
    });
    
    if (!Array.isArray(echeanceIds) || echeanceIds.length === 0) {
      setModalMessage('Aucune échéance en attente trouvée pour cet utilisateur.');
      setModalSuccess(false);
      setShowResultModal(true);
      return;
    }
    
    setRappelLoading(true);
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   JSON.parse(localStorage.getItem('userData') || '{}').token;

      const requestBody = {
        echeanceIds: echeanceIds,
        messagePersonnalise: ''
      };

      console.log('📤 [ConsulterUtilisateur] Envoi requête rappel avec:', requestBody);
      console.log('📤 [ConsulterUtilisateur] JSON.stringify du body:', JSON.stringify(requestBody));

      const response = await fetch(apiUrl('messages/envoyer-rappel'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      console.log('📨 [ConsulterUtilisateur] Réponse serveur:', responseData);

      if (response.ok && responseData.success) {
        // MODIFIÉ: Message détaillé avec informations sur l'email
        let successMessage = `✅ Rappel de paiement envoyé avec succès pour ${echeanceIds.length} échéance(s) !`;
        
        if (responseData.data?.emailEnvoye) {
          const emailData = responseData.data.emailEnvoye;
          if (emailData.success) {
            successMessage += `\n\n📧 Email envoyé avec succès à : ${emailData.email}`;
            if (emailData.messageId) {
              successMessage += `\n🆔 ID du message : ${emailData.messageId}`;
            }
          } else {
            successMessage += `\n\n⚠️ L'email n'a pas pu être envoyé à : ${emailData.email || 'email non spécifié'}`;
            if (emailData.error) {
              successMessage += `\n❌ Raison : ${emailData.error}`;
            }
          }
        } else {
          successMessage += '\n\n📧 Email : Aucune information disponible sur l\'envoi d\'email';
        }

        // AJOUTÉ: Informations sur les échéances concernées
        if (echeancesEnAttente.length > 0) {
          successMessage += '\n\n📋 Échéances concernées :';
          echeancesEnAttente.forEach((echeance, index) => {
            successMessage += `\n• Échéance #${echeance.id}: ${echeance.montant}€ (${new Date(echeance.date_echeance).toLocaleDateString('fr-FR')})`;
          });
        }

        setModalMessage(successMessage);
        setModalSuccess(true);
      } else {
        // MODIFIÉ: Message d'erreur détaillé
        let errorMessage = responseData.message || 'Erreur lors de l\'envoi du rappel';
        
        if (responseData.data?.emailEnvoye?.error) {
          errorMessage += `\n\n📧 Détails de l'erreur email : ${responseData.data.emailEnvoye.error}`;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Erreur serveur:', error);
      console.error('❌ Erreur envoi rappel:', error);
      
      let errorMessage = `❌ Erreur lors de l'envoi du rappel: ${error.message}`;
      
      // AJOUTÉ: Suggestions d'action en cas d'erreur
      if (error.message.includes('email')) {
        errorMessage += '\n\n💡 Suggestions :';
        errorMessage += '\n• Vérifiez que l\'utilisateur a une adresse email valide';
        errorMessage += '\n• Contactez l\'administrateur si le problème persiste';
      } else if (error.message.includes('échéance')) {
        errorMessage += '\n\n💡 Suggestions :';
        errorMessage += '\n• Vérifiez que les échéances existent dans la base de données';
        errorMessage += '\n• Actualisez la page et réessayez';
      }
      
      setModalMessage(errorMessage);
      setModalSuccess(false);
    } finally {
      setRappelLoading(false);
      setShowResultModal(true);
    }
  };

  // MODIFIÉ: Fonction pour rediriger vers le paiement avec userId
  const handleAllerPaiement = () => {
    const userId = userData?.utilisateur?.id;
    if (userId) {
      // Format demandé: /pages/paiement?echeance=XXXX&userId=154
      // Pour l'instant, sans échéance spécifique, on peut juste inclure l'userId
      window.location.href = `/pages/paiement?userId=${userId}`;
      console.log(`🔗 [ConsulterUtilisateur] Redirection vers paiement avec userId: ${userId}`);
    } else {
      console.error('❌ [ConsulterUtilisateur] Aucun userId trouvé pour la redirection');
      window.location.href = '/pages/paiement';
    }
  };

  if (loadingUser) return <Spinner size="xl" />;
  if (userError) return <Alert variant="danger" title={(userError as Error).message || "Une erreur est survenue"} />;

  const userName = userData?.utilisateur ? 
    `${userData.utilisateur.first_name} ${userData.utilisateur.last_name}` : 
    'Utilisateur inconnu';

  // Déterminer si on est sur la page compte
  const isComptePage = location.pathname.includes('/compte');
  
  return (
    <PageSection>
      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
        <FlexItem>
          <Title headingLevel="h1" style={{ marginBottom: '1rem' }}>
            {userName}
          </Title>
        </FlexItem>
        <FlexItem>
          {isComptePage ? (
            <Button
              variant="primary"
              icon={<CreditCardIcon />}
              onClick={handleAllerPaiement}
            >
              Payer
            </Button>
          ) : (
            <Button
              variant="secondary"
              icon={<EnvelopeIcon />}
              onClick={handleEnvoyerRappel}
              isLoading={rappelLoading}
              isDisabled={rappelLoading}
            >
              {rappelLoading ? 'Envoi en cours...' : 'Envoyer rappel'}
            </Button>
          )}
        </FlexItem>
      </Flex>

      <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
        <Tab eventKey={0} title={<TabTitleText>Informations personnelles</TabTitleText>}>
          <FormulaireUtilisateur
            form={form}
            editingFields={editingFields}
            emailCheckMessage={emailCheckMessage}
            emailValidation={emailValidation} // AJOUTÉ: Passer l'état de validation
            abonnements={abonnements}
            gradesList={gradesList}
            statusList={statusList}
            genresList={genresList}
            onEditClick={handleEditClick}
            onEmailChange={handleEmailChange}
            onInputChange={handleInputChange}
            onFormChange={handleFormChange}
            onValidateChanges={handleValidateChanges}
            isLoading={updateUtilisateur.isPending}
            formatDateForInput={formatDateForInput}
            canEditStatus={canEditStatus()}
            disabledFields={{
              status: !canEditStatus()
            }}
          />
        </Tab>
        
        <Tab eventKey={1} title={<TabTitleText>Statistiques</TabTitleText>}>
          <StatistiquesTab
            statsDataReady={statsDataReady}
            statFrequentationForGraph={statFrequentationForGraph}
            chartType={chartType}
            onChartTypeChange={setChartType}
          />
        </Tab>
        
        <Tab eventKey={2} title={<TabTitleText>Paiements</TabTitleText>}>
          <EcheancesPaiement 
            paiementsEcheances={paiementsEcheances} 
            userId={userData?.utilisateur?.id} // MODIFIÉ: Passer l'userId au composant EcheancesPaiement
          />
        </Tab>
      </Tabs>

      <ResumeConfirmModal
        isOpen={showConfirmModal}
        onClose={annulerModifications}
        onConfirm={confirmerModifications}
        title="Confirmer les modifications"
        message={`Vous êtes sur le point de modifier les informations de ${userData?.utilisateur?.first_name} ${userData?.utilisateur?.last_name}.`}
        modificationsResume={modificationsResume}
      />
      
      <ResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title={modalSuccess ? 'Rappel de paiement envoyé' : 'Erreur d\'envoi'}
        message={modalMessage}
        isSuccess={modalSuccess}
      />
    </PageSection>
  );
};

export default ConsulterUtilisateurPage;

