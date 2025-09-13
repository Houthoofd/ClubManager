import React, { useEffect, useState } from 'react';
import {
  PageSection,
  Title,
  Tabs,
  Tab,
  TabTitleText,
} from '@patternfly/react-core';
import type { UserData } from '@clubmanager/types';
import { useUtilisateurs } from '../../hooks/useUtilisateurs';
import { ModalConfirmation, ModalResultat } from '../../components/common/modal/ModalsGestion';
import OngletTableauUtilisateurs from '../../components/utilisateurs/OngletTableauUtilisateurs';
import OngletAjoutUtilisateur from '../../components/utilisateurs/OngletAjoutUtilisateur';
import { UtilisateurService } from '../../services/UtilisateurService';

const Utilisateur = () => {
  const [utilisateur, setUtilisateur] = useState<UserData>();
  const [userSchema, setUserSchema] = useState<UserData>();
  const [formData, setFormData] = useState<any>({});
  const [selectOptions, setSelectOptions] = useState<any>({});
  const [selectOpenStates, setSelectOpenStates] = useState<{ [key: string]: boolean }>({});
  const [activeTabKey, setActiveTabKey] = useState<number>(0);
  const [utilisateurs, setUtilisateurs] = useState<UserData[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [existenceMessages, setExistenceMessages] = useState<{ [key: string]: string }>({});

  // États des modals
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [utilisateurToDelete, setUtilisateurToDelete] = useState<UserData | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState<string>('');
  const [resultModalLoading, setResultModalLoading] = useState(false);

  // Hooks React Query
  const { data: utilisateursData = [], isLoading, error } = useUtilisateurs();

  useEffect(() => {
    const initialiser = async () => {
      setResultModalLoading(true);
      setResultModalMessage('Initialisation...');
      setResultModalOpen(true);

      try {
        const schema = await UtilisateurService.fetchUserSchema();
        if (schema.length > 0) {
          const keys = Object.keys(schema[0]);
          setFormData(UtilisateurService.initaliserFormData(keys));
          setColumns(UtilisateurService.genererColonnes(keys));
          setUserSchema(schema);

          // Charger les options pour les champs select
          for (const key of keys) {
            if (key.endsWith('_id')) {
              try {
                const options = await UtilisateurService.fetchSelectOptions(key);
                setSelectOptions(prev => ({ ...prev, [key]: options }));
              } catch (error) {
                console.error(`Erreur pour ${key}:`, error);
              }
            }
          }
        }
        setResultModalOpen(false);
      } catch (error) {
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

  const handleSelectToggle = (key: string, isOpen: boolean) => {
    setSelectOpenStates(prev => ({
      ...prev,
      [key]: isOpen
    }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setResultModalLoading(true);
    setResultModalMessage('Ajout en cours...');
    setResultModalOpen(false);

    // Vérifier l'unicité de l'email
    const isEmailUnique = await UtilisateurService.checkEmailUniqueness(formData.email);
    if (!isEmailUnique) {
      setResultModalLoading(false);
      return 'Cet email est déjà utilisé.';
    }

    try {
      const result = await UtilisateurService.ajouterUtilisateur(formData);
      
      if (result.success) {
        setUtilisateur(result.data.data);
        setResultModalLoading(false);
        // Réinitialiser le formulaire
        const keys = Object.keys(formData);
        setFormData(UtilisateurService.initaliserFormData(keys));
        setExistenceMessages({});
        return true;
      } else {
        setResultModalMessage("Erreur lors de l'ajout.");
        setResultModalOpen(true);
        setResultModalLoading(false);
        return false;
      }
    } catch (error) {
      setResultModalMessage("Erreur lors de l'envoi.");
      setResultModalOpen(true);
      setResultModalLoading(false);
      return false;
    }
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

  return (
    <PageSection>
      <Title headingLevel="h1" size="2xl" style={{ marginBottom: '0.5rem' }}>
        Gestion des utilisateurs
      </Title>
      <p style={{ color: '#6c757d', fontSize: '1.1rem', marginBottom: '2rem' }}>
        Ajoutez de nouveaux utilisateurs et consultez la liste existante
      </p>
      
      <Tabs 
        activeKey={activeTabKey} 
        onSelect={(_, key) => setActiveTabKey(Number(key))}
        style={{ marginTop: '1rem' }}
      >
        <Tab 
          eventKey={0} 
          title={
            <TabTitleText>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📋 Consulter les utilisateurs
              </span>
            </TabTitleText>
          }
        >
          <div style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginTop: '1rem'
          }}>
            <OngletTableauUtilisateurs
              utilisateurs={utilisateurs}
              columns={columns}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              userSchema={userSchema}
              isLoading={isLoading}
            />
          </div>
        </Tab>
        
        <Tab 
          eventKey={1} 
          title={
            <TabTitleText>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ➕ Ajouter un utilisateur
              </span>
            </TabTitleText>
          }
        >
          <div style={{ 
            background: '#fff', 
            padding: '1.5rem', 
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginTop: '1rem'
          }}>
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
          </div>
        </Tab>
      </Tabs>

      {/* Modal de confirmation de suppression */}
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

      {/* Modal de résultat */}
      <ModalResultat
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title="Information"
        message={resultModalMessage}
        isLoading={resultModalLoading}
      />
    </PageSection>
  );
};

export default Utilisateur;
