import React from 'react';
import { useSelector } from 'react-redux';

const NotificationList = () => {
  // Récupérer les notifications depuis le store Redux
  const notifications = useSelector((state: any) => state.notifications.notifications);

  // Fonction pour assigner une classe en fonction du type de notification
  const getNotificationClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'notification-success';
      case 'danger':
        return 'notification-danger';
      case 'information':
        return 'notification-information';
      default:
        return 'notification-default';
    }
  };

  return (
    <div className="notifications">
      <ul className="notifications-list">
        {Array.isArray(notifications) && notifications.length > 0 ? (
          notifications.map((notification) => (
            <li 
              className={`notifications-list-item ${getNotificationClass(notification.type)}`} 
              key={notification.id}
            > 
                <div className='notification-list-item-icon'>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>
                </div>
                <div className='notification-list-item-'>
                  <div className='notification-list-item-title'>
                    <span>Succes !</span>
                  </div>
                  <div className='notification-list-item-message'>
                    {notification.message}
                  </div>
                </div>
                <div className='notification-list-item-icon'>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                </div>
            </li>
          ))
        ) : (
          <li>Aucune notification disponible</li>
        )}
      </ul>
    </div>
  );
};

export default NotificationList;
