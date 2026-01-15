import React from 'react';

interface MessageCardProps {
  message: {
    id: number;
    title: string;
    content: string;
    sender: string;
    date_envoi: string;
    lu: boolean;
  };
  onMarkAsRead: (id: number) => void;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onMarkAsRead }) => {
  const handleMarkAsRead = async () => {
    try {
      const response = await fetch(`/api/messages/${message.id}/marquer-lu`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        onMarkAsRead(message.id);
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  return (
    <div className={`message-card ${!message.lu ? 'unread' : ''}`}>
      <div className="message-header">
        <div className="message-info">
          <h3>{message.title}</h3>
          <span className="sender">De: {message.sender}</span>
          <span className="date">{new Date(message.date_envoi).toLocaleDateString()}</span>
        </div>
        {!message.lu && (
          <div className="message-actions">
            <button 
              className="mark-read-btn"
              onClick={handleMarkAsRead}
              title="Marquer comme lu"
            >
              ✓
            </button>
          </div>
        )}
      </div>
      
      <div className="message-content">
        <p>{message.content}</p>
      </div>
      
      {!message.lu && <div className="unread-indicator"></div>}
    </div>
  );
};

export default MessageCard;
