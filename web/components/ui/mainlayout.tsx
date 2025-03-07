import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from '../ui/notification-bell';
import { RightExpandButton, LeftExpandButton } from '../ui/expanse-btn';
import MessageIcon from '../ui/message-icon';
import { useDispatch, useSelector } from 'react-redux';
import DarkModeButton from '../ui/dark-mode-btn';

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const dispatch = useDispatch();

  // Utilisation des selectors pour récupérer les états de navigation
  const isLeftNavbarOpen = useSelector((state: any) => state.navigation.left_navbar);
  const isRightNavbarOpen = useSelector((state: any) => state.navigation.right_navbar);
  const isRightHeaderPanelOpen = useSelector((state: any) => state.navigation.header_right_panel);
  const isDarkMode = useSelector((state:any) => state.settings.darkMode);

  console.log({isLeftNavbarOpen: isLeftNavbarOpen, isRightNavbarOpen: isRightNavbarOpen, isRightHeaderPanelOpen: isRightHeaderPanelOpen, isDarkMode: isDarkMode})


  return (
    <div className={`layout ${isDarkMode ? 'light' : 'dark'}`}>
      <header className={`header ${isLeftNavbarOpen ? 'left-header-open' : 'left-header-close'} ${isRightHeaderPanelOpen ? 'right-header-open' : 'right-header-close'} ${isDarkMode ? 'light' : 'dark'}`}>
        <div className={`layer ${isDarkMode ? 'light' : 'dark'}`}>
          <LeftExpandButton />
        </div>
        <div className='header-content'>

        </div>
        <nav className={`header-right-navbar ${isDarkMode ? 'light': 'dark'}`}>
          <ul>
            <RightExpandButton />
            <NotificationBell />
            <Link className={`${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/messages">
              <MessageIcon />
            </Link>
            <DarkModeButton />
          </ul>
        </nav>
      </header>

      <div className={`content ${isLeftNavbarOpen ? 'left-panel-open' : 'left-panel-close'} ${isRightNavbarOpen ? 'right-panel-open' : 'right-panel-close'}`}>
        <nav className={`navigation-left-panel ${isLeftNavbarOpen ? 'open' : 'close'} ${isDarkMode ? 'light' : 'dark'}`}>
          <ul className={`${isLeftNavbarOpen ? 'open' : 'close'}`}>
            <li className={`menu-list-item ${isLeftNavbarOpen ? 'open' : 'close'}`}>
              <Link className={`menu-list-item-link ${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/cours">
                <div className={`menu-list-item-icon ${isLeftNavbarOpen ? 'open' : 'close'}`}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M840-280v-276L480-360 40-600l440-240 440 240v320h-80ZM480-120 200-272v-200l280 152 280-152v200L480-120Z"/></svg></div>
                <div className={`menu-list-item-text ${isLeftNavbarOpen ? 'open' : 'close'}`}>Cours</div>
              </Link>
            </li>
            <li className={`menu-list-item ${isLeftNavbarOpen ? 'open' : 'close'}`}>
              <Link className={`menu-list-item-link ${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/dashboard">
                <div className={`menu-list-item-icon ${isLeftNavbarOpen ? 'open' : 'close'}`}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Z"/></svg></div>
                <div className={`menu-list-item-text ${isLeftNavbarOpen ? 'open' : 'close'}`}>Dashboard</div>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Affichage des composants enfants */}
        <div className={`main-content ${isDarkMode ? 'light': 'dark'}`}>
          {children}
        </div>

        <div className={`right-panel-content ${isRightNavbarOpen ? 'open' : 'close'}`}>
          {/* Contenu supplémentaire pour le panneau droit ici */}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
