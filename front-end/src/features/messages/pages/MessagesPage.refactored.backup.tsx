import { useState, useMemo } from "react";
import {
  PageSection,
  Tabs,
  Tab,
  TabTitleText,
  Alert,
  Badge,
} from "@patternfly/react-core";
import {
  InboxIcon,
  CheckCircleIcon,
  PaperPlaneIcon,
  ListIcon,
} from '@/shared/icons';
import { PageHeader } from "@/shared/components/common-legacy/PageHeader";
import { useTypedTranslation } from "@/core/i18n/useTypedTranslation";
import { useAuthStore } from "@/core/store/authStore";
import { useUiStore } from "@/core/store/uiStore";
import { withAuth } from "@/shared/hocs/withAuth";
import { withTracking } from "@/shared/hocs/withTracking";
import { withErrorBoundary } from "@/shared/hocs/withErrorBoundary";
import { useTracking } from "@/shared/hooks/tracking/useTracking";
import {
  useMessagesReceivedQuery,
  useMessageTypesQuery,
  useSendMessageMutation,
  useMarkMessageAsReadMutation,
  useDeleteReceivedMessageMutation,
  useCreateMessageTypeMutation,
  useUpdateMessageTypeMutation,
  useDeleteMessageTypeMutation,
} from "@/core/api/graphql/generated/graphql";
import { useGetUsersQuery } from "@/core/api/graphql/generated/graphql";
import MessagesReceivedTab from "../components/MessagesReceivedTab";
import MessagesReadTab from "../components/MessagesReadTab";
import MessageTypesListTab from "../components/MessageTypesListTab";
import SendMessageForm from "../components/SendMessageForm";
import MessageDetailModal from "../components/MessageDetailModal";
import DeleteMessageModal from "../components/DeleteMessageModal";

interface Message {
  id: number;
  message_id: number;
  recipient_id: number;
  title: string;
  content: string;
  sender: string;
  date_envoi: string;
  lu: boolean;
  date_lecture?: string;
  type?: string;
}

/**
 * MessagesPage Component
 *
 * Main messaging interface with tabs for received/read messages, types and send form
 *
 * @architecture
 * - GraphQL: Messages queries and mutations
 * - Zustand: authStore (user), uiStore (notifications)
 * - HOCs: withAuth, withTracking, withErrorBoundary
 * - i18n: messages.*
 *
 * Features:
 * - 4 tabs: Received, Read, Types, Send
 * - Message detail modal
 * - Delete confirmation modal
 * - Real-time message counts
 * - Message type management
 */
