import React from "react";
import {
  Card,
  CardBody,
  Title,
  Badge,
  Button,
  Divider,
} from "@patternfly/react-core";
import { TrashIcon } from "@patternfly/react-icons";

interface MessageCardProps {
  message: {
    id: number;
    title: string;
    content: string;
    sender: string;
    date_envoi: string;
    lu: boolean;
  };
  onMessageClick: (message: any) => void;
  onMarkAsRead: (messageId: number) => void;
  onDeleteMessage: (messageId: number) => void;
}

const MessageCard: React.FC<MessageCardProps> = ({
  message,
  onMessageClick,
  onMarkAsRead,
  onDeleteMessage,
}) => {
  return (
    <Card
      className={`message-received-card ${!message.lu ? "unread" : ""}`}
      isClickable
      onClick={() => onMessageClick(message)}
    >
      <CardBody>
        <div className="message-received-header">
          <div className="message-info">
            <Title
              headingLevel="h4"
              size="md"
              className="message-received-title"
            >
              {message.title}
              {!message.lu && <Badge className="unread-badge">Nouveau</Badge>}
            </Title>
            <div className="message-meta">
              <span className="message-sender">De: {message.sender}</span>
              <span className="message-date">
                Le {new Date(message.date_envoi).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
          <div className="message-actions">
            {!message.lu && (
              <Button
                variant="link"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onMarkAsRead(message.id);
                }}
                className="mark-read-btn"
              >
                Marquer comme lu
              </Button>
            )}
            <Button
              variant="plain"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onDeleteMessage(message.id);
              }}
              className="delete-message-btn"
            >
              <TrashIcon />
            </Button>
          </div>
        </div>
        <Divider />
        <div className="message-received-content">
          <p className="message-received-text">
            {message.content.length > 150
              ? `${message.content.substring(0, 150)}...`
              : message.content}
          </p>
          <div className="click-to-read">
            <small>Cliquez pour lire le message complet</small>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default MessageCard;
