import React, { useState, useEffect } from "react";
import { PageSection, Tabs, Tab, TabTitleText, Alert, Spinner } from "@patternfly/react-core";
import { InboxIcon, CheckCircleIcon, PaperPlaneIcon, ListIcon } from '@/shared/icons';
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { useAuth } from "@/features/auth/hooks";
import { useAllUsers } from "@/features/users/hooks";
import {
  useMessagesReceived,
  useMessageTypes,
  useSendMessage,
  useMarkMessageAsRead,
  useDeleteReceivedMessage,
  useCreateMessageType,
  useUpdateMessageType,
  useDeleteMessageType,
} from "../hooks";
import {
  MESSAGE_TABS,
  MESSAGE_TAB_LABELS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  VALIDATION_MESSAGES,
} from "../constants";
import type { MessageWithStatus, MessagesPageState } from "@clubmanager/types";

// Components
import MessagesReceivedTab from "../components/MessagesReceivedTab";
import MessagesReadTab from "../components/MessagesReadTab";
import MessageTypesListTab from "../components/MessageTypesListTab";
import SendMessageForm from "../components/SendMessageForm";
import CreateMessageTypeForm from "../components/CreateMessageTypeForm";
import MessageDetailModal from "../components/MessageDetailModal";
import DeleteMessageModal from "../components/DeleteMessageModal";

