import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  PageSection,
  Spinner,
  Bullseye,
  Alert
} from '@patternfly/react-core';
import { 
  PaperPlaneIcon, 
  EditIcon, 
  ListIcon, 
  InboxIcon,
  CheckCircleIcon
} from '@patternfly/react-icons';
import { PageHeader } from '../components/common/PageHeader';
import { TabContainer } from '../components/common/TabContainer';
import { ResultModal } from '../components/common/modal/ResultModal';
import { ResumeConfirmModal } from '../components/common/modal/ResumeConfirmModal';
import MessageDetailModal from '../components/messages/MessageDetailModal';
import DeleteMessageModal from '../components/messages/DeleteMessageModal';
import MessagesReceivedTab from '../components/messages/MessagesReceivedTab';
import MessagesReadTab from '../components/messages/MessagesReadTab';
import SendMessageForm from '../components/messages/SendMessageForm';
import CreateMessageTypeForm from '../components/messages/CreateMessageTypeForm';
import MessageTypesListTab from '../components/messages/MessageTypesListTab';
import {
  useTypesMessages,
  useCreerTypeMessage,
  useModifierTypeMessage,
  useSupprimerTypeMessage,
  useEnvoyerMessage,
  useMessagesRecus,
  useMarquerMessageLu,
  useSupprimerMessageRecu,
} from '../hooks/useMessages';
import {
  useUtilisateurs,
} from '../hooks/useUtilisateurs';
import '../styles/messages.css';

