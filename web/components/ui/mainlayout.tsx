import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from '../ui/notification-bell';
import { RightExpandButton, LeftExpandButton } from '../ui/expanse-btn';

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

        </div>
        <nav className='header-right-navbar'>
          <ul>
            <RightExpandButton />
            <NotificationBell />
            <li><Link to="/pages/messages">Messages</Link></li>
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
      </div>
    </div>
  );
};

export default MainLayout;