const MessagesPage = () => {
  const { t } = useTypedTranslation();
  const { trackEvent } = useTracking();

  // Zustand stores
  const user = useAuthStore((state) => state.user);
  const addNotification = useUiStore((state) => state.addNotification);

  // Local state
  const [activeTabKey, setActiveTabKey] = useState<number>(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [editingMessageTypeId, setEditingMessageTypeId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({ title: "", content: "" });
  const [createFormData, setCreateFormData] = useState({ title: "", content: "" });
  const [sendFormData, setSendFormData] = useState({
    selectedUsers: [] as number[],
    selectedType: "",
    subject: "",
    content: "",
  });

  // GraphQL queries
  const {
    data: messagesData,
    loading: loadingMessages,
    error: errorMessages,
    refetch: refetchMessages,
  } = useMessagesReceivedQuery({
    variables: { userId: user?.id || 0 },
    skip: !user?.id,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: messageTypesData,
    loading: loadingTypes,
    refetch: refetchTypes,
  } = useMessageTypesQuery({
    fetchPolicy: "cache-and-network",
  });

  const { data: usersData } = useGetUsersQuery({
    fetchPolicy: "cache-and-network",
  });

  // GraphQL mutations
  const [sendMessage, { loading: sendingMessage }] = useSendMessageMutation();
  const [markAsRead] = useMarkMessageAsReadMutation();
  const [deleteMessage, { loading: deletingMessage }] = useDeleteReceivedMessageMutation();
  const [createMessageType, { loading: creatingMessageType }] = useCreateMessageTypeMutation();
  const [updateMessageType] = useUpdateMessageTypeMutation();
  const [deleteMessageType] = useDeleteMessageTypeMutation();

  // Extract data from queries
  const messagesRecipients = useMemo(() => {
    return messagesData?.messagesReceived || [];
  }, [messagesData]);

  const messageTypes = useMemo(() => {
    return messageTypesData?.messageTypes || [];
  }, [messageTypesData]);

  const allUsers = useMemo(() => {
    return usersData?.users || [];
  }, [usersData]);

  // Transform messages to UI format
  const transformedMessages = useMemo((): Message[] => {
    return messagesRecipients.map((recipient: any) => ({
      id: recipient.id,
      message_id: recipient.message_id,
      recipient_id: recipient.recipient_id,
      title: recipient.message?.subject || recipient.message?.messageType?.type_name || t("messages.list.noMessages"),
      content: recipient.message?.content || "",
      sender: recipient.message?.sender
        ? `${recipient.message.sender.first_name} ${recipient.message.sender.last_name}`
        : t("common.system"),
      date_envoi: recipient.message?.sent_at || recipient.created_at || "",
      lu: recipient.read || false,
      date_lecture: recipient.read_at || undefined,
      type: recipient.message?.messageType?.type_name,
    }));
  }, [messagesRecipients, t]);

  // Split messages by read status
  const messagesNonLus = useMemo(() => {
    return transformedMessages.filter((msg) => !msg.lu);
  }, [transformedMessages]);

  const messagesLus = useMemo(() => {
    return transformedMessages.filter((msg) => msg.lu);
  }, [transformedMessages]);

  /**
   * Handle message click to show details
   */
  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setIsDetailModalOpen(true);
    trackEvent("message_detail_opened", { messageId: message.id });
  };

  /**
   * Mark message as read
   */
  const handleMarkAsRead = async (messageId: number) => {
    try {
      await markAsRead({
        variables: { recipientId: messageId },
      });

      addNotification({
        type: "success",
        message: t("messages.delete.successMarkedRead"),
      });

      trackEvent("message_marked_read", { messageId });
      await refetchMessages();
    } catch (error) {
      console.error("Error marking message as read:", error);

      addNotification({
        type: "error",
        message: t("messages.delete.error"),
      });

      trackEvent("message_mark_read_failed", {
        messageId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  /**
   * Show delete confirmation modal
   */
  const handleShowDeleteModal = (message: Message) => {
    setMessageToDelete(message);
    setIsDeleteModalOpen(true);
    trackEvent("message_delete_clicked", { messageId: message.id });
  };

  /**
   * Confirm and execute message deletion
   */
  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;

    try {
      await deleteMessage({
        variables: { recipientId: messageToDelete.id },
      });

      addNotification({
        type: "success",
        message: t("messages.delete.success"),
      });

      trackEvent("message_deleted", {
        messageId: messageToDelete.id,
      });

      setIsDeleteModalOpen(false);
      setMessageToDelete(null);
      setIsDetailModalOpen(false);

      await refetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);

      addNotification({
        type: "error",
        message: t("messages.delete.error"),
      });

      trackEvent("message_delete_failed", {
        messageId: messageToDelete.id,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  /**
   * Cancel message deletion
   */
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setMessageToDelete(null);
  };

  /**
   * Handle user selection for sending message
   */
  const handleUserSelect = (userId: number) => {
    setSendFormData((prev) => ({
      ...prev,
      selectedUsers: [...prev.selectedUsers, userId],
    }));
  };

  /**
   * Handle user removal from recipients
   */
  const handleUserRemove = (userId: number) => {
    setSendFormData((prev) => ({
      ...prev,
      selectedUsers: prev.selectedUsers.filter((id) => id !== userId),
    }));
  };

  /**
   * Handle message type selection
   */
  const handleTypeSelect = (typeId: string) => {
    setSendFormData((prev) => ({
      ...prev,
      selectedType: typeId,
    }));
  };

  /**
   * Handle send message form submission
   */
  const handleSendMessage = async () => {
    // Validation
    if (sendFormData.selectedUsers.length === 0) {
      addNotification({
        type: "error",
        message: t("messages.compose.validation.usersRequired"),
      });
      return;
    }

    if (!sendFormData.selectedType) {
      addNotification({
        type: "error",
        message: t("messages.compose.validation.typeRequired"),
      });
      return;
    }

    if (!sendFormData.subject.trim()) {
      addNotification({
        type: "error",
        message: t("messages.compose.validation.subjectRequired"),
      });
      return;
    }

    if (!sendFormData.content.trim()) {
      addNotification({
        type: "error",
        message: t("messages.compose.validation.contentRequired"),
      });
      return;
    }

    try {
      await sendMessage({
        variables: {
          input: {
            sender_id: user?.id || 0,
            type_message_id: Number(sendFormData.selectedType),
            subject: sendFormData.subject,
            content: sendFormData.content,
            recipient_ids: sendFormData.selectedUsers,
          },
        },
      });

      addNotification({
        type: "success",
        message: t("messages.compose.success", { count: sendFormData.selectedUsers.length }),
      });

      trackEvent("message_sent", {
        recipientCount: sendFormData.selectedUsers.length,
        messageTypeId: sendFormData.selectedType,
      });

      // Reset form
      setSendFormData({
        selectedUsers: [],
        selectedType: "",
        subject: "",
        content: "",
      });

      // Switch to received tab
      setActiveTabKey(0);
    } catch (error) {
      console.error("Error sending message:", error);

      addNotification({
        type: "error",
        message: t("messages.compose.error"),
      });

      trackEvent("message_send_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  /**
   * Handle create message type form change
   */
  const handleCreateFormChange = (field: string, value: string) => {
    setCreateFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Handle create message type submission
   */
  const handleCreateMessageType = async () => {
    if (!createFormData.title.trim()) {
      addNotification({
        type: "error",
        message: t("messages.types.validation.nameRequired"),
      });
      return;
    }

    try {
      await createMessageType({
        variables: {
          input: {
            type_name: createFormData.title,
            description: createFormData.content,
            active: true,
          },
        },
      });

      addNotification({
        type: "success",
        message: t("messages.types.success.created"),
      });

      trackEvent("message_type_created", {
        typeName: createFormData.title,
      });

      setCreateFormData({ title: "", content: "" });
      await refetchTypes();
    } catch (error) {
      console.error("Error creating message type:", error);

      addNotification({
        type: "error",
        message: t("messages.types.error.createFailed"),
      });

      trackEvent("message_type_create_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  /**
   * Start editing a message type
   */
  const handleEditStart = (typeId: number, typeName: string, description: string) => {
    setEditingMessageTypeId(typeId);
    setEditFormData({ title: typeName, content: description });
  };

  /**
   * Cancel editing a message type
   */
  const handleEditCancel = () => {
    setEditingMessageTypeId(null);
    setEditFormData({ title: "", content: "" });
  };

  /**
   * Save edited message type
   */
  const handleEditSave = async (typeId: number) => {
    try {
      await updateMessageType({
        variables: {
          id: typeId,
          input: {
            type_name: editFormData.title,
            description: editFormData.content,
          },
        },
      });

      addNotification({
        type: "success",
        message: t("messages.types.success.updated"),
      });

      trackEvent("message_type_updated", { typeId });

      setEditingMessageTypeId(null);
      setEditFormData({ title: "", content: "" });
      await refetchTypes();
    } catch (error) {
      console.error("Error updating message type:", error);

      addNotification({
        type: "error",
        message: t("messages.types.error.updateFailed"),
      });

      trackEvent("message_type_update_failed", {
        typeId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  /**
   * Delete a message type
   */
  const handleDeleteMessageType = async (typeId: number) => {
    try {
      await deleteMessageType({
        variables: { id: typeId },
      });

      addNotification({
        type: "success",
        message: t("messages.types.success.deleted"),
      });

      trackEvent("message_type_deleted", { typeId });
      await refetchTypes();
    } catch (error) {
      console.error("Error deleting message type:", error);

      addNotification({
        type: "error",
        message: t("messages.types.error.deleteFailed"),
      });

      trackEvent("message_type_delete_failed", {
        typeId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  };

  /**
   * Handle edit form data change
   */
  const handleFormDataChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Loading state
  if (loadingMessages || loadingTypes) {
    return (
      <div>
        <PageHeader
          title={t("messages.title")}
          subtitle={t("messages.subtitle")}
          variant="messages"
        />
        <PageSection>
          <Alert variant="info" title={t("messages.loading")} />
        </PageSection>
      </div>
    );
  }

  // Error state
  if (errorMessages) {
    return (
      <div>
        <PageHeader
          title={t("messages.title")}
          subtitle={t("messages.subtitle")}
          variant="messages"
        />
        <PageSection>
          <Alert variant="danger" title={t("messages.loadingError")} />
        </PageSection>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("messages.title")}
        subtitle={t("messages.subtitle")}
        variant="messages"
      />

      <PageSection>
        <Tabs
          activeKey={activeTabKey}
          onSelect={(_, tabIndex) => {
            setActiveTabKey(tabIndex as number);
            trackEvent("message_tab_changed", { tab: tabIndex });
          }}
        >
          {/* Received Messages Tab */}
          <Tab
            eventKey={0}
            title={
              <TabTitleText>
                <InboxIcon style={{ marginRight: "0.5rem" }} />
                {t("messages.tabs.received")}
                {messagesNonLus.length > 0 && (
                  <Badge
                    isRead={false}
                    style={{ marginLeft: "0.5rem" }}
                  >
                    {messagesNonLus.length}
                  </Badge>
                )}
              </TabTitleText>
            }
          >
            <MessagesReceivedTab
              messages={messagesNonLus}
              onMessageClick={handleMessageClick}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleShowDeleteModal}
            />
          </Tab>

          {/* Read Messages Tab */}
          <Tab
            eventKey={1}
            title={
              <TabTitleText>
                <CheckCircleIcon style={{ marginRight: "0.5rem" }} />
                {t("messages.tabs.read")}
              </TabTitleText>
            }
          >
            <MessagesReadTab
              messages={messagesLus}
              onMessageClick={handleMessageClick}
              onDelete={handleShowDeleteModal}
            />
          </Tab>

          {/* Message Types Tab */}
          <Tab
            eventKey={2}
            title={
              <TabTitleText>
                <ListIcon style={{ marginRight: "0.5rem" }} />
                {t("messages.tabs.types")}
              </TabTitleText>
            }
          >
            <MessageTypesListTab
              messageTypes={messageTypes}
              createFormData={createFormData}
              editingMessageTypeId={editingMessageTypeId}
              editFormData={editFormData}
              creatingMessageType={creatingMessageType}
              onCreateFormChange={handleCreateFormChange}
              onCreate={handleCreateMessageType}
              onEditStart={handleEditStart}
              onEditCancel={handleEditCancel}
              onEditSave={handleEditSave}
              onFormDataChange={handleFormDataChange}
              onDelete={handleDeleteMessageType}
            />
          </Tab>

          {/* Send Message Tab */}
          <Tab
            eventKey={3}
            title={
              <TabTitleText>
                <PaperPlaneIcon style={{ marginRight: "0.5rem" }} />
                {t("messages.tabs.send")}
              </TabTitleText>
            }
          >
            <SendMessageForm
              allUsers={allUsers}
              messageTypes={messageTypes}
              sendFormData={sendFormData}
              sendingMessage={sendingMessage}
              onUserSelect={handleUserSelect}
              onUserRemove={handleUserRemove}
              onTypeSelect={handleTypeSelect}
              onSubjectChange={(value) =>
                setSendFormData((prev) => ({ ...prev, subject: value }))
              }
              onContentChange={(value) =>
                setSendFormData((prev) => ({ ...prev, content: value }))
              }
              onSend={handleSendMessage}
            />
          </Tab>
        </Tabs>
      </PageSection>

      {/* Message Detail Modal */}
      <MessageDetailModal
        isOpen={isDetailModalOpen}
        message={selectedMessage}
        onClose={() => setIsDetailModalOpen(false)}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleShowDeleteModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteMessageModal
        isOpen={isDeleteModalOpen}
        message={messageToDelete}
        deleting={deletingMessage}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

// Export with HOCs: Auth, Tracking, Error boundary
export default withAuth(withTracking(withErrorBoundary(MessagesPage), "MessagesPage"));