const Messages: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [editFormData, setEditFormData] = useState({ title: '', content: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [resultModalMessage, setResultModalMessage] = useState('');
  const [resultModalSuccess, setResultModalSuccess] = useState(false);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [sendConfirmData, setSendConfirmData] = useState<{
    users: any[];
    messageType: any;
  } | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isMessageDetailOpen, setIsMessageDetailOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<any>(null);

  // CORRIGÉ: Gérer l'onglet actif depuis les paramètres URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    console.log('🔍 [Messages] Paramètre tab depuis URL:', tabFromUrl);
    console.log('🔍 [Messages] ActiveTab actuel:', activeTab);
    
    if (tabFromUrl === 'non-lus') {
      console.log('✅ [Messages] Activation onglet Messages non lus (index 0)');
      setActiveTab(0); // L'onglet "Messages non lus" est l'onglet 0
    } else if (tabFromUrl === 'lus') {
      console.log('✅ [Messages] Activation onglet Messages lus (index 1)');
      setActiveTab(1); // L'onglet "Messages lus" est l'onglet 1
    } else if (!tabFromUrl) {
      // Si pas de paramètre tab, rester sur l'onglet par défaut
      console.log('ℹ️ [Messages] Pas de paramètre tab, onglet par défaut');
    }
    
    // Debug après changement
    setTimeout(() => {
      console.log('🔍 [Messages] ActiveTab après changement:', activeTab);
    }, 100);
  }, [searchParams]);

  // NOUVEAU: Debug de l'activeTab
  useEffect(() => {
    console.log('🎯 [Messages] ActiveTab changé vers:', activeTab);
  }, [activeTab]);

  // Hooks React Query
  const { data: utilisateurs = [], isLoading: loadingUsers, error: errorUsers } = useUtilisateurs();
  const { data: typesMessages = [], isLoading: loadingTypes, error: errorTypes } = useTypesMessages();
  const { data: messagesRecus = [], isLoading: loadingMessages, error: errorMessages } = useMessagesRecus();
  const creerTypeMessage = useCreerTypeMessage();
  const modifierTypeMessage = useModifierTypeMessage();
  const supprimerTypeMessage = useSupprimerTypeMessage();
  const envoyerMessage = useEnvoyerMessage();
  const marquerMessageLu = useMarquerMessageLu();
  const supprimerMessageRecu = useSupprimerMessageRecu();

  // Vérification des permissions
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userRole = userData.status || userData.role || 'utilisateur';
  const isSuperAdmin = userRole === 'super-administrateur' || userData.status_id === 4;
  const canSendMessages = ['super-administrateur', 'administrateur', 'professeur'].includes(userRole);
  const canManageMessageTypes = userRole === 'super-administrateur';

  // Handlers pour les messages reçus
  const handleMessageClick = (message: any) => {
    setSelectedMessage(message);
    setIsMessageDetailOpen(true);
    if (!message.lu) {
      handleMarkAsRead(message.id);
    }
  };

  const handleCloseMessageDetail = () => {
    setIsMessageDetailOpen(false);
    setSelectedMessage(null);
  };

  const handleMarkAsRead = (messageId: number) => {
    marquerMessageLu.mutate(messageId, {
      onSuccess: () => {
        setResultModalMessage('Message marqué comme lu.');
        setResultModalSuccess(true);
        setIsResultModalOpen(true);
      },
      onError: () => {
        setResultModalMessage('Erreur lors de la mise à jour du message.');
        setResultModalSuccess(false);
        setIsResultModalOpen(true);
      }
    });
  };

  const handleDeleteMessage = (messageId: number) => {
    supprimerMessageRecu.mutate(messageId, {
      onSuccess: () => {
        setResultModalMessage('Message supprimé avec succès.');
        setResultModalSuccess(true);
        setIsResultModalOpen(true);
        setIsDeleteModalOpen(false);
        setMessageToDelete(null);
      },
      onError: () => {
        setResultModalMessage('Erreur lors de la suppression du message.');
        setResultModalSuccess(false);
        setIsResultModalOpen(true);
      }
    });
  };

  // NOUVEAU: Handlers pour le modal de suppression
  const handleShowDeleteModal = (message: any) => {
    setMessageToDelete(message);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMessageToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (messageToDelete) {
      handleDeleteMessage(messageToDelete.id);
    }
  };

  // Handlers pour l'envoi de messages
  const handleUserSelect = (userId: number) => {
    setSelectedUsers([...selectedUsers, userId]);
  };

  const handleUserRemove = (userId: number) => {
    setSelectedUsers(selectedUsers.filter(id => id !== userId));
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleSendMessage = async () => {
    if (selectedUsers.length === 0 || selectedType === '') {
      setResultModalMessage('Veuillez sélectionner au moins un utilisateur et un type de message.');
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
      return;
    }

    const selectedUsersList = selectedUsers.map(userId => 
      utilisateurs.find(u => u.id === userId)
    ).filter(Boolean);
    
    const messageType = typesMessages.find(t => t.id.toString() === selectedType);
    
    setSendConfirmData({
      users: selectedUsersList,
      messageType
    });
    setShowSendConfirmModal(true);
  };

  const confirmSendMessage = async () => {
    setShowSendConfirmModal(false);
    
    try {
      const result = await envoyerMessage.mutateAsync({ 
        destinataires: selectedUsers, 
        type_message_id: selectedType,
        envoyerEmail: true // Toujours essayer d'envoyer par email
      });
      
      // Message de succès détaillé
      let successMessage = `Message envoyé avec succès à ${selectedUsers.length} destinataire${selectedUsers.length > 1 ? 's' : ''}.`;
      
      if (result.data?.emailsEnvoyes) {
        const emailsReussis = result.data.emailsEnvoyes.filter((e: any) => e.success).length;
        successMessage += ` Emails envoyés: ${emailsReussis}/${result.data.emailsEnvoyes.length}`;
      }
      
      setResultModalMessage(successMessage);
      setResultModalSuccess(true);
      setIsResultModalOpen(true);
      setSelectedUsers([]);
      setSelectedType('');
      
    } catch (error: any) {
      console.error('Erreur envoi message:', error);
      setResultModalMessage('Erreur lors de l\'envoi du message. Veuillez réessayer.');
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
    }
  };

  const cancelSendMessage = () => {
    setShowSendConfirmModal(false);
    setSendConfirmData(null);
  };

  // Handlers pour la création de types de messages
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateType = async () => {
    try {
      await creerTypeMessage.mutateAsync(formData);
      setFormData({ title: '', content: '' });
      setResultModalMessage('Type de message créé avec succès.');
      setResultModalSuccess(true);
      setIsResultModalOpen(true);
    } catch (error) {
      setResultModalMessage('Erreur lors de la création du type de message.');
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
    }
  };

  // Handlers pour l'édition des types de messages
  const handleEditStart = (id: number, title: string, content: string) => {
    setEditingId(id);
    setEditFormData({ title, content });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({ title: '', content: '' });
  };

  const handleEditSave = async (id: number) => {
    try {
      await modifierTypeMessage.mutateAsync({ id, formData: editFormData });
      setEditingId(null);
      setEditFormData({ title: '', content: '' });
      setResultModalMessage('Type de message mis à jour avec succès.');
      setResultModalSuccess(true);
      setIsResultModalOpen(true);
    } catch (error) {
      setResultModalMessage('Erreur lors de la mise à jour du type de message.');
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
    }
  };

  const handleDeleteType = async (id: number) => {
    try {
      await supprimerTypeMessage.mutateAsync(id);
      setResultModalMessage('Type de message supprimé avec succès.');
      setResultModalSuccess(true);
      setIsResultModalOpen(true);
    } catch (error) {
      setResultModalMessage('Erreur lors de la suppression du type de message.');
      setResultModalSuccess(false);
      setIsResultModalOpen(true);
    }
  };

  const handleEditFormDataChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  // Préparation des modifications pour ResumeConfirmModal
  const getSendMessageModifications = () => {
    if (!sendConfirmData) return [];

    return [
      {
        field: 'Type de message',
        oldValue: 'Aucun',
        newValue: sendConfirmData.messageType?.title || 'Type inconnu'
      },
      {
        field: 'Contenu du message',
        oldValue: '',
        newValue: sendConfirmData.messageType?.content || 'Contenu non disponible'
      },
      {
        field: `Destinataire${sendConfirmData.users.length > 1 ? 's' : ''}`,
        oldValue: 'Aucun',
        newValue: sendConfirmData.users.map(u => `${u.first_name} ${u.last_name}`).join(', ')
      }
    ];
  };

  // États de chargement et d'erreur
  if (loadingUsers || loadingTypes || loadingMessages) {
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

  if (errorUsers || errorTypes || errorMessages) {
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

  // Configuration des onglets selon le rôle
  const messagesRecusTab = {
    key: 0,
    title: 'Messages non lus',
    icon: <InboxIcon />,
    content: (
      <MessagesReceivedTab
        messagesRecus={messagesRecus.filter(message => !message.lu)} // MODIFIÉ: Filtrer seulement les non lus
        onMessageClick={handleMessageClick}
        onMarkAsRead={handleMarkAsRead}
        onDeleteMessage={handleDeleteMessage}
        onShowDeleteModal={handleShowDeleteModal}
      />
    )
  };

  // NOUVEAU: Onglet pour les messages lus
  const messagesLusTab = {
    key: 1,
    title: 'Messages lus',
    icon: <CheckCircleIcon />,
    content: (
      <MessagesReadTab
        messagesLus={messagesRecus.filter(message => message.lu)}
        onMessageClick={handleMessageClick}
        onDeleteMessage={handleDeleteMessage}
        onShowDeleteModal={handleShowDeleteModal}
      />
    )
  };

  // Onglets pour ceux qui peuvent envoyer des messages (admin, professeur, super-admin)
  const sendMessageTabs = canSendMessages ? [
    {
      key: 2,
      title: 'Envoyer un message',
      icon: <PaperPlaneIcon />,
      content: (
        <SendMessageForm
          utilisateurs={utilisateurs}
          typesMessages={typesMessages}
          selectedUsers={selectedUsers}
          selectedType={selectedType}
          isLoading={envoyerMessage.isPending}
          onUserSelect={handleUserSelect}
          onUserRemove={handleUserRemove}
          onTypeSelect={handleTypeSelect}
          onSendMessage={handleSendMessage}
        />
      )
    }
  ] : [];

  // Onglets pour la gestion des types de messages (super-admin uniquement)
  const adminOnlyTabs = canManageMessageTypes ? [
    {
      key: 3,
      title: 'Créer un type de message',
      icon: <EditIcon />,
      content: (
        <CreateMessageTypeForm
          formData={formData}
          isLoading={creerTypeMessage.isPending}
          onFormChange={handleFormChange}
          onCreateType={handleCreateType}
        />
      )
    },
    {
      key: 4,
      title: 'Messages existants',
      icon: <ListIcon />,
      content: (
        <MessageTypesListTab
          typesMessages={typesMessages}
          editingId={editingId}
          editFormData={editFormData}
          onEditStart={handleEditStart}
          onEditCancel={handleEditCancel}
          onEditSave={handleEditSave}
          onDelete={handleDeleteType}
          onFormDataChange={handleEditFormDataChange}
        />
      )
    }
  ] : [];

  const tabs = [messagesRecusTab, messagesLusTab, ...sendMessageTabs, ...adminOnlyTabs];

  // Fonction pour obtenir le message d'information selon le rôle
  const getAccessMessage = () => {
    if (userRole === 'visiteur' || userRole === 'utilisateur') {
      return {
        variant: "info" as const,
        title: "Accès limité",
        message: "Vous avez accès en lecture seule aux messages. Seuls les administrateurs et professeurs peuvent envoyer des messages."
      };
    }
    if (userRole === 'professeur' || userRole === 'administrateur') {
      return {
        variant: "info" as const,
        title: "Permissions d'envoi",
        message: "Vous pouvez consulter et envoyer des messages. La gestion des types de messages est réservée aux super-administrateurs."
      };
    }
    return null;
  };

  const accessMessage = getAccessMessage();

  return (
    <div className="messages-page">
      <PageHeader
        title="Messagerie"
        subtitle="Communication avec vos membres et votre équipe"
        variant="messages"
      />

      <PageSection className="messages-content">
        {accessMessage && (
          <Alert
            variant={accessMessage.variant}
            title={accessMessage.title}
            isInline
            style={{ marginBottom: '2rem' }}
          >
            {accessMessage.message}
          </Alert>
        )}

        {/* DEBUG: Afficher l'onglet actif */}
        <div style={{ marginBottom: '1rem', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <strong>Debug:</strong> Onglet actif = {activeTab} | URL tab = {searchParams.get('tab')}
        </div>

        <TabContainer
          tabs={tabs}
          activeKey={activeTab}
          onTabSelect={setActiveTab}
          variant="modern"
        />
      </PageSection>

      {/* Modals */}
      <MessageDetailModal
        isOpen={isMessageDetailOpen}
        onClose={handleCloseMessageDetail}
        message={selectedMessage}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDeleteMessage}
      />

      {/* NOUVEAU: Modal de suppression */}
      <DeleteMessageModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        message={messageToDelete}
        isLoading={supprimerMessageRecu.isPending}
      />

      <ResumeConfirmModal
        isOpen={showSendConfirmModal}
        onClose={cancelSendMessage}
        onConfirm={confirmSendMessage}
        title="Confirmer l'envoi du message"
        message={`Êtes-vous sûr de vouloir envoyer ce message "${sendConfirmData?.messageType?.title}" à ${sendConfirmData?.users.length === 1 ? 'cet utilisateur' : 'ces utilisateurs'} ?`}
        modificationsResume={getSendMessageModifications()}
        confirmText="Envoyer le message"
        cancelText="Annuler"
      />

      <ResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        title={resultModalSuccess ? 'Succès' : 'Erreur'}
        message={resultModalMessage}
        isSuccess={resultModalSuccess}
      />
    </div>
  );
};

export default Messages;