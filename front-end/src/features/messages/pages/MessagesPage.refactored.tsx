import { useState, useMemo } from "react";
import {
  PageSection,
  Tabs,
  Tab,
  TabTitleText,
  Alert,
  Badge,
  Divider,
} from "@patternfly/react-core";
import { InboxIcon, CheckCircleIcon, PaperPlaneIcon, ListIcon } from '@/shared/icons';
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
import { ReceivedMessagesContent, ReadMessagesContent, MessageStats } from "../components";
import MessageTypesListTab from "../components/MessageTypesListTab";
import SendMessageForm from "../components/SendMessageForm";
import MessageDetailModal from "../components/MessageDetailModal";
import DeleteMessageModal from "../components/DeleteMessageModal";
import { useMessageTabs } from "../hooks";

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
 * MessagesPage Component - REFACTORED WITH ATOMIC COMPONENTS
 *
 * Main messaging interface with tabs for received/read messages, types and send form.
 * Fully modularized with atomic components and custom hooks.
 *
 * @architecture
 * - GraphQL: Messages queries and mutations
 * - Zustand: authStore (user), uiStore (notifications)
 * - HOCs: withAuth, withTracking, withErrorBoundary
 * - i18n: messages.*
 * - Atomic Components: ReceivedMessagesContent, ReadMessagesContent, MessageStats
 * - Custom Hooks: useMessageTabs
 *
 * Features:
 * - 4 tabs: Received, Read, Types, Send
 * - Message detail modal
 * - Delete confirmation modal
 * - Real-time message counts
 * - Message type management
 * - Search functionality per tab
 * - Message statistics display
 */
