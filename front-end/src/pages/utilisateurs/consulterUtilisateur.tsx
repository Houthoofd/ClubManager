import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Tabs,
  Tab,
  TabTitleText,
  PageSection,
  Title,
  Spinner,
  Alert,
  Button,
} from '@patternfly/react-core';
import { useUtilisateurById, useUpdateUtilisateur, checkEmailExists } from '../../hooks/useUtilisateurs';
import { useFrequentationByUserId } from '../../hooks/useStatistiques';
import { useAbonnements, useGrades, useStatus } from '../../hooks/useInformations';
import { useEcheancesByUserId } from '../../hooks/usePaiements';
import FormulaireUtilisateur from '../../components/utilisateurs/FormulaireUtilisateur';
import EcheancesPaiement from '../../components/utilisateurs/EcheancesPaiement';
import StatistiquesUtilisateur from '../../components/utilisateurs/StatistiquesUtilisateur';
import ModalsUtilisateur from '../../components/common/modal/ModalsUtilisateur';
import ModalsCompte from '../../components/compte/ModalsCompte'; // Import de la modal

function formatDateForInput(isoDateString: string): string {
  const date = new Date(isoDateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const ConsulterUtilisateurPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalSuccess, setModalSuccess] = useState<boolean>(false);
  const [modificationsResume, setModificationsResume] = useState<string[]>([]);
  const [emailCheckMessage, setEmailCheckMessage] = useState<string>('');
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [frequentationData, setFrequentationData] = useState<any[]>([]);
  const [isFrequentationModalOpen, setIsFrequentationModalOpen] = useState(false);
  const [frequentationModalMessage, setFrequentationModalMessage] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');

  // Hooks React Query
  const { data: userData, isLoading: loadingUser, error: userError } = useUtilisateurById(id);
  const { data: statFrequentation, isLoading: loadingStats } = useFrequentationByUserId(id);
  const { data: abonnements = [] } = useAbonnements();
  const { data: gradesList = [] } = useGrades();
  const { data: statusList = [] } = useStatus();
  const { data: paiementsEcheances = [] } = useEcheancesByUserId(id);
  const updateUtilisateur = useUpdateUtilisateur();

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

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    eventKey: string | number
  ) => {
    setActiveTabKey(Number(eventKey));
  };

  const handleEditClick = (field: string) => {
    setEditingFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailChange = (value: string) => {
    if (emailCheckTimeout) clearTimeout(emailCheckTimeout);
    setForm(prev => ({ ...prev, email: value }));
    setEmailCheckMessage('');
  };

  const handleInputChange = (value: string, event: React.FormEvent<HTMLInputElement>) => {
    const name = event.currentTarget.name;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Fonction pour valider les changements
  const handleValidateChanges = () => {
    if (!form.id) return;

    const modifications: string[] = [];
    const originalData = userData?.utilisateur;

    if (editingFields['email'] && form.email !== originalData?.email) {
      modifications.push(`Email: "${originalData?.email}" → "${form.email}"`);
    }
    if (editingFields['date_naissance'] && form.date_naissance !== originalData?.date_of_birth) {
      modifications.push(`Date de naissance: "${originalData?.date_of_birth}" → "${form.date_naissance}"`);
    }
    if (editingFields['genres'] && form.genres !== String(originalData?.genres || '')) {
      modifications.push(`Genre: "${originalData?.genres || 'Non défini'}" → "${form.genres}"`);
    }
    if (editingFields['grades'] && form.grades !== String(originalData?.grades || '')) {
      modifications.push(`Grade: "${originalData?.grades || 'Non défini'}" → "${form.grades}"`);
    }
    if (editingFields['abonnement'] && form.abonnement !== String(originalData?.abonnement || '')) {
      modifications.push(`Abonnement: "${originalData?.abonnement || 'Non défini'}" → "${form.abonnement}"`);
    }

    if (modifications.length > 0) {
      setConfirmModalMessage(modifications.join('\n'));
      setIsConfirmModalOpen(true); // Ouvre la modal de confirmation
    } else {
      setModalMessage("Aucune modification détectée.");
      setModalSuccess(false);
      setShowResultModal(true);
    }
  };

  // Fonction pour confirmer les modifications
  const confirmerModifications = async () => {
    if (!form.id) return;

    setIsConfirmModalOpen(false); // Ferme la modal de confirmation

    const body = {
      id: form.id,
      email: form.email,
      date_naissance: form.date_naissance,
      genres: form.genres,
      grades: form.grades,
      abonnement: form.abonnement,
      status: form.status,
    };

    try {
      const result = await updateUtilisateur.mutateAsync(body);
      setModalMessage(result.message || 'Modifications enregistrées avec succès !');
      setModalSuccess(true);
      setShowResultModal(true);
      setEditingFields({});
    } catch (error: any) {
      setModalMessage(error.message || 'Erreur lors de la modification.');
      setModalSuccess(false);
      setShowResultModal(true);
    }
  };

  const annulerModifications = () => {
    setShowConfirmModal(false);
    setModificationsResume([]);
  };

  // Fonction pour récupérer les données de fréquentation
  const fetchFrequentationData = async () => {
    try {
      const response = await fetch(`/api/frequentation/${id}`); // Remplacez par l'URL correcte de votre API
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données de fréquentation');
      }
      const data = await response.json();
      setFrequentationData(data);

      // Construire le message pour la modal
      const message = data
        .map(
          (item: any) =>
            `Mois: ${item.mois}, Fréquentation: ${item.frequentation}, Total cours: ${item.nombres_total_de_cours_du_mois}, Pourcentage: ${item.pourcentage_de_cours_valides}%`
        )
        .join('\n');
      setFrequentationModalMessage(message);
      setIsFrequentationModalOpen(true); // Ouvre la modal après avoir récupéré les données
    } catch (error) {
      console.error('Erreur lors de la récupération des données de fréquentation:', error);
      setFrequentationModalMessage('Une erreur est survenue lors de la récupération des données.');
      setIsFrequentationModalOpen(true);
    }
  };

  if (loadingUser) return <Spinner size="xl" />;
  if (userError) return <Alert variant="danger" title={(userError as Error).message || "Une erreur est survenue"} />;

  const userName = userData?.utilisateur ? 
    `${userData.utilisateur.first_name} ${userData.utilisateur.last_name}` : 
    'Utilisateur inconnu';

  return (
    <PageSection>
      <Title headingLevel="h1" style={{ marginBottom: '1rem' }}>
        {userName}
      </Title>

      <Button
        variant="primary"
        onClick={fetchFrequentationData}
        style={{ marginBottom: '1rem' }}
      >
        Voir les statistiques de fréquentation
      </Button>

      <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
        <Tab eventKey={0} title={<TabTitleText>Informations personnelles</TabTitleText>}>
          <FormulaireUtilisateur
            form={form}
            editingFields={editingFields}
            emailCheckMessage={emailCheckMessage}
            abonnements={abonnements}
            gradesList={gradesList}
            onEditClick={handleEditClick}
            onEmailChange={handleEmailChange}
            onInputChange={handleInputChange}
            onFormChange={handleFormChange}
            onValidateChanges={handleValidateChanges}
            isLoading={updateUtilisateur.isPending}
            formatDateForInput={formatDateForInput}
          />
        </Tab>
        
        <Tab eventKey={1} title={<TabTitleText>Statistiques</TabTitleText>}>
          <StatistiquesUtilisateur
            statFrequentation={statFrequentation}
            isLoading={loadingStats}
          />
        </Tab>
        
        <Tab eventKey={2} title={<TabTitleText>Paiements</TabTitleText>}>
          <EcheancesPaiement paiementsEcheances={paiementsEcheances} />
        </Tab>
      </Tabs>

      <ModalsUtilisateur
        showConfirmModal={showConfirmModal}
        modificationsResume={modificationsResume}
        userName={userName}
        onAnnulerModifications={annulerModifications}
        onConfirmerModifications={confirmerModifications}
        showResultModal={showResultModal}
        modalSuccess={modalSuccess}
        modalMessage={modalMessage}
        onCloseResultModal={() => setShowResultModal(false)}
      />

      {/* Modal pour afficher les données de fréquentation */}
      <ModalsCompte
        isModalOpen={isFrequentationModalOpen}
        modalMessage={frequentationModalMessage}
        onCloseModal={() => setIsFrequentationModalOpen(false)}
      />

      {/* Modal de confirmation des modifications */}
      <ModalsCompte
        isModalOpen={isConfirmModalOpen}
        modalMessage={`Les modifications suivantes seront appliquées :\n\n${confirmModalMessage}`}
        onCloseModal={() => setIsConfirmModalOpen(false)}
      >
        <Button
          key="confirm"
          variant="primary"
          onClick={confirmerModifications}
        >
          Confirmer
        </Button>
        <Button
          key="cancel"
          variant="link"
          onClick={() => setIsConfirmModalOpen(false)}
        >
          Annuler
        </Button>
      </ModalsCompte>
    </PageSection>
  );
};


export default ConsulterUtilisateurPage;
