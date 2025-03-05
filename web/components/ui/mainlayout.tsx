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
            <Link to="/pages/messages">
              <MessageIcon />
            </Link>
          </ul>
        </nav>
      </header>

      <div className={`content ${isLeftNavbarOpen ? 'left-panel-open' : 'left-panel-close'} ${isRightNavbarOpen ? 'right-panel-open' : 'right-panel-close'}`}>
        <nav className={`navigation-left-panel ${isLeftNavbarOpen ? 'open' : 'close'} ${isDarkMode ? 'light' : 'dark'}`}>
          <ul>
            <li><Link to="/pages/cours">Cours</Link></li>
            <li><Link to="/pages/dashboard">Dashboard</Link></li>
          </ul>
          <ul>
            <DarkModeButton />
          </ul>
        </nav>

        {/* Affichage des composants enfants */}
        <div className="main-content">
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
