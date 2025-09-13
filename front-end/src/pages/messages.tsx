import React, { useState } from 'react';
import {
  PageSection,
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
import { TimesIcon, PaperPlaneIcon, EditIcon, ListIcon } from '@patternfly/react-icons';
import { PageHeader } from '../components/common/PageHeader';
import { TabContainer } from '../components/common/TabContainer';
import GenericForm from '../components/genericForm';
import {
  useUtilisateurs,
  useTypesMessages,
  useCreerTypeMessage,
  useModifierTypeMessage,
  useSupprimerTypeMessage,
  useEnvoyerMessage,
} from '../hooks/useMessages';

const Messages: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [editFormData, setEditFormData] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalMessage, setModalMessage] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);

  // Utilisation des hooks React Query
  const { data: utilisateurs = [], isLoading: loadingUsers, error: errorUsers } = useUtilisateurs();
  const { data: typesMessages = [], isLoading: loadingTypes, error: errorTypes } = useTypesMessages();
  const creerTypeMessage = useCreerTypeMessage();
  const modifierTypeMessage = useModifierTypeMessage();
  const supprimerTypeMessage = useSupprimerTypeMessage();
  const envoyerMessage = useEnvoyerMessage();

  const handleSendMessage = async () => {
    if (selectedUsers.length === 0 || selectedType === '') {
      setModalMessage('Veuillez sélectionner au moins un utilisateur et un type de message.');
      setShowModal(true);
      return;
    }
    try {
      await envoyerMessage.mutateAsync({ destinataires: selectedUsers, type_message_id: selectedType });
      setModalMessage('Message envoyé avec succès.');
      setShowModal(true);
      setSelectedUsers([]);
      setSelectedType('');
    } catch (error) {
      setModalMessage('Erreur lors de l’envoi du message.');
      setShowModal(true);
    }
  };

  const handleCreateType = async () => {
    try {
      await creerTypeMessage.mutateAsync(formData);
      setFormData({ title: '', content: '' });
      setModalMessage('Type de message créé avec succès.');
      setShowModal(true);
    } catch (error) {
      setModalMessage('Erreur lors de la création du type de message.');
      setShowModal(true);
    }
  };

  const handleEditType = async (id: number) => {
    try {
      await modifierTypeMessage.mutateAsync({ id, formData: editFormData });
      setEditingId(null);
      setEditFormData({ title: '', content: '' });
      setModalMessage('Type de message mis à jour avec succès.');
      setShowModal(true);
    } catch (error) {
      setModalMessage('Erreur lors de la mise à jour du type de message.');
      setShowModal(true);
    }
  };

  const handleDeleteType = async (id: number) => {
    try {
      await supprimerTypeMessage.mutateAsync(id);
      setModalMessage('Type de message supprimé avec succès.');
      setShowModal(true);
    } catch (error) {
      setModalMessage('Erreur lors de la suppression du type de message.');
      setShowModal(true);
    }
  };

  if (loadingUsers || loadingTypes) {
    return (
      <div className="messages-page">
        <PageHeader
          title="Messagerie"
          subtitle="Communication avec vos membres et votre équipe"
          variant="messages"
        />
        <PageSection className="messages-content">
          <Bullseye>
            <Spinner size="xl" />
          </Bullseye>
        </PageSection>
      </div>
    );
  }

  if (errorUsers || errorTypes) {
    return (
      <div className="messages-page">
        <PageHeader
          title="Messagerie"
          subtitle="Communication avec vos membres et votre équipe"
          variant="messages"
        />
        <PageSection className="messages-content">
          <Alert variant="danger" title="Erreur lors du chargement des données" />
        </PageSection>
      </div>
    );
  }

  const tabs = [
    {
      key: 0,
      title: 'Envoyer un message',
      icon: <PaperPlaneIcon />,
      content: (
        <div className="messages-send-container">
          <Form isHorizontal style={{ maxWidth: '600px', marginTop: '1rem' }}>
            <FormGroup label="Utilisateurs" fieldId="user-select">
              <FormSelect
                value={selectedUsers.map((u) => u.toString())}
                onChange={(e) => {
                  const selected = Array.from(e.currentTarget.selectedOptions).map((opt) => opt.value);
                  setSelectedUsers(selected.map((id) => Number(id)));
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
                  {selectedUsers.map((userId) => {
                    const user = utilisateurs.find((u) => u.id === userId);
                    return (
                      user && (
                        <Badge key={user.id} isRead>
                          {user.first_name} {user.last_name}
                          <Button
                            variant="plain"
                            aria-label="Retirer utilisateur"
                            onClick={() => setSelectedUsers(selectedUsers.filter((id) => id !== user.id))}
                            style={{ paddingLeft: 4 }}
                          >
                            <TimesIcon />
                          </Button>
                        </Badge>
                      )
                    );
                  })}
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
        </div>
      )
    },
    {
      key: 1,
      title: 'Créer un type de message',
      icon: <EditIcon />,
      content: (
        <div className="messages-create-container">
          <GenericForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreateType}
          />
        </div>
      )
    },
    {
      key: 2,
      title: 'Messages existants',
      icon: <ListIcon />,
      content: (
        <div className="messages-list-container">
          {typesMessages.length === 0 ? (
            <div className="messages-empty-state">
              <p>Aucun type de message existant.</p>
            </div>
          ) : (
            <div className="messages-list">
              {typesMessages.map((type) => (
                <div
                  key={type.id}
                  className="message-type-card"
                  style={{
                    border: '1px solid #e5e7eb',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    background: 'white',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
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
                      <div className="message-type-actions">
                        <Button
                          variant="primary"
                          onClick={() => handleEditType(type.id)}
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
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="message-type-content">
                        <strong className="message-type-title">{type.title}</strong>
                        <p className="message-type-text">{type.content}</p>
                      </div>
                      <div className="message-type-actions">
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
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="messages-page">
      <PageHeader
        title="Messagerie"
        subtitle="Communication avec vos membres et votre équipe"
        variant="messages"
      />

      <PageSection className="messages-content">
        <TabContainer
          tabs={tabs}
          activeKey={activeTab}
          onTabSelect={setActiveTab}
          variant="modern"
        />
      </PageSection>

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
    </div>
  );
};

export default Messages;
