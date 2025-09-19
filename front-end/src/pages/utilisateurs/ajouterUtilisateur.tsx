import React, { useEffect, useState } from 'react';
import { PageSection } from '@patternfly/react-core';
import { UserIcon, TableIcon } from '@patternfly/react-icons';
import type { UserData } from '@clubmanager/types';
import {
  useUtilisateurs,
  checkEmailExists,
  useUpdateUtilisateur,
  useDeleteUtilisateur,
} from '../../hooks/useUtilisateurs';
import { ModalConfirmation, ModalResultat } from '../../components/common/modal/ModalsGestion';
import ModalWithHelp from '../../components/common/modal/modalwithhelp';
import OngletTableauUtilisateurs from '../../components/utilisateurs/OngletTableauUtilisateurs';
import OngletAjoutUtilisateur from '../../components/utilisateurs/OngletAjoutUtilisateur';
import { PageHeader } from '../../components/common/PageHeader';
import { TabContainer } from '../../components/common/TabContainer';

const Utilisateur = () => {
  // États pour la gestion des onglets et des données
  const [activeTabKey, setActiveTabKey] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [utilisateur, setUtilisateur] = useState<UserData | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [existenceMessages, setExistenceMessages] = useState<Record<string, string>>({});
  const [selectOpenStates, setSelectOpenStates] = useState<Record<string, boolean>>({});
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

  // Hooks React Query
  const { data: utilisateursData = [], isLoading: isLoadingUtilisateurs } = useUtilisateurs();
  const updateUtilisateur = useUpdateUtilisateur();
  const deleteUtilisateur = useDeleteUtilisateur();

  console.log(utilisateursData)

  // Initialisation du schéma et des options de sélection
  useEffect(() => {
    if (utilisateursData.length > 0 && !userSchema) {
      setUserSchema({
        first_name: 'string',
        last_name: 'string',
        email: 'string',
        status: 'string',
      });

      // Exemple : Initialisation des options pour les selects (à adapter selon vos besoins)
      const statusOptions = [...new Set(utilisateursData.map((user: UserData) => user.status))];
      setSelectOptions({
        status: statusOptions.map(status => ({ value: status, label: status })),
      });
    }
  }, [utilisateursData, userSchema]);

  // Gestion des changements dans le formulaire
  const handleChange = async (value: string, key: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Vérification d'existence pour les champs critiques
    if (['first_name', 'last_name', 'email', 'nom_utilisateur'].includes(key)) {
      try {
        const result = await checkEmailExists(value);
        setExistenceMessages(prev => ({
          ...prev,
          [key]: result.exists ? `Ce ${key} existe déjà : ${value}` : '',
        }));
      } catch (error) {
        setExistenceMessages(prev => ({
          ...prev,
          [key]: 'Erreur de vérification.',
        }));
      }
    }
  };

  // Gestion de l'ouverture/fermeture des selects
  const handleSelectToggle = (key: string, isOpen: boolean) => {
    setSelectOpenStates(prev => ({ ...prev, [key]: isOpen }));
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmModalVariant('confirmation');
    setConfirmModalTitle('Confirmer la création de l\'utilisateur');
    setConfirmModalError(null);
    setConfirmModalSuccess('');
    setConfirmModalOpen(true);
  };

  // Confirmation de l'ajout d'un utilisateur
  const confirmAddUser = async () => {
    setConfirmModalVariant('loading');
    setConfirmModalTitle('Création en cours...');

    try {
      // Vérification de l'email
      if (formData.email) {
        const isEmailUnique = await checkEmailExists(formData.email);
        if (isEmailUnique.exists) {
          setConfirmModalVariant('error');
          setConfirmModalTitle('Erreur de validation');
          setConfirmModalError('Cet email est déjà utilisé par un autre utilisateur.');
          return;
        }
      }

      // Création de l'utilisateur
      await updateUtilisateur.mutateAsync(formData as UserData);
      setConfirmModalVariant('success');
      setConfirmModalTitle('Utilisateur créé avec succès !');
      setConfirmModalSuccess('L\'utilisateur a été ajouté au système et peut maintenant se connecter.');

      // Réinitialisation du formulaire
      setFormData({});
      setExistenceMessages({});
    } catch (error) {
      setConfirmModalVariant('error');
      setConfirmModalTitle('Erreur système');
      setConfirmModalError('Une erreur technique est survenue. Veuillez réessayer.');
      console.error('Erreur lors de l\'ajout:', error);
    }
  };

  // Fermeture de la modale de confirmation
  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setConfirmModalVariant('confirmation');
    setConfirmModalTitle('');
    setConfirmModalError(null);
    setConfirmModalSuccess('');
  };

  // Ouverture de la modale de suppression
  const openDeleteModal = (user: UserData) => {
    setUtilisateurToDelete(user);
    setConfirmDeleteOpen(true);
  };

  // Confirmation de la suppression
  const confirmDeleteUtilisateur = async () => {
    if (!utilisateurToDelete) return;

    setResultModalLoading(true);
    setResultModalMessage('Suppression en cours...');
    setResultModalOpen(true);

    try {
      await deleteUtilisateur.mutateAsync(utilisateurToDelete.id);
      setResultModalMessage('Utilisateur supprimé avec succès !');
    } catch (error) {
      setResultModalMessage('Erreur lors de la suppression. Veuillez réessayer.');
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setResultModalLoading(false);
      setConfirmDeleteOpen(false);
      setUtilisateurToDelete(null);
    }
  };

  // Colonnes du tableau
  const columns = [
    { key: 'first_name', label: 'Prénom' },
    { key: 'last_name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Statut' },
  ];

  // Onglets
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
          onDeleteUser={openDeleteModal}
        />
      ),
    },
    {
      key: 1,
      title: 'Ajouter un utilisateur',
      icon: <UserIcon />,
      content: Object.keys(formData).length > 0 ? (
        <>
          <OngletAjoutUtilisateur
            formData={formData}
            selectOptions={selectOptions}
            selectOpenStates={selectOpenStates}
            existenceMessages={existenceMessages}
            dernierUtilisateur={utilisateur}
            onChange={handleChange}
            onSelectToggle={handleSelectToggle}
            onSubmit={handleSubmit}
          />
          <ModalWithHelp
            title="Ajout d'utilisateur"
            isOpen={confirmModalOpen}
            onClose={closeConfirmModal}
            variant={confirmModalVariant}
            context="ajout"
            data={formData}
            successMessage={confirmModalSuccess}
            errorMessage={confirmModalError}
            size="medium"
            onConfirm={confirmAddUser}
          />
        </>
      ) : (
        <div className="loading-container">
          <p>Chargement du formulaire...</p>
        </div>
      ),
    },
  ];

  return (
    <div className="users-page">
      <PageHeader
        title="Gestion des utilisateurs"
        subtitle="Ajoutez de nouveaux utilisateurs et consultez la liste existante"
        variant="users"
      />
      <PageSection className="users-content">
        <TabContainer
          tabs={tabs}
          activeKey={activeTabKey}
          onTabSelect={setActiveTabKey}
          variant="modern"
        />
      </PageSection>

      {/* Modale de confirmation de suppression */}
      <ModalConfirmation
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDeleteUtilisateur}
        title="Confirmer la suppression"
        message={
          utilisateurToDelete
            ? `Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>${utilisateurToDelete.first_name} ${utilisateurToDelete.last_name}</strong> ?`
            : ''
        }
        confirmText="Supprimer"
        variant="danger"
      />

      {/* Modale de résultat (succès/erreur) */}
      <ModalResultat
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title="Information"
        message={resultModalMessage}
        isLoading={resultModalLoading}
      />
    </div>
  );
};

export default Utilisateur;
