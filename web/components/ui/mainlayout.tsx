import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from '../ui/notification-bell';
import { RightExpandButton, LeftExpandButton } from '../ui/expanse-btn';
import MessageIcon from '../ui/message-icon';
import { useDispatch, useSelector } from 'react-redux';
 

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const dispatch = useDispatch();

  // Utilisation des selectors pour récupérer les états de navigation
  const isLeftNavbarOpen = useSelector((state: any) => state.navigation.left_navbar);
  const isRightNavbarOpen = useSelector((state: any) => state.navigation.right_navbar);
  const isRightHeaderPanelOpen = useSelector((state: any) => state.navigation.header_right_panel);

  console.log({isLeftNavbarOpen: isLeftNavbarOpen, isRightNavbarOpen: isRightNavbarOpen, isRightHeaderPanelOpen: isRightHeaderPanelOpen})

  return (
    <div className='layout'>
      <header className={`header ${isLeftNavbarOpen ? 'left-navbar-open' : 'left-navbar-close'} ${isRightHeaderPanelOpen ? 'right-header-open' : 'right-header-close'}`}>
        <div className='layer'>
          <LeftExpandButton /> {/* Bascule du navbar gauche */}
        </div>
        <div className='header-content'>
          {/* Contenu supplémentaire pour le header ici */}
        </div>
        <nav className='header-right-navbar'>
          <ul>
            <RightExpandButton /> {/* Bascule du navbar droit */}
            <NotificationBell />
            <Link to="/pages/messages">
              <MessageIcon />
            </Link>
          </ul>
        </nav>
      </header>

      <div className={`content ${isLeftNavbarOpen ? 'left-navbar-open' : 'left-navbar-close'} ${isRightHeaderPanelOpen ? 'right-navbar-open' : 'right-navbar-close'}`}>
        <nav className={`navigation-left-panel ${isLeftNavbarOpen ? 'open' : ''}`}>
          <ul>
            <li><Link to="/pages/cours">Cours</Link></li>
            <li><Link to="/pages/dashboard">Dashboard</Link></li>
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
