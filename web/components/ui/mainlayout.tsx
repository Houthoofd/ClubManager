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
import Breadcrumb from '../../components/ui/breadcrumb';
import DropdownMenu from '../../components/ui/dropdown-menu'
import ExpandMenu from '../ui/expand-menu';

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
  const isMainRightSidePanelOpen = useSelector((state: any) => state.navigation.main_content_right_panel);
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
    if (item === 'cours' || item === 'dashboard' || item === 'account' || item === 'chat' || item === 'paiement' || item === 'store' || item === 'settings' || item === 'utilisateurs') {
      console.log(item)
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
        <div className='header-content'>
          <div className='header-content-btn'>
            <RightExpandButton />
          </div>
        </div>
        <nav className={`header-right-navbar ${isDarkMode ? 'light' : 'dark'}`}>
        <ul className={`${isRightHeaderPanelOpen ? 'right-header-open' : 'right-header-close'}`}>
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
            <li className={`menu-list-item ${isLeftNavbarOpen ? 'open' : 'close'}`}>
              <Link className={`menu-list-item-link ${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/utilisateurs">
                <div className={`menu-list-item-icon ${isLeftNavbarOpen ? 'open' : 'close'} ${isSelected === 'cours' ? 'selected' : ''}`} onClick={() => handleSelection('utilisateurs')}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M80-160v-112q0-34 17-62.5t47-43.5q60-30 124.5-46T400-440q25 0 50 3.5t50 8.5v63q-45 22-72.5 58T400-213v53H80Zm400 0v-56q0-24 12.5-44.5T528-290q36-15 74.5-22.5T680-320q39 0 77.5 7.5T832-290q23 9 35.5 29.5T880-216v56H480Zm200-200q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM400-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Z"/></svg>
                </div>
                <div className={`menu-list-item-text ${isLeftNavbarOpen ? 'open' : 'close'}`}>Utilisateurs</div>
              </Link>
            </li>
            <li className={`menu-list-item ${isLeftNavbarOpen ? 'open' : 'close'}`}>
              <Link className={`menu-list-item-link ${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/compte">
                <div className={`menu-list-item-icon ${isLeftNavbarOpen ? 'open' : 'close'} ${isSelected === 'cours' ? 'selected' : ''}`} onClick={() => handleSelection('account')}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="m640-120-12-60q-12-5-22.5-10.5T584-204l-58 18-40-68 46-40q-2-14-2-26t2-26l-46-40 40-68 58 18q11-8 21.5-13.5T628-460l12-60h80l12 60q12 5 22.5 11t21.5 15l58-20 40 70-46 40q2 12 2 25t-2 25l46 40-40 68-58-18q-11 8-21.5 13.5T732-180l-12 60h-80ZM80-160v-112q0-33 17-62t47-44q51-26 115-44t141-18h14q6 0 12 2-29 72-24 143t48 135H80Zm600-80q33 0 56.5-23.5T760-320q0-33-23.5-56.5T680-400q-33 0-56.5 23.5T600-320q0 33 23.5 56.5T680-240ZM400-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Z"/></svg>
                </div>
                <div className={`menu-list-item-text ${isLeftNavbarOpen ? 'open' : 'close'}`}>Compte</div>
              </Link>
            </li>
            <li className={`menu-list-item ${isLeftNavbarOpen ? 'open' : 'close'}`}>
              <Link className={`menu-list-item-link ${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/chat">
                <div className={`menu-list-item-icon ${isLeftNavbarOpen ? 'open' : 'close'} ${isSelected === 'cours' ? 'selected' : ''}`} onClick={() => handleSelection('chat')}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm160-320h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80Z"/></svg>
                </div>
                <div className={`menu-list-item-text ${isLeftNavbarOpen ? 'open' : 'close'}`}>Chat</div>
              </Link>
            </li>
            <li className={`menu-list-item ${isLeftNavbarOpen ? 'open' : 'close'}`}>
              <Link className={`menu-list-item-link ${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/paiements">
                <div className={`menu-list-item-icon ${isLeftNavbarOpen ? 'open' : 'close'} ${isSelected === 'cours' ? 'selected' : ''}`} onClick={() => handleSelection('paiements')}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M120-160q-33 0-56.5-23.5T40-240v-440h80v440h680v80H120Zm160-160q-33 0-56.5-23.5T200-400v-320q0-33 23.5-56.5T280-800h560q33 0 56.5 23.5T920-720v320q0 33-23.5 56.5T840-320H280Zm80-80q0-33-23.5-56.5T280-480v80h80Zm400 0h80v-80q-33 0-56.5 23.5T760-400Zm-200-40q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM280-640q33 0 56.5-23.5T360-720h-80v80Zm560 0v-80h-80q0 33 23.5 56.5T840-640Z"/></svg>
                </div>
                <div className={`menu-list-item-text ${isLeftNavbarOpen ? 'open' : 'close'}`}>Paiements</div>
              </Link>
            </li>
            <li className={`menu-list-item ${isLeftNavbarOpen ? 'open' : 'close'}`}>
              <Link className={`menu-list-item-link ${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/magasin">
                <div className={`menu-list-item-icon ${isLeftNavbarOpen ? 'open' : 'close'} ${isSelected === 'cours' ? 'selected' : ''}`} onClick={() => handleSelection('store')}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M841-518v318q0 33-23.5 56.5T761-120H201q-33 0-56.5-23.5T121-200v-318q-23-21-35.5-54t-.5-72l42-136q8-26 28.5-43t47.5-17h556q27 0 47 16.5t29 43.5l42 136q12 39-.5 71T841-518Zm-272-42q27 0 41-18.5t11-41.5l-22-140h-78v148q0 21 14 36.5t34 15.5Zm-180 0q23 0 37.5-15.5T441-612v-148h-78l-22 140q-4 24 10.5 42t37.5 18Zm-178 0q18 0 31.5-13t16.5-33l22-154h-78l-40 134q-6 20 6.5 43t41.5 23Zm540 0q29 0 42-23t6-43l-42-134h-76l22 154q3 20 16.5 33t31.5 13Z"/></svg>
                </div>
                <div className={`menu-list-item-text ${isLeftNavbarOpen ? 'open' : 'close'}`}>Magasin</div>
              </Link>
            </li>
            <ExpandMenu
              icon={<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M841-518v318q0 33-23.5 56.5T761-120H201q-33 0-56.5-23.5T121-200v-318q-23-21-35.5-54t-.5-72l42-136q8-26 28.5-43t47.5-17h556q27 0 47 16.5t29 43.5l42 136q12 39-.5 71T841-518Zm-272-42q27 0 41-18.5t11-41.5l-22-140h-78v148q0 21 14 36.5t34 15.5Zm-180 0q23 0 37.5-15.5T441-612v-148h-78l-22 140q-4 24 10.5 42t37.5 18Zm-178 0q18 0 31.5-13t16.5-33l22-154h-78l-40 134q-6 20 6.5 43t41.5 23Zm540 0q29 0 42-23t6-43l-42-134h-76l22 154q3 20 16.5 33t31.5 13Z"/></svg>}
              text="Catégories"
              subTitles={["Articles", "Ajouter un article"]}
              listUrls={["/pages/magasin/articles", "/pages/magasin/ajouter_article"]}
            />
          </ul>
          <ul className={`${isLeftNavbarOpen ? 'open' : 'close'}`}>
            <li className={`menu-list-item ${isLeftNavbarOpen ? 'open' : 'close'}`}>
              <Link className={`menu-list-item-link ${isLeftNavbarOpen ? 'open' : 'close'}`} to="/pages/settings">
                <div className={`menu-list-item-icon ${isLeftNavbarOpen ? 'open' : 'close'} ${isSelected === 'cours' ? 'selected' : ''}`} onClick={() => handleSelection('settings')}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm112-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Z"/></svg>
                </div>
                <div className={`menu-list-item-text ${isLeftNavbarOpen ? 'open' : 'close'}`}>Settings</div>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Affichage des composants enfants */}
        <div className={`main-content ${isDarkMode ? 'light' : 'dark'} ${isMainRightSidePanelOpen ? 'right-side-panel-close' : 'right-side-panel-open'}`}>
          <div className={`content ${isDarkMode ? 'light' : 'dark'} ${isMainRightSidePanelOpen ? 'right-side-panel-close' : 'right-side-panel-open'}`}>
            <Breadcrumb />
            {children}
          </div>
          <div className='main-right-side-panel'></div>
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
