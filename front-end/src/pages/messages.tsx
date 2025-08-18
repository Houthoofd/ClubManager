import React, { useEffect, useState } from 'react';
import {
  PageSection,
  Title,
  Tabs,
  Tab,
  TabTitleText,
  Button,
  Alert,
  Modal,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Spinner,
  Bullseye,
  Badge,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import GenericForm from '../components/genericForm';
import { apiUrl } from './apiUrl';

// Interfaces pour les types de données
interface User {
  id: number;
  first_name: string;
  last_name: string;
}

interface MessageType {
  id: number;
  title: string;
  content: string;
}

interface FormData {
  title: string;
  content: string;
}

interface EditFormData {
  title: string;
  content: string;
}

const Messages: React.FC = () => {
  // États
  const [activeTab, setActiveTab] = useState<number>(0);
  const [utilisateurs, setUtilisateurs] = useState<User[]>([]);
  const [typesMessages, setTypesMessages] = useState<MessageType[]>([]);
  const [receivedMessages] = useState<{ type_title: string; sender_name: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({ title: '', content: '' });
  const [selectOptions] = useState<Record<string, unknown>>({});
  const [selectOpenStates, setSelectOpenStates] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({ title: '', content: '' });

  // Récupération des données au montage
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, typesRes] = await Promise.all([
          fetch(apiUrl('utilisateurs')),
          fetch(apiUrl('messages')),
        ]);
        if (!usersRes.ok || !typesRes.ok) throw new Error('Erreur réseau');
        const users = await usersRes.json();
        const types = await typesRes.json();
        setUtilisateurs(users.data);
        setTypesMessages(types.data);
      } catch (err) {
        setError('Erreur lors de la récupération des données');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Suppression d'un type de message
  const handleDeleteType = async (id: number) => {
    try {
      const response = await fetch(apiUrl(`messages/types/${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      setTypesMessages(typesMessages.filter((t) => t.id !== id));
      setModalMessage('Type de message supprimé.');
      setShowModal(true);
    } catch (err) {
      console.error(err);
      setModalMessage('Erreur lors de la suppression du type.');
      setShowModal(true);
    }
  };

  // Sauvegarde des modifications d'un type de message
  const handleSaveEdit = async (id: number) => {
    try {
      const response = await fetch(apiUrl(`messages/types/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      const updatedType = await response.json();
      setTypesMessages(typesMessages.map((t) => (t.id === id ? updatedType.data : t)));
      setEditingId(null);
      setEditFormData({ title: '', content: '' });
      setModalMessage('Type de message mis à jour avec succès.');
      setShowModal(true);
    } catch (err) {
      console.error(err);
      setModalMessage('Erreur lors de la mise à jour du type.');
      setShowModal(true);
    }
  };

  // Envoi d'un message
  const handleSendMessage = async () => {
    if (selectedUsers.length === 0 || selectedType === '') {
      setModalMessage('Veuillez sélectionner au moins un utilisateur et un type de message.');
      setShowModal(true);
      return;
    }
    try {
      const response = await fetch(apiUrl('messages/envoie'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinataires: selectedUsers.map((u) => u.id),
          type_message_id: selectedType,
        }),
      });
      if (!response.ok) throw new Error('Erreur lors de l’envoi du message');
      const selectedNames = selectedUsers.map((u) => `${u.first_name} ${u.last_name}`).join(', ');
      setModalMessage(`Message "${getTypeTitle(selectedType)}" envoyé à : ${selectedNames}`);
      setShowModal(true);
      setSelectedType('');
      setSelectedUsers([]);
    } catch (error) {
      console.error(error);
      setModalMessage('Erreur lors de l\'envoi du message.');
      setShowModal(true);
    }
  };

  // Récupération du titre d'un type de message
  const getTypeTitle = (id: string): string => {
    const found = typesMessages.find((t) => t.id.toString() === id);
    return found ? found.title : '';
  };

  // Gestion des changements de formulaire
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Soumission du formulaire de création de type de message
  const handleSubmit = async () => {
    try {
      const response = await fetch(apiUrl('messages/types'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Erreur lors de la création du type');
      const newType = await response.json();
      setTypesMessages([...typesMessages, newType.data]);
      setFormData({ title: '', content: '' });
      setModalMessage(`Type de message "${newType.data.title}" créé avec succès.`);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      setModalMessage('Erreur lors de la création du type de message.');
      setShowModal(true);
    }
  };

  // Formatage des labels
  const formatLabel = (label: string): string =>
    label.charAt(0).toUpperCase() + label.slice(1).replace(/_/g, ' ');

  // Rendu
  return (
    <PageSection>
      <Title headingLevel="h1">📨 Messagerie</Title>
      {error && <Alert variant="danger" title={error} isInline />}
      <Tabs activeKey={activeTab} onSelect={(_, tabIndex) => setActiveTab(Number(tabIndex))}>
        {/* Onglet "Envoyer" */}
        <Tab eventKey={0} title={<TabTitleText>Envoyer</TabTitleText>}>
          <Form isHorizontal style={{ maxWidth: '600px', marginTop: '1rem' }}>
            <FormGroup label="Utilisateurs" fieldId="user-select">
              <FormSelect
                value={selectedUsers.map((u) => u.id.toString())}
                onChange={(e) => {
                  const selected = Array.from(e.currentTarget.selectedOptions).map((opt) => opt.value);
                  const selectedObjs = utilisateurs.filter((u) => selected.includes(u.id.toString()));
                  setSelectedUsers(selectedObjs);
                }}
                multiple
                aria-label="Sélection multiple"
              >
                {utilisateurs.map((user) => (
                  <FormSelectOption
                    key={user.id}
                    value={user.id.toString()}
                    label={`${user.first_name} ${user.last_name}`}
                  />
                ))}
              </FormSelect>
            </FormGroup>
            {selectedUsers.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Utilisateurs sélectionnés :</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {selectedUsers.map((user) => (
                    <Badge key={user.id} isRead>
                      {user.first_name} {user.last_name}
                      <Button
                        variant="plain"
                        aria-label="Retirer utilisateur"
                        onClick={() => setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id))}
                        style={{ paddingLeft: 4 }}
                      >
                        <TimesIcon />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <FormGroup label="Type de message" fieldId="type-select">
              <FormSelect value={selectedType} onChange={(e) => setSelectedType(e.currentTarget.value)}>
                <FormSelectOption value="" label="-- Choisissez un type --" />
                {typesMessages.map((type) => (
                  <FormSelectOption key={type.id} value={type.id} label={type.title} />
                ))}
              </FormSelect>
            </FormGroup>
            <Button variant="primary" onClick={handleSendMessage}>
              Envoyer le message
            </Button>
          </Form>
        </Tab>

        {/* Onglet "Messages reçus" */}
        <Tab eventKey={1} title={<TabTitleText>Messages reçus</TabTitleText>}>
          {isLoading ? (
            <Bullseye><Spinner /></Bullseye>
          ) : (
            <ul style={{ marginTop: '1rem' }}>
              {receivedMessages.length === 0 ? (
                <li>Aucun message reçu.</li>
              ) : (
                receivedMessages.map((msg, i) => (
                  <li key={i}>
                    <strong>{msg.type_title}</strong> de {msg.sender_name} — {msg.content}
                  </li>
                ))
              )}
            </ul>
          )}
        </Tab>

        {/* Onglet "Créer un type de message" */}
        <Tab eventKey={2} title={<TabTitleText>Créer un type de message</TabTitleText>}>
          <GenericForm
            formData={formData}
            setFormData={setFormData}
            selectOptions={selectOptions}
            selectOpenStates={selectOpenStates}
            setSelectOpenStates={setSelectOpenStates}
            onSubmit={handleSubmit}
            onChange={handleChange}
            formatLabel={formatLabel}
            onSelectToggle={(fieldName: string, isOpen: boolean) => {
              setSelectOpenStates((prev) => ({ ...prev, [fieldName]: isOpen }));
            }}
          />
        </Tab>

        {/* Onglet "Messages existants" */}
        <Tab eventKey={3} title={<TabTitleText>Messages existants</TabTitleText>}>
          <div style={{ marginTop: '1rem' }}>
            {typesMessages.length === 0 ? (
              <p>Aucun type de message existant.</p>
            ) : (
              typesMessages.map((type) => (
                <div
                  key={type.id}
                  style={{
                    border: '1px solid #ccc',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                  }}
                >
                  {editingId === type.id ? (
                    <>
                      <Form>
                        <FormGroup label="Titre" fieldId={`edit-title-${type.id}`}>
                          <input
                            className="pf-v5-c-form-control"
                            type="text"
                            value={editFormData.title}
                            onChange={(e) => setEditFormData((prev) => ({ ...prev, title: e.target.value }))}
                          />
                        </FormGroup>
                        <FormGroup label="Contenu" fieldId={`edit-content-${type.id}`}>
                          <textarea
                            className="pf-v5-c-form-control"
                            value={editFormData.content}
                            onChange={(e) => setEditFormData((prev) => ({ ...prev, content: e.target.value }))}
                          />
                        </FormGroup>
                      </Form>
                      <Button
                        variant="primary"
                        onClick={() => handleSaveEdit(type.id)}
                        style={{ marginRight: '0.5rem' }}
                      >
                        Sauvegarder
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingId(null);
                          setEditFormData({ title: '', content: '' });
                        }}
                      >
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <>
                      <strong>{type.title}</strong>
                      <p>{type.content}</p>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingId(type.id);
                          setEditFormData({ title: type.title, content: type.content });
                        }}
                        style={{ marginRight: '0.5rem' }}
                      >
                        Modifier
                      </Button>
                      <Button variant="danger" onClick={() => handleDeleteType(type.id)}>
                        Supprimer
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </Tab>
      </Tabs>

      {/* Modal de notification */}
      <Modal
        title="Notification"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        variant="default"
      >
        <p>{modalMessage}</p>
        <Button variant="primary" onClick={() => setShowModal(false)}>
          Fermer
        </Button>
      </Modal>
    </PageSection>
  );
};

export default Messages;
