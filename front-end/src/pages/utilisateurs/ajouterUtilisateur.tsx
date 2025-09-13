import React, { useEffect, useState } from 'react';
import {
  PageSection,
} from '@patternfly/react-core';
import { UserIcon, TableIcon } from '@patternfly/react-icons';
import type { UserData } from '@clubmanager/types';
import { useUtilisateurs } from '../../hooks/useUtilisateurs';
import { ModalConfirmation, ModalResultat } from '../../components/common/modal/ModalsGestion';
import { ModalWithHelp } from '../../components/common/modal/ModalWithHelp'; // Import correct avec destructuring
import OngletTableauUtilisateurs from '../../components/utilisateurs/OngletTableauUtilisateurs';
import OngletAjoutUtilisateur from '../../components/utilisateurs/OngletAjoutUtilisateur';
import { UtilisateurService } from '../../services/UtilisateurService';
import { PageHeader } from '../../components/common/PageHeader';
import { TabContainer } from '../../components/common/TabContainer';

const Utilisateur = () => {
  const [activeTabKey, setActiveTabKey] = useState<number>(0);
  const [utilisateur, setUtilisateur] = useState<UserData>();
  const [userSchema, setUserSchema] = useState<UserData>();
  const [utilisateurs, setUtilisateurs] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [existenceMessages, setExistenceMessages] = useState<any>({});
  const [selectOptions, setSelectOptions] = useState<any>({});
  const [selectOpenStates, setSelectOpenStates] = useState<{ [key: string]: boolean }>({});

  // Modals
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [utilisateurToDelete, setUtilisateurToDelete] = useState<UserData | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState('');
  const [resultModalLoading, setResultModalLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalVariant, setConfirmModalVariant] = useState<'confirmation' | 'success' | 'error' | 'loading'>('confirmation');
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalError, setConfirmModalError] = useState<string | null>(null);
  const [confirmModalSuccess, setConfirmModalSuccess] = useState('');

  // Hooks React Query
  const { data: utilisateursData = [], isLoading: isLoadingUtilisateurs, error } = useUtilisateurs();

  useEffect(() => {
    const initialiser = async () => {
      setResultModalLoading(true);
      setResultModalMessage('Initialisation...');
      setResultModalOpen(true);

      try {
        const schema = await UtilisateurService.fetchUserSchema();
        
        // Vérification plus robuste du schéma
        if (schema && Array.isArray(schema) && schema.length > 0) {
          const firstItem = schema[0];
          if (firstItem && typeof firstItem === 'object') {
            const keys = Object.keys(firstItem);
            const initialFormData = UtilisateurService.initaliserFormData(keys);
            
            // S'assurer que formData n'est pas vide
            if (initialFormData && Object.keys(initialFormData).length > 0) {
              setFormData(initialFormData);
              setUserSchema(schema);

              // Charger les options pour les champs select
              const options: any = {};
              for (const key of keys) {
                if (key.endsWith('_id')) {
                  try {
                    const selectOptionsData = await UtilisateurService.fetchSelectOptions(key);
                    options[key] = selectOptionsData;
                  } catch (error) {
                    console.error(`Erreur pour ${key}:`, error);
                    options[key] = [];
                  }
                }
              }
              setSelectOptions(options);
            } else {
              throw new Error('Impossible d\'initialiser les données du formulaire');
            }
          } else {
            throw new Error('Structure de schéma invalide');
          }
        } else {
          throw new Error('Schéma utilisateur vide ou invalide');
        }
        
        setResultModalOpen(false);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setResultModalMessage('Erreur lors de l\'initialisation');
        setResultModalLoading(false);
      }
    };

    initialiser();
  }, []);

  useEffect(() => {
    if (utilisateursData.length > 0) {
      setUtilisateurs(utilisateursData);
    }
  }, [utilisateursData]);

  const handleChange = async (value: string, key: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    
    // Vérifier existence pour les champs critiques
    if (['first_name', 'last_name', 'email', 'nom_utilisateur'].includes(key)) {
      try {
        const result = await UtilisateurService.checkFieldExistence(key, value);
        setExistenceMessages(prev => ({
          ...prev,
          [key]: result.message || (result.exists ? `Ce champ existe déjà : ${value}` : ''),
        }));
      } catch (error) {
        setExistenceMessages(prev => ({
          ...prev,
          [key]: 'Erreur de vérification.',
        }));
      }
    }
  };

  const handleSelectToggle = (key: string, isOpen: boolean) => {
    setSelectOpenStates(prev => ({ ...prev, [key]: isOpen }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ouvrir la modal de confirmation
    setConfirmModalVariant('confirmation');
    setConfirmModalTitle('Confirmer la création de l\'utilisateur');
    setConfirmModalError(null);
    setConfirmModalSuccess('');
    setConfirmModalOpen(true);
  };

  const confirmAddUser = async () => {
    // Changer la modal en mode loading
    setConfirmModalVariant('loading');
    setConfirmModalTitle('Création en cours...');

    try {
      // Vérifier l'email
      const isEmailUnique = await UtilisateurService.checkEmailUniqueness(formData.email);
      if (!isEmailUnique) {
        setConfirmModalVariant('error');
        setConfirmModalTitle('Erreur de validation');
        setConfirmModalError('Cet email est déjà utilisé par un autre utilisateur.');
        return;
      }

      // Créer l'utilisateur
      const result = await UtilisateurService.ajouterUtilisateur(formData);
      
      if (result.success) {
        setUtilisateur(result.data.data);
        setConfirmModalVariant('success');
        setConfirmModalTitle('Utilisateur créé avec succès !');
        setConfirmModalSuccess('L\'utilisateur a été ajouté au système et peut maintenant se connecter.');
        
        // Réinitialiser le formulaire
        const keys = Object.keys(formData);
        setFormData(UtilisateurService.initaliserFormData(keys));
        setExistenceMessages({});
      } else {
        setConfirmModalVariant('error');
        setConfirmModalTitle('Erreur lors de la création');
        setConfirmModalError(result.message || 'Une erreur est survenue lors de la création de l\'utilisateur.');
      }
    } catch (error) {
      setConfirmModalVariant('error');
      setConfirmModalTitle('Erreur système');
      setConfirmModalError('Une erreur technique est survenue. Veuillez réessayer.');
      console.error('Erreur lors de l\'ajout:', error);
    }
  };

  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setConfirmModalVariant('confirmation');
    setConfirmModalTitle('');
    setConfirmModalError(null);
    setConfirmModalSuccess('');
  };

  const confirmDeleteUtilisateur = async () => {
    if (!utilisateurToDelete) return;
    
    setResultModalLoading(true);
    setResultModalMessage('Suppression en cours...');
    setResultModalOpen(true);
    
    // Logique de suppression ici...
    
    setConfirmDeleteOpen(false);
    setUtilisateurToDelete(null);
  };

  const columns = [
    { key: 'first_name', label: 'Prénom' },
    { key: 'last_name', label: 'Nom' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Statut' },
  ];

  const tabs = [
    {
      key: 0,
      title: 'Consulter les utilisateurs',
      icon: <TableIcon />,
      content: (
        <OngletTableauUtilisateurs
          utilisateurs={utilisateurs}
          columns={columns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          userSchema={userSchema}
          isLoading={isLoading}
        />
      )
    },
    {
      key: 1,
      title: 'Ajouter un utilisateur',
      icon: <UserIcon />,
      content: formData && Object.keys(formData).length > 0 ? (
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
            isOpen={confirmModalOpen}
            onClose={closeConfirmModal}
            onConfirm={confirmAddUser}
            title={confirmModalTitle}
            variant={confirmModalVariant}
            data={formData}
            selectOptions={selectOptions}
            isLoading={confirmModalVariant === 'loading'}
            error={confirmModalError}
            successMessage={confirmModalSuccess}
          />
        </>
      ) : (
        <div className="loading-container">
          <p>Chargement du formulaire...</p>
        </div>
      )
    }
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

      <ModalConfirmation
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDeleteUtilisateur}
        title="Confirmer la suppression"
        message={
          utilisateurToDelete
            ? `Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>${String((utilisateurToDelete as any).first_name)} ${String((utilisateurToDelete as any).last_name)}</strong> ?`
            : ''
        }
        confirmText="Supprimer"
        variant="danger"
      />

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
