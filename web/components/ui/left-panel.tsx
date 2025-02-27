import React from 'react';
import { useSelector } from 'react-redux';
import useNotifications from '../../hooks/useNotifications';  // Import du hook personnalisé pour les notifications
import useDarkMode from '../../hooks/useSettings';  // Import du hook personnalisé pour le mode sombre
import useNavbar from '../../hooks/useNavigation';
import DarkModeButton from './dark-mode-btn';

const LeftPanel = () => {
  const { settings} = useDarkMode();  // Utilisation du hook pour le mode sombre
  const { navigation} = useNavbar();  // Utilisation du hook pour le navbar

  const notificationsState = useSelector((state: any) => state.notifications);

  return (
    <div className={`left-panel-${settings.darkMode ? 'dark' : 'light'} ${navigation.left_navbar ? 'open' : 'close'}`}>

      <DarkModeButton />

    </div>
  );
};

export default LeftPanel;
