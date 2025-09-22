import React, { useEffect, useState } from 'react';
import { PageSection } from '@patternfly/react-core';
import { UserIcon, TableIcon } from '@patternfly/react-icons';
import type { UserData } from '@clubmanager/types';
import {
  useUtilisateurs,
  checkEmailExists,
  useUpdateUtilisateur,
  useDeleteUtilisateur,
  useAjouterUtilisateur
} from '../../hooks/useUtilisateurs';
import { ModalConfirmation, ModalResultat } from '../../components/common/modal/ModalsGestion';
import ModalWithHelp from '../../components/common/modal/ModalWithHelp';
import OngletTableauUtilisateurs from '../../components/utilisateurs/OngletTableauUtilisateurs';
import FormulaireUtilisateurAjout from '../../components/utilisateurs/FormulaireUtilisateurAjout';
import { PageHeader } from '../../components/common/PageHeader';
import { TabContainer } from '../../components/common/TabContainer';
import { useAbonnements, useGrades, useStatus, useGenres } from '../../hooks/useInformations';
import { useQueryClient } from '@tanstack/react-query';
import { useUserContext } from '../../context/UserContext';

const Utilisateur = () => {
  const { selectedUser, setSelectedUser, selectedUserId, setSelectedUserId } = useUserContext();

  // Ajoutez cet effet pour surveiller les changements de selectedUserId
  useEffect(() => {

  }, [selectedUserId]);

  // ========== États ==========
  const [activeTabKey, setActiveTabKey] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    nom_utilisateur: '',
    email: '',
    date_naissance: '',
    genres: '',
    grades: '',
    abonnement: '',
    grade: '',
    statut: '',
  });
  const [errors, setErrors] = useState({
    email: '',
  });
  const [selectOptions, setSelectOptions] = useState<Record<string, any[]>>({});
  const [userSchema, setUserSchema] = useState<Record<string, string> | null>(null);

  // États pour les modales
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalVariant, setConfirmModalVariant] = useState<'confirmation' | 'success' | 'error' | 'loading'>('confirmation');
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalError, setConfirmModalError] = useState<string | null>(null);
  const [confirmModalSuccess, setConfirmModalSuccess] = useState('');

  // États pour la suppression
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [utilisateurToDelete, setUtilisateurToDelete] = useState<UserData | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState('');
  const [resultModalLoading, setResultModalLoading] = useState(false);
  const [showConfirmAddModal, setShowConfirmAddModal] = useState(false);

  // État pour la modal d'utilisateur existant
  const [existingUserModalOpen, setExistingUserModalOpen] = useState(false);
  const [existingUserMessage, setExistingUserMessage] = useState('');

  // ========== Hooks ==========
  const { data: utilisateursData = [], isLoading: isLoadingUtilisateurs } = useUtilisateurs();
  const updateUtilisateur = useUpdateUtilisateur();
  const deleteUtilisateur = useDeleteUtilisateur();
  const ajouterUtilisateur = useAjouterUtilisateur();
  const { data: abonnements = [] } = useAbonnements();
  const { data: grades = [] } = useGrades();
  const { data: statuts = [] } = useStatus();
  const { data: genres = [] } = useGenres();
  const queryClient = useQueryClient();

  // ========== Fonctions de validation ==========
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = re.test(email);
    return isValid;
  };

  // ========== Initialisation ==========
  useEffect(() => {
    if (
      abonnements.length > 0 &&
      grades.length > 0 &&
      statuts.length > 0 &&
      genres.length > 0 &&
      !userSchema
    ) {
      setUserSchema({
        first_name: 'string',
        last_name: 'string',
        email: 'string',
        status: 'string',
      });
      setSelectOptions({
        abonnements: abonnements.map(a => ({
          id: a.id?.toString() || '',
          label: a.nom_plan && a.prix && a.periode
            ? `${a.nom_plan} (${a.prix}€/${a.periode})`
            : 'Abonnement invalide',
        })),
        grades: grades.map(g => ({
          id: g.id?.toString() || '',
          label: g.grade_id?.toString() || 'Grade invalide',
        })),
        statuts: statuts.map(s => ({
          id: s.id?.toString() || '',
          label: s.nom_role || 'Statut invalide',
        })),
        genres: genres.map(g => ({
          id: g.id?.toString() || '',
          label: g.genre_name || 'Genre invalide',
        })),
        status: [...new Set(statuts.map(s => s.nom_role))].map(status => ({
          id: status?.toString() || '',
          label: status?.toString() || 'Statut invalide',
        })),
      });
    }
  }, [abonnements, grades, statuts, genres, userSchema]);

  // ========== Gestion des changements ==========
  const handleChange = (value: string, key: string) => {
    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        [key]: value,
      };
      if (key === 'prenom' || key === 'nom') {
        updatedFormData.nom_utilisateur = `${updatedFormData.prenom.toLowerCase()}.${updatedFormData.nom.toLowerCase()}`;
      }
      return updatedFormData;
    });

    if (key === 'email') {
      setErrors(prev => ({
        ...prev,
        email: value && !validateEmail(value) ? "Format d'email invalide" : ""
      }));
    }
    if (key === 'date_naissance') {
      const today = new Date().toISOString().split('T')[0];
      if (value > today) {
        setErrors(prev => ({
          ...prev,
          date_naissance: "La date de naissance ne peut pas être dans le futur"
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          date_naissance: ""
        }));
      }
    }
  };

  const handleDateNaissanceChange = (value: string) => {
    handleChange(value, 'date_naissance');
  };

  // ========== Vérification de l'email avant confirmation ==========
  const checkEmailBeforeConfirm = async () => {
    if (!validateEmail(formData.email)) {
      setErrors({ email: "Format d'email invalide", date_naissance: '' });
      return false;
    }
    if (formData.email) {
      try {
        const emailExists = await checkEmailExists(formData.email);
        if (emailExists.exists) {
          setExistingUserMessage(`Un utilisateur avec l'adresse email "${formData.email}" existe déjà.`);
          setExistingUserModalOpen(true);
          return false;
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'email:", error);
        setConfirmModalVariant('error');
        setConfirmModalTitle('Erreur de validation');
        setConfirmModalError('Une erreur est survenue lors de la vérification de l\'email.');
        setConfirmModalOpen(true);
        return false;
      }
    }
    return true;
  };

  // ========== Gestion des modales ==========
  const openConfirmAddModal = async () => {
    const canProceed = await checkEmailBeforeConfirm();
    if (canProceed) {
      setShowConfirmAddModal(true);
    }
  };

  const closeConfirmAddModal = () => {
    setShowConfirmAddModal(false);
  };

  const openDeleteModal = (user: UserData) => {
    setSelectedUser(user);
    if (user.id) {
      setSelectedUserId(user.id);
    } else {
    }
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteUtilisateur = async () => {
    if (!selectedUserId) {
      console.error('Aucun ID utilisateur sélectionné pour suppression.');
      return;
    }
    setResultModalLoading(true);
    setResultModalMessage('Suppression en cours...');
    setResultModalOpen(true);
    try {
      const result = await deleteUtilisateur.mutateAsync(selectedUserId);
      setResultModalMessage(result.message || 'Suppression réussie');
      // Invalide la liste des utilisateurs pour la mettre à jour
      await queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
    } catch (error) {
      setResultModalMessage('Erreur lors de la suppression. Veuillez réessayer.');
    } finally {
      setResultModalLoading(false);
      setConfirmDeleteOpen(false);
      setSelectedUser(null);
      setSelectedUserId(null);
    }
  };

  const confirmAddUtilisateur = async () => {
    setShowConfirmAddModal(false);
    setConfirmModalVariant('loading');
    setConfirmModalTitle('Création en cours...');
    setConfirmModalError(null);
    setConfirmModalSuccess('');
    try {
      // Conversion explicite AVANT d'envoyer à l'API (pour garantir la conversion côté front)
      const userData = {
        first_name: formData.prenom,
        last_name: formData.nom,
        nom_utilisateur: formData.nom_utilisateur,
        email: formData.email,
        date_of_birth: formData.date_naissance,
        genres: Number(formData.genres),
        grades: Number(formData.grade),
        abonnement: Number(formData.abonnement),
        status: Number(formData.statut),
      };
      console.log('[confirmAddUtilisateur] Données envoyées au backend :', userData);
      await ajouterUtilisateur.mutateAsync(userData);
      setConfirmModalVariant('success');
      setConfirmModalTitle('Notification');
      setConfirmModalSuccess('<p>Utilisateur créé avec succès</p>');
      setFormData({
        prenom: '',
        nom: '',
        nom_utilisateur: '',
        email: '',
        date_naissance: '',
        genres: '',
        grades: '',
        abonnement: '',
        grade: '',
        statut: '',
      });
      setErrors({ email: '' });
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] });
    } catch (error: any) {
      setConfirmModalVariant('error');
      setConfirmModalTitle('Erreur système');
      setConfirmModalError(error.message || 'Une erreur technique est survenue. Veuillez réessayer.');
      console.error('Erreur lors de l\'ajout:', error);
    } finally {
      setConfirmModalOpen(true);
    }
  };

  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setConfirmModalVariant('confirmation');
    setConfirmModalTitle('');
    setConfirmModalError(null);
    setConfirmModalSuccess('');
  };

  const closeExistingUserModal = () => {
    setExistingUserModalOpen(false);
    setExistingUserMessage('');
  };

  // ========== Colonnes et onglets ==========
  const columns = [
    { key: 'first_name', label: 'Prénom', ariaLabel: 'Prénom' },
    { key: 'last_name', label: 'Nom', ariaLabel: 'Nom' },
    { key: 'email', label: 'Email', ariaLabel: 'Adresse email' },
    { key: 'status', label: 'Statut', ariaLabel: 'Statut de l\'utilisateur' },
  ];

  // Remplace le callback onDeleteUser pour qu'il ne fasse que sauvegarder l'utilisateur et son id dans le contexte,
  // puis ouvre la modale de confirmation. La suppression réelle doit être déclenchée par la modale.
  const onDeleteUser = (user: UserData) => {
    setSelectedUser(user);
    setSelectedUserId(user.id);
    setConfirmDeleteOpen(true); // Ouvre ModalConfirmation pour demander la confirmation
  };

  const tabs = [
    {
      key: 0,
      title: 'Consulter les utilisateurs',
      icon: <TableIcon />,
      content: (
        <OngletTableauUtilisateurs
          utilisateurs={utilisateursData}
          columns={columns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={isLoadingUtilisateurs}
          onRequestDelete={onDeleteUser} // Passe la prop au tableau
        />
      )
    },
    {
      key: 1,
      title: 'Ajouter un utilisateur',
      icon: <UserIcon />,
      content: (
        <FormulaireUtilisateurAjout
          prenom={formData.prenom}
          nom={formData.nom}
          email={formData.email}
          dateNaissance={formData.date_naissance}
          genre={formData.genres}
          abonnement={formData.abonnement}
          grade={formData.grade}
          statut={formData.statut}
          abonnements={selectOptions.abonnements || []}
          grades={selectOptions.grades || []}
          statuts={selectOptions.statuts || []}
          genres={selectOptions.genres || []}
          onPrenomChange={(value) => handleChange(value, 'prenom')}
          onNomChange={(value) => handleChange(value, 'nom')}
          onEmailChange={(value) => handleChange(value, 'email')}
          onDateNaissanceChange={handleDateNaissanceChange}
          onGenreChange={(value) => handleChange(value, 'genres')}
          onAbonnementChange={(value) => handleChange(value, 'abonnement')}
          onGradeChange={(value) => handleChange(value, 'grade')}
          onStatutChange={(value) => handleChange(value, 'statut')}
          onSubmit={(e) => {
            e.preventDefault();
            openConfirmAddModal();
          }}
          emailError={errors.email}
        />
      )
    }
  ];

  // ========== Render ==========
  return (
    <div className="users-page">
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle="Ajoutez de nouveaux utilisateurs et consultez la liste existante"
        variant="users"
      />


      <PageSection className="users-content">
        <TabContainer
          tabs={[
            {
              key: 0,
              title: 'Consulter les utilisateurs',
              icon: <TableIcon />,
              content: (
                <OngletTableauUtilisateurs
                  utilisateurs={utilisateursData}
                  columns={columns}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  isLoading={isLoadingUtilisateurs}
                  onDeleteUser={onDeleteUser}
                />
              )
            },
            {
              key: 1,
              title: 'Ajouter un utilisateur',
              icon: <UserIcon />,
              content: (
                <FormulaireUtilisateurAjout
                  prenom={formData.prenom}
                  nom={formData.nom}
                  email={formData.email}
                  dateNaissance={formData.date_naissance}
                  genre={formData.genres}
                  abonnement={formData.abonnement}
                  grade={formData.grade}
                  statut={formData.statut}
                  abonnements={selectOptions.abonnements || []}
                  grades={selectOptions.grades || []}
                  statuts={selectOptions.statuts || []}
                  genres={selectOptions.genres || []}
                  onPrenomChange={(value) => handleChange(value, 'prenom')}
                  onNomChange={(value) => handleChange(value, 'nom')}
                  onEmailChange={(value) => handleChange(value, 'email')}
                  onDateNaissanceChange={handleDateNaissanceChange}
                  onGenreChange={(value) => handleChange(value, 'genres')}
                  onAbonnementChange={(value) => handleChange(value, 'abonnement')}
                  onGradeChange={(value) => handleChange(value, 'grade')}
                  onStatutChange={(value) => handleChange(value, 'statut')}
                  onSubmit={(e) => {
                    e.preventDefault();
                    openConfirmAddModal();
                  }}
                  emailError={errors.email}
                />
              )
            }
          ]}
          activeKey={activeTabKey}
          onTabSelect={setActiveTabKey}
          variant="modern"
        />
      </PageSection>

      {/* Modale de confirmation de suppression */}
      <ModalConfirmation
        isOpen={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
        }}
        onConfirm={() => {
          confirmDeleteUtilisateur(); // Effectue la suppression si confirmé
        }}
        title="Confirmer la suppression"
        message={
          selectedUser
            ? `Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>${selectedUser.first_name} ${selectedUser.last_name}</strong> ?`
            : ''
        }
        confirmText="Supprimer"
        variant="danger"
      />

      {/* Modale de résultat */}
      <ModalResultat
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title="Information"
        message={resultModalMessage} // Affiche le message de succès ou d'erreur
        isLoading={resultModalLoading}
      />

      {/* Modal de confirmation d'ajout */}
      <ModalConfirmation
        title="Confirmer l'ajout de l'utilisateur"
        isOpen={showConfirmAddModal}
        onClose={closeConfirmAddModal}
        onConfirm={confirmAddUtilisateur}
        confirmText="Oui, ajouter"
        variant="primary"
        isDisabled={!!errors.email}
      >
        <div>
          <p>Êtes-vous sûr de vouloir ajouter cet utilisateur avec les informations suivantes ?</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Prénom :</strong> {formData.prenom}</li>
            <li><strong>Nom :</strong> {formData.nom}</li>
            <li><strong>Email :</strong> {formData.email}</li>
            <li><strong>Date de naissance :</strong> {formData.date_naissance}</li>
            <li><strong>Genre :</strong> {selectOptions.genres?.find(g => g.id === formData.genres)?.label || ''}</li>
            <li><strong>Abonnement :</strong> {selectOptions.abonnements?.find(a => a.id === formData.abonnement)?.label || ''}</li>
            <li><strong>Grade :</strong> {selectOptions.grades?.find(g => g.id === formData.grade)?.label || ''}</li>
            <li><strong>Statut :</strong> {selectOptions.statuts?.find(s => s.id === formData.statut)?.label || ''}</li>
          </ul>
          {errors.email && <p style={{ color: 'red' }}>{errors.email}</p>}
        </div>
      </ModalConfirmation>

      {/* Modal pour utilisateur existant */}
      <ModalConfirmation
        isOpen={existingUserModalOpen}
        onClose={closeExistingUserModal}
        title="Notification"
        confirmText="OK"
        variant="danger"
        showCancelButton={false}
      >
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ fontSize: '1rem', fontWeight: 'normal', color: 'red' }}>
            {existingUserMessage}
          </p>
        </div>
      </ModalConfirmation>

      {/* Modal de confirmation générale */}
      <ModalConfirmation
        title={confirmModalTitle}
        isOpen={confirmModalOpen}
        onClose={closeConfirmModal}
        confirmText="OK"
        variant={confirmModalVariant}
        showCancelButton={false}
      >
        {confirmModalVariant === 'success' && (
          <div dangerouslySetInnerHTML={{ __html: confirmModalSuccess }} />
        )}
        {confirmModalVariant === 'error' && (
          <p style={{ color: 'red' }}>{confirmModalError}</p>
        )}
      </ModalConfirmation>
    </div>
  );
};

export default Utilisateur;