const MessagesPage: React.FC = () => {
  const { user } = useAuth();

  // ============================================================================
  // State Management
  // ============================================================================
  const [state, setState] = useState<MessagesPageState>({
    activeTabKey: MESSAGE_TABS.RECEIVED,
    selectedMessage: null,
    isDetailModalOpen: false,
    isDeleteModalOpen: false,
    messageToDelete: null,
    editingMessageTypeId: null,
    editFormData: {
      title: "",
      content: "",
    },
  });

  const [createFormData, setCreateFormData] = useState({
    title: "",
    content: "",
  });

  const [sendFormData, setSendFormData] = useState({
    selectedUsers: [] as number[],
    selectedType: "",
  });

  const [notification, setNotification] = useState<{
    type: "success" | "danger" | "warning" | "info";
    message: string;
  } | null>(null);

  // ============================================================================
  // GraphQL Hooks
  // ============================================================================
  const userId = user?.id || 0;
  const messagesQuery = useMessagesReceived(userId);
  const messageTypesQuery = useMessageTypes();
  const allUsersQuery = useAllUsers();

  const { sendMessage, loading: sendingMessage } = useSendMessage();
  const { markAsRead } = useMarkMessageAsRead();
  const { deleteMessage, loading: deletingMessage } = useDeleteReceivedMessage();
  const { createMessageType, loading: creatingMessageType } = useCreateMessageType();
  const { updateMessageType } = useUpdateMessageType();
  const { deleteMessageType } = useDeleteMessageType();

  // ============================================================================
  // Data Processing
  // ============================================================================
  const messagesRecipients = messagesQuery.data?.messagesReceived || [];
  const messageTypes = messageTypesQuery.data?.messageTypes || [];
  const allUsers = allUsersQuery.data?.users || [];

  // Transform messages to UI format
  const transformedMessages: MessageWithStatus[] = messagesRecipients.map((recipient: any) => ({
    id: recipient.id,
    message_id: recipient.message_id,
    recipient_id: recipient.recipient_id,
    title: recipient.message?.subject || recipient.message?.messageType?.type_name || "Sans objet",
    content: recipient.message?.content || "",
    sender: recipient.message?.sender
      ? `${recipient.message.sender.first_name} ${recipient.message.sender.last_name}`
      : "Système",
    date_envoi: recipient.message?.sent_at || recipient.created_at || "",
    lu: recipient.read || false,
    date_lecture: recipient.read_at || undefined,
    type: recipient.message?.messageType?.type_name,
  }));

  const messagesNonLus = transformedMessages.filter((msg) => !msg.lu);
  const messagesLus = transformedMessages.filter((msg) => msg.lu);

  // ============================================================================
  // Event Handlers - Messages
  // ============================================================================
  const handleMessageClick = (message: MessageWithStatus) => {
    setState((prev) => ({
      ...prev,
      selectedMessage: message,
      isDetailModalOpen: true,
    }));
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await markAsRead(messageId);
      setNotification({
        type: "success",
        message: SUCCESS_MESSAGES.MESSAGE_MARKED_READ,
      });
      await messagesQuery.refetch();
    } catch (error) {
      console.error("Error marking message as read:", error);
      setNotification({
        type: "danger",
        message: ERROR_MESSAGES.MESSAGE_MARK_READ_FAILED,
      });
    }
  };

  const handleShowDeleteModal = (message: MessageWithStatus) => {
    setState((prev) => ({
      ...prev,
      messageToDelete: message,
      isDeleteModalOpen: true,
    }));
  };

  const handleConfirmDelete = async () => {
    if (!state.messageToDelete) return;

    try {
      await deleteMessage(state.messageToDelete.id);
      setNotification({
        type: "success",
        message: SUCCESS_MESSAGES.MESSAGE_DELETED,
      });
      setState((prev) => ({
        ...prev,
        isDeleteModalOpen: false,
        messageToDelete: null,
        isDetailModalOpen: false,
      }));
      await messagesQuery.refetch();
    } catch (error) {
      console.error("Error deleting message:", error);
      setNotification({
        type: "danger",
        message: ERROR_MESSAGES.MESSAGE_DELETE_FAILED,
      });
    }
  };

  const handleCancelDelete = () => {
    setState((prev) => ({
      ...prev,
      isDeleteModalOpen: false,
      messageToDelete: null,
    }));
  };

  // ============================================================================
  // Event Handlers - Send Message
  // ============================================================================
  const handleUserSelect = (userId: number) => {
    setSendFormData((prev) => ({
      ...prev,
      selectedUsers: [...prev.selectedUsers, userId],
    }));
  };

  const handleUserRemove = (userId: number) => {
    setSendFormData((prev) => ({
      ...prev,
      selectedUsers: prev.selectedUsers.filter((id) => id !== userId),
    }));
  };

  const handleTypeSelect = (typeId: string) => {
    setSendFormData((prev) => ({
      ...prev,
      selectedType: typeId,
    }));
  };

  const handleSendMessage = async () => {
    if (sendFormData.selectedUsers.length === 0) {
      setNotification({
        type: "warning",
        message: VALIDATION_MESSAGES.NO_RECIPIENTS,
      });
      return;
    }

    if (!sendFormData.selectedType) {
      setNotification({
        type: "warning",
        message: VALIDATION_MESSAGES.NO_MESSAGE_TYPE,
      });
      return;
    }

    try {
      const selectedMessageType = messageTypes.find(
        (t: any) => t.id === parseInt(sendFormData.selectedType),
      );

      if (!selectedMessageType) {
        throw new Error("Type de message non trouvé");
      }

      await sendMessage({
        sender_id: userId,
        type_message_id: parseInt(sendFormData.selectedType),
        subject: selectedMessageType.type_name,
        content: selectedMessageType.description || "",
        recipient_ids: sendFormData.selectedUsers,
      });

      setNotification({
        type: "success",
        message: SUCCESS_MESSAGES.MESSAGE_SENT,
      });

      // Reset form
      setSendFormData({
        selectedUsers: [],
        selectedType: "",
      });

      // Switch to received tab to see confirmation
      setState((prev) => ({
        ...prev,
        activeTabKey: MESSAGE_TABS.RECEIVED,
      }));
    } catch (error) {
      console.error("Error sending message:", error);
      setNotification({
        type: "danger",
        message: ERROR_MESSAGES.MESSAGE_SEND_FAILED,
      });
    }
  };

  // ============================================================================
  // Event Handlers - Message Types
  // ============================================================================
  const handleCreateFormChange = (field: string, value: string) => {
    setCreateFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateMessageType = async () => {
    if (!createFormData.title || !createFormData.content) {
      setNotification({
        type: "warning",
        message: VALIDATION_MESSAGES.MESSAGE_TYPE_NAME_REQUIRED,
      });
      return;
    }

    try {
      await createMessageType({
        type_name: createFormData.title,
        description: createFormData.content,
        active: true,
      });

      setNotification({
        type: "success",
        message: SUCCESS_MESSAGES.MESSAGE_TYPE_CREATED,
      });

      // Reset form
      setCreateFormData({
        title: "",
        content: "",
      });

      await messageTypesQuery.refetch();
    } catch (error) {
      console.error("Error creating message type:", error);
      setNotification({
        type: "danger",
        message: ERROR_MESSAGES.MESSAGE_TYPE_CREATE_FAILED,
      });
    }
  };

  const handleEditStart = (id: number, title: string, content: string) => {
    setState((prev) => ({
      ...prev,
      editingMessageTypeId: id,
      editFormData: { title, content },
    }));
  };

  const handleEditCancel = () => {
    setState((prev) => ({
      ...prev,
      editingMessageTypeId: null,
      editFormData: { title: "", content: "" },
    }));
  };

  const handleEditSave = async (id: number) => {
    try {
      await updateMessageType(id, {
        type_name: state.editFormData.title,
        description: state.editFormData.content,
      });

      setNotification({
        type: "success",
        message: SUCCESS_MESSAGES.MESSAGE_TYPE_UPDATED,
      });

      setState((prev) => ({
        ...prev,
        editingMessageTypeId: null,
        editFormData: { title: "", content: "" },
      }));

      await messageTypesQuery.refetch();
    } catch (error) {
      console.error("Error updating message type:", error);
      setNotification({
        type: "danger",
        message: ERROR_MESSAGES.MESSAGE_TYPE_UPDATE_FAILED,
      });
    }
  };

  const handleDeleteMessageType = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce type de message ?")) {
      return;
    }

    try {
      await deleteMessageType(id);

      setNotification({
        type: "success",
        message: SUCCESS_MESSAGES.MESSAGE_TYPE_DELETED,
      });

      await messageTypesQuery.refetch();
    } catch (error) {
      console.error("Error deleting message type:", error);
      setNotification({
        type: "danger",
        message: ERROR_MESSAGES.MESSAGE_TYPE_DELETE_FAILED,
      });
    }
  };

  const handleFormDataChange = (field: string, value: string) => {
    setState((prev) => ({
      ...prev,
      editFormData: {
        ...prev.editFormData,
        [field]: value,
      },
    }));
  };

  // ============================================================================
  // Effects
  // ============================================================================
  useEffect(() => {
    // Auto-dismiss notifications after 5 seconds
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ============================================================================
  // Loading & Error States
  // ============================================================================
  if (!userId) {
    return null;
  }

  if (messagesQuery.loading && !messagesQuery.data) {
    return (
      <div className="messages-page">
        <PageHeader
          title="Messages"
          subtitle="Communication avec vos membres et votre équipe"
          variant="messages"
        />
        <PageSection>
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <Spinner size="xl" />
            <p style={{ marginTop: "1rem" }}>Chargement des messages...</p>
          </div>
        </PageSection>
      </div>
    );
  }

  if (messagesQuery.error) {
    return (
      <div className="messages-page">
        <PageHeader
          title="Messages"
          subtitle="Communication avec vos membres et votre équipe"
          variant="messages"
        />
        <PageSection>
          <Alert variant="danger" title="Erreur de chargement" isInline>
            {ERROR_MESSAGES.LOAD_MESSAGES_FAILED}
          </Alert>
        </PageSection>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="messages-page">
      <PageHeader
        title="Messages"
        subtitle="Communication avec vos membres et votre équipe"
        variant="messages"
      />

      <PageSection className="messages-content">
        {/* Notification */}
        {notification && (
          <Alert
            variant={notification.type}
            title={notification.message}
            isInline
            style={{ marginBottom: "1rem" }}
            actionClose={
              <button onClick={() => setNotification(null)} aria-label="Close">
                ×
              </button>
            }
          />
        )}

        {/* Tabs Navigation */}
        <Tabs
          activeKey={state.activeTabKey}
          onSelect={(_event: React.MouseEvent, tabKey: string | number) =>
            setState((prev) => ({ ...prev, activeTabKey: tabKey as string }))
          }
          className="messages-tabs"
        >
          {/* Messages Non Lus */}
          <Tab
            eventKey={MESSAGE_TABS.RECEIVED}
            title={
              <TabTitleText>
                <InboxIcon style={{ marginRight: "8px" }} />
                {MESSAGE_TAB_LABELS[MESSAGE_TABS.RECEIVED]}
                {messagesNonLus.length > 0 && (
                  <span className="tab-badge">{messagesNonLus.length}</span>
                )}
              </TabTitleText>
            }
          >
            <MessagesReceivedTab
              messagesRecus={messagesNonLus}
              onMessageClick={handleMessageClick}
              onMarkAsRead={handleMarkAsRead}
              onDeleteMessage={(id) => {
                const message = messagesNonLus.find((m) => m.id === id);
                if (message) handleShowDeleteModal(message);
              }}
              onShowDeleteModal={handleShowDeleteModal}
            />
          </Tab>

          {/* Messages Lus */}
          <Tab
            eventKey={MESSAGE_TABS.READ}
            title={
              <TabTitleText>
                <CheckCircleIcon style={{ marginRight: "8px" }} />
                {MESSAGE_TAB_LABELS[MESSAGE_TABS.READ]}
              </TabTitleText>
            }
          >
            <MessagesReadTab
              messagesLus={messagesLus}
              onMessageClick={handleMessageClick}
              onDeleteMessage={(id) => {
                const message = messagesLus.find((m) => m.id === id);
                if (message) handleShowDeleteModal(message);
              }}
              onShowDeleteModal={handleShowDeleteModal}
            />
          </Tab>

          {/* Envoyer un Message */}
          <Tab
            eventKey={MESSAGE_TABS.SEND}
            title={
              <TabTitleText>
                <PaperPlaneIcon style={{ marginRight: "8px" }} />
                {MESSAGE_TAB_LABELS[MESSAGE_TABS.SEND]}
              </TabTitleText>
            }
          >
            <SendMessageForm
              utilisateurs={allUsers}
              typesMessages={messageTypes}
              selectedUsers={sendFormData.selectedUsers}
              selectedType={sendFormData.selectedType}
              isLoading={sendingMessage}
              onUserSelect={handleUserSelect}
              onUserRemove={handleUserRemove}
              onTypeSelect={handleTypeSelect}
              onSendMessage={handleSendMessage}
            />
          </Tab>

          {/* Types de Messages */}
          <Tab
            eventKey={MESSAGE_TABS.TYPES}
            title={
              <TabTitleText>
                <ListIcon style={{ marginRight: "8px" }} />
                {MESSAGE_TAB_LABELS[MESSAGE_TABS.TYPES]}
              </TabTitleText>
            }
          >
            <div className="message-types-container">
              <CreateMessageTypeForm
                formData={createFormData}
                isLoading={creatingMessageType}
                onFormChange={handleCreateFormChange}
                onCreateType={handleCreateMessageType}
              />

              <MessageTypesListTab
                typesMessages={messageTypes}
                editingId={state.editingMessageTypeId}
                editFormData={state.editFormData}
                onEditStart={handleEditStart}
                onEditCancel={handleEditCancel}
                onEditSave={handleEditSave}
                onDelete={handleDeleteMessageType}
                onFormDataChange={handleFormDataChange}
              />
            </div>
          </Tab>
        </Tabs>
      </PageSection>

      {/* Modals */}
      <MessageDetailModal
        isOpen={state.isDetailModalOpen}
        onClose={() => setState((prev) => ({ ...prev, isDetailModalOpen: false }))}
        message={state.selectedMessage}
        onMarkAsRead={handleMarkAsRead}
        onDelete={(id) => {
          const message = transformedMessages.find((m) => m.id === id);
          if (message) handleShowDeleteModal(message);
        }}
      />

      <DeleteMessageModal
        isOpen={state.isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        message={state.messageToDelete}
        isLoading={deletingMessage}
      />
    </div>
  );
};

export default MessagesPage;
