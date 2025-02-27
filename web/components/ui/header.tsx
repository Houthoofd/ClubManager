import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import useNavbar from '../../hooks/useNavigation';  // Hook pour gérer la navigation
import NotificationBell from './notification-bell';
import MessageIcon from './message-icon';
import {LeftExpandButton, RightExpandButton} from './expanse-btn';

const Header = () => {
  const isLeftOpen = useSelector((state: any) => state.navigation.left_navbar);
  const isRightOpen = useSelector((state: any) => state.navigation.header_right_panel);
  const darkMode = useSelector((state: any) => state.settings.darkMode);

  console.log(isRightOpen)


  return (
    <div className={`header-${darkMode ? 'dark' : 'light'} ${isLeftOpen ? 'open-left' : 'close-left'} ${isRightOpen ? 'open-right' : 'close-right'}`}>
      <div className={`header-panel-info-user ${isLeftOpen ? 'open' : 'close'}`}>
        <LeftExpandButton/> {/* Bouton pour le panneau de gauche */}
      </div>
      <div className="header-center-panel">
        {/* Contenu central */}
      </div>
      <div className={`header-panel-user-panel ${darkMode ? 'dark' : 'light'} ${isRightOpen ? 'open' : 'close'}`}>
        <div className='header-panel-user-panel-icon'>
          <RightExpandButton /> {/* Bouton pour le panneau de droite */}
          <MessageIcon />
          <NotificationBell />
        </div>
      </div>
    </div>
  );
};

export default Header;
