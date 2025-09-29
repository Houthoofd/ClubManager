import React from 'react';
import {
  Modal,
  ModalVariant,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Title,
  Divider,
  Flex,
  FlexItem,
  Badge
} from '@patternfly/react-core';
import {
  UserIcon,
  CalendarAltIcon,
  TimesIcon,
  CheckIcon
} from '@patternfly/react-icons';

interface MessageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: {
    id: number;
    title: string;
    content: string;
    sender: string;
    date_envoi: string;
    lu: boolean;
  } | null;
  onMarkAsRead?: (messageId: number) => void;
  onDelete?: (messageId: number) => void;
}

const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  isOpen,
  onClose,
  message,
  onMarkAsRead,
  onDelete,
}) => {
  if (!message) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead && !message.lu) {
      onMarkAsRead(message.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
      onClose();
    }
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title=""
      isOpen={isOpen}
      onClose={onClose}
      className="message-detail-modal"
    >
      <ModalHeader>
        <div className="message-detail-header">
          <div className="message-title-section">
            <Title headingLevel="h2" size="xl" className="message-modal-title">
              {message.title}
            </Title>
            {!message.lu && (
              <Badge className="unread-badge-modal">
                Nouveau
              </Badge>
            )}
          </div>
          
          <div className="message-meta-section">
            <Flex spaceItems={{ default: 'spaceItemsLg' }}>
              <FlexItem>
                <div className="meta-item">
                  <UserIcon className="meta-icon" />
                  <span className="meta-text">
                    <strong>De:</strong> {message.sender}
                  </span>
                </div>
              </FlexItem>
              <FlexItem>
                <div className="meta-item">
                  <CalendarAltIcon className="meta-icon" />
                  <span className="meta-text">
                    <strong>Reçu le:</strong> {formatDate(message.date_envoi)}
                  </span>
                </div>
              </FlexItem>
            </Flex>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <Divider style={{ marginBottom: '1.5rem' }} />
        <div className="message-content-modal">
          <div className="content-wrapper">
            {message.content.split('\n').map((paragraph, index) => (
              <p key={index} className="content-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Flex spaceItems={{ default: 'spaceItemsMd' }}>
          {!message.lu && onMarkAsRead && (
            <FlexItem>
              <Button
                variant="primary"
                onClick={handleMarkAsRead}
                icon={<CheckIcon />}
              >
                Marquer comme lu
              </Button>
            </FlexItem>
          )}
          {onDelete && (
            <FlexItem>
              <Button
                variant="danger"
                onClick={handleDelete}
                icon={<TimesIcon />}
              >
                Supprimer
              </Button>
            </FlexItem>
          )}
          <FlexItem>
            <Button variant="secondary" onClick={onClose}>
              Fermer
            </Button>
          </FlexItem>
        </Flex>
      </ModalFooter>

      <style jsx>{`
        .message-detail-modal {
          --pf-c-modal__content--MaxWidth: 700px;
        }

        .message-detail-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .message-modal-title {
          color: #2d3748;
          font-weight: 700;
          margin: 0;
          line-height: 1.3;
        }

        .unread-badge-modal {
          background: #667eea !important;
          color: white !important;
          font-size: 0.75rem !important;
          padding: 0.4rem 0.8rem !important;
          border-radius: 12px !important;
          font-weight: 600 !important;
        }

        .message-meta-section {
          padding: 1rem;
          background: rgba(248, 249, 250, 0.8);
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .meta-icon {
          color: #667eea;
          font-size: 1rem;
        }

        .meta-text {
          color: #495057;
          font-size: 0.95rem;
        }

        .message-content-modal {
          min-height: 200px;
          max-height: 400px;
          overflow-y: auto;
        }

        .content-wrapper {
          padding: 1.5rem;
          background: #ffffff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .content-paragraph {
          margin: 0 0 1rem 0;
          line-height: 1.7;
          color: #495057;
          font-size: 1rem;
        }

        .content-paragraph:last-child {
          margin-bottom: 0;
        }

        .content-paragraph:empty {
          margin-bottom: 0.5rem;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .message-detail-modal {
            --pf-c-modal__content--MaxWidth: 95vw;
          }

          .message-title-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .message-meta-section .pf-l-flex {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .content-wrapper {
            padding: 1rem;
          }
        }

        /* Animation d'entrée */
        .message-detail-modal .pf-c-modal-box {
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Amélioration de la scrollbar */
        .message-content-modal::-webkit-scrollbar {
          width: 6px;
        }

        .message-content-modal::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .message-content-modal::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .message-content-modal::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </Modal>
  );
};

export default MessageDetailModal;
