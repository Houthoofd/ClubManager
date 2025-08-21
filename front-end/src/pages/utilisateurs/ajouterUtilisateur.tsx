import React, { useEffect, useState } from 'react';
import {
  PageSection,
  Title,
  Tabs,
  Tab,
  TabTitleText,
  Bullseye,
  Button
} from '@patternfly/react-core';
import type { UserData } from '@clubmanager/types';
import GenericForm from '../../components/genericForm';
import EditableTable from '../../components/table/editableTable';

import { apiUrl } from '../apiUrl';
import { Modal as PfModal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';
import { TextInput } from '@patternfly/react-core';

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

  // Ajoute un état pour les messages d'existence par champ
  const [existenceMessages, setExistenceMessages] = useState<{ [key: string]: string }>({});

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [utilisateurToDelete, setUtilisateurToDelete] = useState<UserData | null>(null);

  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState<string>('');
  const [resultModalLoading, setResultModalLoading] = useState(false);

  useEffect(() => {
    const initialiser = async () => {
      const schema = await fetchUserSchema();
      if (schema.length > 0) {
        const keys = Object.keys(schema[0]);
        setFormData(initaliserFormData(keys));
        setColumns(genererColonnes(keys));

        await fetchUtilisateurs();
        keys.forEach((key) => {
          if (key.endsWith('_id')) fetchSelectOptions(key);
        });
      }
    };

    initialiser();
  }, []);

  const fetchUserSchema = async () => {
    try {
      const res = await fetch(apiUrl('utilisateurs'));
      const data = await res.json();
      setUserSchema(data.data);
      return data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du schéma utilisateur :', error);
      return [];
    }
  };

  const handleSelectToggle = (key: string, isOpen: boolean) => {
    setSelectOpenStates(prev => ({
      ...prev,
      [key]: isOpen
    }));
  };

  const fetchUtilisateurs = async () => {
    setResultModalLoading(true);
    setResultModalMessage('Chargement des utilisateurs...');
    setResultModalOpen(true);
    try {
      const res = await fetch(apiUrl('utilisateurs'));
      const data = await res.json();
      setUtilisateurs(data.data);
      setResultModalMessage('Utilisateurs chargés.');
    } catch (error) {
      setResultModalMessage("Erreur lors de la récupération des utilisateurs.");
    }
    setResultModalLoading(false);
  };

  const fetchSelectOptions = async (key: string) => {
    setResultModalLoading(true);
    setResultModalMessage(`Chargement des options pour ${key}...`);
    setResultModalOpen(true);
    const apiName = key.replace('_id', '');
    const pluralApiName = pluralize(apiName);
    try {
      const res = await fetch(apiUrl(`informations/${pluralApiName}`));
      const data = await res.json();
      setSelectOptions((prev: any) => ({ ...prev, [key]: data }));
      setResultModalMessage(`Options pour ${key} chargées.`);
    } catch (error) {
      setResultModalMessage(`Erreur lors de la récupération des options pour ${key}`);
    }
    setResultModalLoading(false);
  };

  const initaliserFormData = (keys: string[]) => {
    const form: any = {};
    keys.forEach((key) => {
      if (key !== 'id') form[key] = '';
    });
    return form;
  };

  const genererColonnes = (keys: string[]) => {
    return keys.map((key) => ({
      title: formatLabel(key),
      dataKey: key,
    }));
  };

  const pluralize = (word: string) => {
    const exceptions = ['status'];
    return exceptions.includes(word) ? word : word + 's';
  };

  // Vérifie l'existence pour un champ donné via les nouveaux endpoints et affiche le message du backend
  const checkFieldExistence = async (key: string, value: string) => {
    if (!value) {
      setExistenceMessages(prev => ({ ...prev, [key]: '' }));
      return;
    }
    let endpoint = '';
    let body: any = {};
    switch (key) {
      case 'email':
        endpoint = 'verification/verifier-email';
        body = { email: value };
        break;
      case 'nom_utilisateur':
        endpoint = 'verification/verifier-nom-utilisateur';
        body = { nom_utilisateur: value };
        break;
      case 'first_name':
        endpoint = 'verification/verifier-prenom';
        body = { prenom: value };
        break;
      case 'last_name':
        endpoint = 'verification/verifier-nom';
        body = { nom: value };
        break;
      default:
        return;
    }
    try {
      const response = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      // Affiche le message dans la console
      console.log(`[${endpoint}]`, result);
      // Affiche le message dans l'UI
      setExistenceMessages(prev => ({
        ...prev,
        [key]: result.message || (result.exists ? `Ce champ existe déjà : ${value}` : ''),
      }));
    } catch {
      setExistenceMessages(prev => ({
        ...prev,
        [key]: 'Erreur de vérification.',
      }));
    }
  };

  // Modifie handleChange pour vérifier à chaque saisie
  const handleChange = (value: string, key: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    // Vérifie existence pour les champs critiques
    if (
      key === 'first_name' ||
      key === 'last_name' ||
      key === 'email' ||
      key === 'nom_utilisateur'
    ) {
      checkFieldExistence(key, value);
    }
  };

  // Ajoute une fonction pour vérifier tous les champs critiques avant soumission
  const checkAllFieldsExistence = async () => {
    const checks = [
      { key: 'email', endpoint: 'verification/verifier-email', body: { email: formData.email } },
      { key: 'nom_utilisateur', endpoint: 'verification/verifier-nom-utilisateur', body: { nom_utilisateur: formData.nom_utilisateur } },
      { key: 'first_name', endpoint: 'verification/verifier-prenom', body: { prenom: formData.first_name } },
      { key: 'last_name', endpoint: 'verification/verifier-nom', body: { nom: formData.last_name } }
    ];
    for (const check of checks) {
      if (formData[check.key]) {
        const response = await fetch(apiUrl(check.endpoint), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(check.body),
        });
        const result = await response.json();
        console.log(`[${check.endpoint}]`, result);
        if (result.exists === true) {
          setResultModalMessage(result.message || `Ce champ existe déjà : ${formData[check.key]}`);
          setResultModalOpen(true);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setResultModalLoading(true);
    setResultModalMessage('Ajout en cours...');
    setResultModalOpen(true);

    const canProceed = await checkAllFieldsExistence();
    if (!canProceed) {
      setResultModalLoading(false);
      setResultModalMessage('Certains champs existent déjà.');
      return;
    }
    try {
      const response = await fetch(apiUrl('utilisateurs/ajouter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        setUtilisateur(data.data);
        setResultModalMessage("L'utilisateur a bien été ajouté.");
        await fetchUtilisateurs();
      } else {
        setResultModalMessage("Erreur lors de l'ajout.");
      }
    } catch (error) {
      setResultModalMessage("Erreur lors de l'envoi.");
    }
    setResultModalLoading(false);
  };

  const formatLabel = (label: string) => {
    let formatted = label.replace(/_/g, ' ');
    if (formatted.endsWith(' id')) formatted = formatted.slice(0, -3);
    const map: Record<string, string> = {
      'first name': 'Nom',
      'last name': 'Prénom',
      'date of birth': 'Date de naissance',
    };
    return map[formatted.toLowerCase()] || formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Filtre les utilisateurs selon le terme de recherche
  const filteredUtilisateurs = utilisateurs.filter(u =>
    (u.nom_utilisateur && u.nom_utilisateur.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ((u as any).first_name && String((u as any).first_name).toLowerCase().includes(searchTerm.toLowerCase())) ||
    ((u as any).last_name && String((u as any).last_name).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Ouvre la modal de confirmation avant suppression
  const handleRequestDeleteUtilisateur = (utilisateur: UserData) => {
    setUtilisateurToDelete(utilisateur);
    setConfirmDeleteOpen(true);
  };

  // Supprime l'utilisateur après confirmation
  const confirmDeleteUtilisateur = async () => {
    setResultModalLoading(true);
    setResultModalMessage('Suppression en cours...');
    setResultModalOpen(true);
    if (!utilisateurToDelete) return;
    try {
      const response = await fetch(apiUrl('utilisateurs/supprimer'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utilisateurId: (utilisateurToDelete as any).id }),
      });
      const data = await response.json();
      if (response.ok && data.isConfirm) {
        setResultModalMessage(`L'utilisateur ${String((utilisateurToDelete as any).first_name)} ${String((utilisateurToDelete as any).last_name)} a bien été supprimé.`);
        await fetchUtilisateurs();
      } else {
        setResultModalMessage(data.message || "Erreur lors de la suppression de l'utilisateur.");
      }
    } catch (error) {
      setResultModalMessage("Erreur lors de la suppression.");
    }
    setResultModalLoading(false);
    setConfirmDeleteOpen(false);
    setUtilisateurToDelete(null);
  };

  return (
    <PageSection>
      <Title headingLevel="h1">Utilisateurs</Title>
      <Tabs activeKey={activeTabKey} onSelect={(_, key) => setActiveTabKey(Number(key))}>
        <Tab eventKey={0} title={<TabTitleText>Afficher</TabTitleText>}>
          <div style={{ marginBottom: 16 }}>
            <TextInput
              type="search"
              value={searchTerm}
              onChange={(_e, value) => setSearchTerm(value)}
              placeholder="Rechercher un utilisateur par nom, prénom, email ou nom d'utilisateur"
            />
          </div>
          {userSchema ? (
            <EditableTable
              data={filteredUtilisateurs}
              columns={columns}
              // Passe la fonction de demande de suppression à la table
              onDeleteRequest={handleRequestDeleteUtilisateur}
            />
          ) : (
            <Bullseye>Chargement...</Bullseye>
          )}
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Ajouter</TabTitleText>}>
          <GenericForm
            formData={formData}
            selectOptions={selectOptions}
            selectOpenStates={selectOpenStates}
            onChange={handleChange}
            onSelectToggle={handleSelectToggle}
            onSubmit={handleSubmit}
            existenceMessages={existenceMessages}
          />

          {utilisateur && (
            <PageSection variant="default">
              <Title headingLevel="h2" size="lg">Dernier utilisateur ajouté :</Title>
              <pre>{JSON.stringify(utilisateur, null, 2)}</pre>
            </PageSection>
          )}
        </Tab>
      </Tabs>
      {/* Modal de confirmation de suppression */}
      <PfModal
        variant="small"
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        aria-labelledby="confirm-delete-modal-title"
        aria-describedby="confirm-delete-modal-body"
      >
        <ModalHeader title="Confirmer la suppression" labelId="confirm-delete-modal-title" />
        <ModalBody id="confirm-delete-modal-body">
          {utilisateurToDelete
            ? (
              <span>
                Êtes-vous sûr de vouloir supprimer l'utilisateur&nbsp;
                <strong>
                  {String((utilisateurToDelete as any).first_name)} {String((utilisateurToDelete as any).last_name)}
                </strong> ?
              </span>
            )
            : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="danger" onClick={confirmDeleteUtilisateur}>
            Supprimer
          </Button>
          <Button variant="link" onClick={() => setConfirmDeleteOpen(false)}>
            Annuler
          </Button>
        </ModalFooter>
      </PfModal>
      {/* Modal pour chargement et résultat */}
      <PfModal
        variant="small"
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        aria-labelledby="result-modal-title"
        aria-describedby="result-modal-body"
      >
        <ModalHeader title="Information" labelId="result-modal-title" />
        <ModalBody id="result-modal-body">
          {resultModalLoading ? (
            <span>Chargement...</span>
          ) : (
            <span>{resultModalMessage}</span>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={() => setResultModalOpen(false)}>
            OK
          </Button>
        </ModalFooter>
      </PfModal>
    </PageSection>
  );
};


export default Utilisateur;
