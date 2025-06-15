import React, {useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { REMOVE_NOTIFICATION } from '../../redux/actions';

const NotificationList = () => {
  const dispatch = useDispatch();
  // Récupérer les notifications depuis le store Redux
  const notifications = useSelector((state: any) => state.notifications.notifications);

  const [removingNotifications, setRemovingNotifications] = useState<Set<number>>(new Set());

  const removeNotification = (id: number) => {
    // Ajouter l'ID de la notification à l'état des notifications en cours de suppression
    setRemovingNotifications((prev) => new Set(prev.add(id)));

    // Lancer la suppression du store Redux après l'animation
    setRemovingNotifications((prev) => {
      const updatedSet = new Set(prev);
      updatedSet.delete(id);
      return updatedSet;
    });
    dispatch(REMOVE_NOTIFICATION(id)); // Dispatch pour supprimer la notification après l'animation
  };

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

  // Fonction pour obtenir le SVG en fonction du type de notification
  const getNotificationIcon = (type: string) => {
    console.log(type)
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>
        );
      case 'danger':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>
        );
      case 'information':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
            <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/>
          </svg>
        );
    }
  };

  // Fonction pour obtenir le titre en fonction du type de notification
  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'success':
        return 'Succès';
      case 'danger':
        return 'Erreur';
      case 'information':
        return 'Information';
      default:
        return 'Notification';
    }
  };

  return (
    <div className="notifications">
      <ul className="notifications-list">
        {Array.isArray(notifications) && notifications.length > 0 ? (
          notifications.map((notification) => (
            <li 
              className={`notifications-list-item ${getNotificationClass(notification.type)} ${removingNotifications ? '' : 'remove'}`} 
              key={notification.id}
            > 
              <div className={`notification-list-item-icon ${getNotificationClass(notification.type)}-icon`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className={`notification-list-item ${getNotificationClass(notification.type)}-content`}>
                <div className={`notification-list-item-title-${getNotificationClass(notification.type)}`}>
                  <span>{getNotificationTitle(notification.type)}</span>
                </div>
                <div className={`notification-list-item-message ${getNotificationClass(notification.type)}`}>
                  {notification.message}
                </div>
              </div>
              <div onClick={() => removeNotification(notification.id)} className={`notification-list-item-icon-close ${getNotificationClass(notification.type)}-close`}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
                </svg>
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
