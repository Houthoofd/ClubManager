import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ADD_MESSAGE_NOTIFICATION, OPEN_RIGHT_NAVBAR } from '../../redux/actions';

const MessageIcon = () => {
  const dispatch = useDispatch();
  
  // Utilisation correcte de state.message pour obtenir les messages
  const messageState = useSelector((state: any) => state.message); 
  const messageCount = messageState?.messages?.length || 0;
  const darkMode = useSelector((state: any) => state.settings.darkMode);

  const handleClick = () => {
    // Ouvre le panneau droit
    dispatch(OPEN_RIGHT_NAVBAR());
    // Ajoute une nouvelle notification de message
    dispatch(
      ADD_MESSAGE_NOTIFICATION({
        id: Date.now(),
        message: 'New message notification',
        visibility: 'public',
      })
    );
  };

  return (
    <div className={`message-icon-${darkMode ? 'light' : 'dark'}`}>
      <svg
        onClick={handleClick}
        className="envelope-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        style={{ cursor: 'pointer' }}
      >
        {/* SVG d'une enveloppe */}
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1 .9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
      {messageCount > 0 && (
        <span 
          className={`notification-message-badge-${darkMode ? 'dark' : 'light'}`}
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '0.75rem',
          }}
        >
          {messageCount}
        </span>
      )}
    </div>
  );
};

export default MessageIcon;
