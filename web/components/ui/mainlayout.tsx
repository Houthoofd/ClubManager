import React, { ReactNode, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from '../ui/notification-bell';
import { RightExpandButton, LeftExpandButton } from '../ui/expanse-btn';
import MessageIcon from '../ui/message-icon';
import { useDispatch, useSelector } from 'react-redux';
import DarkModeButton from '../ui/dark-mode-btn';
import LogOutButton from '../ui/logout';
import NotificationList from '../ui/notification-list';
import { OPEN_RIGHT_NAVBAR } from '@/redux/actions';
import Modal from '../../components/ui/modal';

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  // État pour stocker les données utilisateur
  const [userData, setUserData] = useState<any | null>(null);

  // Récupérer les données du localStorage au montage du composant
  useEffect(() => {
    const storedData = localStorage.getItem("userData");
    console.log(storedData)

    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setUserData(parsedData.data); // Stocker les données dans l'état
    } else {
      setModalMessage("Veuillez vous connecter afin d'accèder à l'application");
      setShowModal(true);
    }
  }, []); // Cette fonction s'exécute seulement au montage

  const dispatch = useDispatch();

  const isLeftNavbarOpen = useSelector((state: any) => state.navigation.left_navbar);
  const isRightNavbarOpen = useSelector((state: any) => state.navigation.right_navbar);
  const isRightHeaderPanelOpen = useSelector((state: any) => state.navigation.header_right_panel);
  const isDarkMode = useSelector((state: any) => state.settings.darkMode);
  const notificationsCount = useSelector((state: any) => state.notifications.notifications.length);
  const [isSelected, setIsSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>('');

  useEffect(() => {
    // Lorsque le nombre de notifications change, on met à jour l'état de la barre de navigation droite
    dispatch(OPEN_RIGHT_NAVBAR(notificationsCount > 0));  // Ouvre la barre de navigation droite si des notifications existent
  }, [notificationsCount, dispatch]);

  const handleSelection = (item: string): void => {
    if (item === 'cours' || item === 'dashboard') {
      setIsSelected(item);
    } else {
      setIsSelected(null);
    }
  };

  const ReduceFullName = (firstName: string | string[], lastName?: string) => {
    if (!firstName || !lastName) {
      // Si prenom ou nom sont manquants, on retourne un caractère par défaut
      return firstName ? lastName?.charAt(0).toUpperCase() : '';
    }
    // Si on reçoit un tableau (nom complet), on le divise
    if (Array.isArray(firstName)) {
      const [first, last] = firstName;
      const firstInitial = first.charAt(0).toUpperCase();
      const lastInitial = last.charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    }
  
    // Si on reçoit deux chaînes (prénom et nom séparés)
    if (lastName) {
      const firstInitial = firstName.charAt(0).toUpperCase();
      const lastInitial = lastName.charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    }
  
    // Si on reçoit une seule chaîne avec un prénom et un nom
    const nameParts = firstName.split(' ');
    if (nameParts.length >= 2) {
      const firstInitial = nameParts[0].charAt(0).toUpperCase();
      const lastInitial = nameParts[1].charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    }
  
    // Sinon, on retourne simplement la première initiale
    return firstName.charAt(0).toUpperCase();
  };
  

  return (
    <div className={`layout ${isDarkMode ? 'light' : 'dark'}`}>
      <header className={`header ${isLeftNavbarOpen ? 'left-header-open' : 'left-header-close'} ${isRightHeaderPanelOpen ? 'right-header-open' : 'right-header-close'} ${isDarkMode ? 'light' : 'dark'}`}>
        <div className={`layer ${isDarkMode ? 'light' : 'dark'}`}>
          <div className={`layer-icon-text-${isLeftNavbarOpen ? 'full' : 'initial'}`}>
            {/* Affichage du prénom et nom si les données sont disponibles */}
            {isLeftNavbarOpen ? `${userData?.prenom} ${userData?.nom}` : ReduceFullName(userData?.prenom,userData?.nom)}
          </div>
          <LeftExpandButton />
        </div>
        <div className='header-content'></div>
        <nav className={`header-right-navbar ${isDarkMode ? 'light' : 'dark'}`}>
          <RightExpandButton />
          <ul>
            <NotificationBell />
            <Link className={`${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/messages">
              <MessageIcon />
            </Link>
            <DarkModeButton />
            <LogOutButton />
          </ul>
        </nav>
      </header>

      <div className={`content ${isLeftNavbarOpen ? 'left-panel-open' : 'left-panel-close'} ${isRightNavbarOpen ? 'right-panel-open' : 'right-panel-close'}`}>
        <nav className={`navigation-left-panel ${isLeftNavbarOpen ? 'open' : 'close'} ${isDarkMode ? 'light' : 'dark'}`}>
          <ul className={`${isLeftNavbarOpen ? 'open' : 'close'}`}>
            <li className={`menu-list-item ${isLeftNavbarOpen ? 'open' : 'close'}`}>
              <Link className={`menu-list-item-link ${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/cours">
                <div className={`menu-list-item-icon ${isLeftNavbarOpen ? 'open' : 'close'} ${isSelected === 'cours' ? 'selected' : ''}`} onClick={() => handleSelection('cours')}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                    <path d="M840-280v-276L480-360 40-600l440-240 440 240v320h-80ZM480-120 200-272v-200l280 152 280-152v200L480-120Z" />
                  </svg>
                </div>
                <div className={`menu-list-item-text ${isLeftNavbarOpen ? 'open' : 'close'}`}>Cours</div>
              </Link>
            </li>
            <li className={`menu-list-item ${isLeftNavbarOpen ? 'open' : 'close'}`}>
              <Link className={`menu-list-item-link ${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/dashboard">
                <div className={`menu-list-item-icon ${isLeftNavbarOpen ? 'open' : 'close'} ${isSelected === 'dashboard' ? 'selected' : ''}`} onClick={() => handleSelection('dashboard')}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
                    <path d="M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Z" />
                  </svg>
                </div>
                <div className={`menu-list-item-text ${isLeftNavbarOpen ? 'open' : 'close'}`}>Dashboard</div>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Affichage des composants enfants */}
        <div className={`main-content ${isDarkMode ? 'light' : 'dark'}`}>
          {children}
        </div>

        <div className={`right-panel-content ${isRightNavbarOpen ? 'open' : 'close'} ${isDarkMode ? 'light' : 'dark'}`}>
          <NotificationList />
        </div>
      </div>
      <Modal
        showModal={showModal}
        setShowModal={setShowModal}
        message={modalMessage}
        title="Notification"
        redirectUrl="/pages/connexion" // Exemple de redirection avec '/pages'
      />
    </div>
  );
};

export default MainLayout;
