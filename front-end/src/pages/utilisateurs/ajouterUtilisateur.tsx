import React, { useEffect, useState } from 'react';
import {
  Button,
  PageSection,
  Title,
  Modal,
  ModalVariant,
  Tabs,
  Tab,
  TabTitleText,
  Bullseye
} from '@patternfly/react-core';
import type { UserData } from '@clubmanager/types';
import GenericForm from '../../components/genericForm';
import EditableTable from '../../components/table/editableTable';

const Utilisateur = () => {
  const [utilisateur, setUtilisateur] = useState<UserData>();
  const [userSchema, setUserSchema] = useState<UserData>();
  const [formData, setFormData] = useState<any>({});
  const [selectOptions, setSelectOptions] = useState<any>({});
  const [selectOpenStates, setSelectOpenStates] = useState<{ [key: string]: boolean }>({});
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [activeTabKey, setActiveTabKey] = useState<number>(0);
  const [utilisateurs, setUtilisateurs] = useState<UserData[]>([]);
  const [columns, setColumns] = useState<any[]>([]);

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
      const res = await fetch('http://localhost:3000/utilisateurs');
      const data = await res.json();
      setUserSchema(data.data);
      return data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du schéma utilisateur :', error);
      return [];
    }
  };

  const fetchUtilisateurs = async () => {
    try {
      const res = await fetch('http://localhost:3000/utilisateurs');
      const data = await res.json();
      setUtilisateurs(data.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
    }
  };

  const fetchSelectOptions = async (key: string) => {
    const apiName = key.replace('_id', '');
    const pluralApiName = pluralize(apiName);
    try {
      const res = await fetch(`http://localhost:3000/informations/${pluralApiName}`);
      const data = await res.json();
      setSelectOptions((prev: any) => ({ ...prev, [key]: data }));
    } catch (error) {
      setModalMessage(`Erreur lors de la récupération des options pour ${key}`);
      setModalOpen(true);
    }
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

  const handleChange = (value: string, key: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/utilisateurs/ajouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setUtilisateur(data.data);
        setModalMessage("L'utilisateur a bien été ajouté.");
        await fetchUtilisateurs(); // rafraîchit la liste
      } else {
        setModalMessage("Erreur lors de l'ajout.");
      }
    } catch (error) {
      setModalMessage("Erreur lors de l'envoi.");
    }
    setModalOpen(true);
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

  return (
    <PageSection>
      <Title headingLevel="h1">Utilisateurs</Title>
      <Tabs activeKey={activeTabKey} onSelect={(_, key) => setActiveTabKey(Number(key))}>
        <Tab eventKey={0} title={<TabTitleText>Afficher</TabTitleText>}>
          {userSchema ? (
            <EditableTable data={utilisateurs} />
          ) : (
            <Bullseye>Chargement...</Bullseye>
          )}
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Ajouter</TabTitleText>}>
          <GenericForm
            formData={formData}
            setFormData={setFormData}
            selectOptions={selectOptions}
            selectOpenStates={selectOpenStates}
            setSelectOpenStates={setSelectOpenStates}
            onSubmit={handleSubmit}
            onChange={handleChange}
            formatLabel={formatLabel}
          />
        </Tab>
      </Tabs>

      <Modal
        variant={ModalVariant.small}
        title="Notification"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <p>{modalMessage}</p>
      </Modal>
    </PageSection>
  );
};

export default Utilisateur;