const MessagesPage = () => {
  const { t } = useTypedTranslation();
  const { trackEvent } = useTracking();

  // Zustand stores
  const user = useAuthStore((state: any) => state.user);
  const addNotification = useUiStore((state: any) => state.addNotification);

  // Local state
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

  // Custom hook for tab management
  const { activeTabKey, setActiveTabKey } = useMessageTabs();

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
      title:
        recipient.message?.subject ||
        recipient.message?.messageType?.type_name ||
        t("messages.list.noMessages"),
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

  // Transform messages to atomic component format
  const receivedMessagesFormatted = useMemo(() => {
    return messagesNonLus.map((msg) => ({
      id: msg.id,
      subject: msg.title,
      content: msg.content,
      sender: {
        first_name: msg.sender.split(" ")[0] || "",
        last_name: msg.sender.split(" ")[1] || "",
      },
      type: msg.type,
      created_at: msg.date_envoi,
      date: msg.date_envoi,
      read: msg.lu,
      lu: msg.lu,
    }));
  }, [messagesNonLus]);

  const readMessagesFormatted = useMemo(() => {
    return messagesLus.map((msg) => ({
      id: msg.id,
      subject: msg.title,
      content: msg.content,
      sender: {
        first_name: msg.sender.split(" ")[0] || "",
        last_name: msg.sender.split(" ")[1] || "",
      },
      type: msg.type,
      created_at: msg.date_envoi,
      date: msg.date_envoi,
      read: msg.lu,
      lu: msg.lu,
    }));
  }, [messagesLus]);

  /**
   * Handle message click to show details
   */
  const handleMessageClick = (messageId: string | number) => {
    const message = transformedMessages.find((m) => m.id === Number(messageId));
    if (message) {
      setSelectedMessage(message);
      setIsDetailModalOpen(true);
      trackEvent("message_detail_opened", { messageId: message.id });
    }
  };

  /**
   * Mark message as read
   */
  const handleMarkAsRead = async (messageId: string | number) => {
    try {
      await markAsRead({
        variables: { recipientId: Number(messageId) },
      });

      addNotification({
        type: "success",
        message: t("messages.delete.successMarkedRead"),
      });

      trackEvent("message_marked_read", { messageId });
      await refetchMessages();
    } catch (error: any) {
      console.error("Error marking message as read:", error);

      addNotification({
        type: "error",
        message: t("messages.delete.error"),
      });

      trackEvent("message_mark_read_failed", {
        messageId,
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Show delete confirmation modal
   */
  const handleShowDeleteModal = (messageId: string | number) => {
    const message = transformedMessages.find((m) => m.id === Number(messageId));
    if (message) {
      setMessageToDelete(message);
      setIsDeleteModalOpen(true);
      trackEvent("message_delete_clicked", { messageId: message.id });
    }
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
    } catch (error: any) {
      console.error("Error deleting message:", error);

      addNotification({
        type: "error",
        message: t("messages.delete.error"),
      });

      trackEvent("message_delete_failed", {
        messageId: messageToDelete.id,
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Cancel delete modal
   */
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setMessageToDelete(null);
    trackEvent("message_delete_cancelled");
  };

  /**
   * Handle user selection for sending messages
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
   * Send message
   */
  const handleSendMessage = async () => {
    // Validation
    if (sendFormData.selectedUsers.length === 0) {
      addNotification({
        type: "error",
        message: t("messages.send.errors.noRecipients"),
      });
      return;
    }

    if (!sendFormData.selectedType) {
      addNotification({
        type: "error",
        message: t("messages.send.errors.noType"),
      });
      return;
    }

    if (!sendFormData.subject || !sendFormData.subject.trim()) {
      addNotification({
        type: "error",
        message: t("messages.send.errors.noSubject"),
      });
      return;
    }

    if (!sendFormData.content || !sendFormData.content.trim()) {
      addNotification({
        type: "error",
        message: t("messages.send.errors.noContent"),
      });
      return;
    }

    try {
      await sendMessage({
        variables: {
          input: {
            sender_id: user?.id || 0,
            type_message_id: parseInt(sendFormData.selectedType),
            subject: sendFormData.subject,
            content: sendFormData.content,
            recipient_ids: sendFormData.selectedUsers,
          },
        },
      });

      addNotification({
        type: "success",
        message: t("messages.send.success", { count: sendFormData.selectedUsers.length }),
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

      await refetchMessages();
    } catch (error: any) {
      console.error("Error sending message:", error);

      addNotification({
        type: "error",
        message: t("messages.send.error"),
      });

      trackEvent("message_send_failed", {
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Handle create form changes
   */
  const handleCreateFormChange = (field: string, value: string) => {
    setCreateFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Create new message type
   */
  const handleCreateMessageType = async () => {
    if (!createFormData.title || !createFormData.title.trim()) {
      addNotification({
        type: "error",
        message: t("messages.types.errors.noTitle"),
      });
      return;
    }

    try {
      await createMessageType({
        variables: {
          input: {
            type_name: createFormData.title,
            description: createFormData.content || "",
            active: true,
          },
        },
      });

      addNotification({
        type: "success",
        message: t("messages.types.createSuccess"),
      });

      trackEvent("message_type_created", {
        typeName: createFormData.title,
      });

      setCreateFormData({ title: "", content: "" });
      await refetchTypes();
    } catch (error: any) {
      console.error("Error creating message type:", error);

      addNotification({
        type: "error",
        message: t("messages.types.errors.createFailed"),
      });

      trackEvent("message_type_create_failed", {
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Start editing a message type
   */
  const handleEditStart = (typeId: number, title: string, content: string) => {
    setEditingMessageTypeId(typeId);
    setEditFormData({ title, content });
  };

  /**
   * Cancel editing
   */
  const handleEditCancel = () => {
    setEditingMessageTypeId(null);
    setEditFormData({ title: "", content: "" });
  };

  /**
   * Save edited message type
   */
  const handleEditSave = async () => {
    if (!editingMessageTypeId) return;

    try {
      await updateMessageType({
        variables: {
          id: editingMessageTypeId,
          input: {
            type_name: editFormData.title,
            description: editFormData.content,
          },
        },
      });

      addNotification({
        type: "success",
        message: t("messages.types.updateSuccess"),
      });

      trackEvent("message_type_updated", { typeId: editingMessageTypeId });

      setEditingMessageTypeId(null);
      setEditFormData({ title: "", content: "" });
      await refetchTypes();
    } catch (error: any) {
      console.error("Error updating message type:", error);

      addNotification({
        type: "error",
        message: t("messages.types.errors.updateFailed"),
      });

      trackEvent("message_type_update_failed", {
        typeId: editingMessageTypeId,
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Delete message type
   */
  const handleDeleteMessageType = async (typeId: number) => {
    try {
      await deleteMessageType({
        variables: { id: typeId },
      });

      addNotification({
        type: "success",
        message: t("messages.types.deleteSuccess"),
      });

      trackEvent("message_type_deleted", { typeId });
      await refetchTypes();
    } catch (error: any) {
      console.error("Error deleting message type:", error);

      addNotification({
        type: "error",
        message: t("messages.types.errors.deleteFailed"),
      });

      trackEvent("message_type_delete_failed", {
        typeId,
        error: error?.message || "unknown",
      });
    }
  };

  /**
   * Handle form data changes
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
        {/* Message Statistics */}
        <MessageStats
          totalMessages={transformedMessages.length}
          unreadMessages={messagesNonLus.length}
          readMessages={messagesLus.length}
          showTotal={true}
          showUnread={true}
          showRead={true}
          variant="horizontal"
        />

        <Divider style={{ marginBottom: "1.5rem" }} />

        {/* Tabs */}
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
                  <Badge isRead={false} style={{ marginLeft: "0.5rem" }}>
                    {messagesNonLus.length}
                  </Badge>
                )}
              </TabTitleText>
            }
          >
            <ReceivedMessagesContent
              messages={receivedMessagesFormatted}
              onMessageClick={handleMessageClick}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleShowDeleteModal}
              isLoading={loadingMessages}
              groupByDate={true}
              showSearch={true}
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
            <ReadMessagesContent
              messages={readMessagesFormatted}
              onMessageClick={handleMessageClick}
              onDelete={handleShowDeleteModal}
              isLoading={loadingMessages}
              groupByDate={true}
              showSearch={true}
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
              onSubjectChange={(value: string) =>
                setSendFormData((prev) => ({ ...prev, subject: value }))
              }
              onContentChange={(value: string) =>
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
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default withAuth(withTracking(withErrorBoundary(MessagesPage), "MessagesPage"));
