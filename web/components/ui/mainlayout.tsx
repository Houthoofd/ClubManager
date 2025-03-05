import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from '../ui/notification-bell';
import { RightExpandButton, LeftExpandButton } from '../ui/expanse-btn';
import MessageIcon from '../ui/message-icon';

interface MainLayoutProps {
  children?: ReactNode;  // Spécifie que children est attendu ici
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="layout">
      <header>
        <div className='layer'>
          <LeftExpandButton />
        </div>
        <div className='header-content'>
          {/* Contenu supplémentaire pour le header ici */}
        </div>
        <nav className='header-right-navbar'>
          <ul>
            <RightExpandButton />
            <NotificationBell />
            <Link to="/pages/messages">
              <MessageIcon />
            </Link>
          </ul>
        </nav>
      </header>

      <div className="content">
        <nav className='navigation-left-panel'>
          <ul>
            <li><Link to="/pages/cours">Cours</Link></li>
            <li><Link to="/pages/dashboard">Dashboard</Link></li>
          </ul>
        </nav>

        {/* Ici on affiche les composants enfants */}
        <div className="main-content">
          {children}
        </div>

        <div className="right-panel-content">
          {/* Contenu supplémentaire pour le panneau droit ici */}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
