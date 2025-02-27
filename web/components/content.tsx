import LeftPanel from './ui/left-panel';
import RightPanel from './ui/right-panel';
import React from 'react';
import { useSelector } from 'react-redux';
import useNotifications from '../hooks/useNotifications';  // Import du hook personnalisé pour les notifications
import useDarkMode from '../hooks/useSettings';  // Import du hook personnalisé pour le mode sombre
import useNavbar from '../hooks/useNavigation';

const Content = () => {
  const { settings, handleToggleDarkMode } = useDarkMode();  // Utilisation du hook pour le mode sombre
  const { handleAddNotification, handleRemoveNotification } = useNotifications();  // Utilisation du hook pour les notifications
  const { navigation } = useNavbar();  // Utilisation du hook pour le navbar

  const isRightOpen = useSelector((state: any) => state.navigation.right_navbar);
  const isLeftOpen = useSelector((state: any) => state.navigation.left_navbar);
  const darkMode = useSelector((state: any) => state.settings.darkMode);

  const notificationsState = useSelector((state: any) => state.notifications);
  return (
    <div className={`content-app-${darkMode ? 'dark' : 'light'} ${isLeftOpen ? 'open-left' : 'close-left'} ${isRightOpen ? 'open-right' : 'close-right'}`}>
      <LeftPanel />
        <div className='content'></div>
      <RightPanel />
    </div>
  );
};

export default Content;

