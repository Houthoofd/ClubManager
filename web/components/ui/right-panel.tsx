import React from 'react';
import { useSelector } from 'react-redux';
import useNotifications from '../../hooks/useNotifications';
import useDarkMode from '../../hooks/useSettings';  // Import du hook personnalisé pour le mode sombre
import useNavbar from '../../hooks/useNavigation';

const RightPanel = () => {
  const { settings } = useDarkMode();  // Utilisation du hook pour le mode sombre
  const { handleRemoveNotification } = useNotifications(); // Utilisation du hook pour les notifications
  const { navigation } = useNavbar();  // Utilisation du hook pour le navbar
  const isRightOpen = useSelector((state: any) => state.navigation.right_navbar);

  const notificationsState = useSelector((state: any) => state.notifications);

  return (
    <div className={`right-panel-${settings.darkMode ? 'dark' : 'light'} ${isRightOpen ? 'open' : 'close'}`}>
      <div>
        {notificationsState?.notifications?.map((notification: any) => (
          <div key={notification.id}>
            <p>{notification.message}</p>
            <button onClick={() => handleRemoveNotification(notification.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RightPanel;
