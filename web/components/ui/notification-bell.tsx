import React, {useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { OPEN_RIGHT_NAVBAR } from '../../redux/actions/navigationActions';
import { ADD_NOTIFICATION } from '../../redux/actions/notificationsActions';



const NotificationBell = () => {
  const dispatch = useDispatch();
  // État pour gérer si les notifications sont lues
  const [notificationsRead, setNotificationsRead] = useState(false);
  
  // État pour ajouter une classe CSS qui modifie l'affichage
  const [bellClass, setBellClass] = useState('');  // Classe initiale vide
  const notificationsState = useSelector((state: any) => state.notifications);
  const notificationCount = notificationsState?.notifications?.length || 0;
  const darkMode = useSelector((state: any) => state.settings.darkMode);

  const isRightOpen = useSelector((state: any) => state.navigation.right_navbar);

  const notificationTypes = ['success', 'danger', 'information'] as const; // Liste des types de notifications

  

  const handleClick = () => {
    console.log("right-navbar" + isRightOpen)
    console.log('Current navbar state:', isRightOpen);
    const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    // Bascule l'état du panneau droit
    dispatch(OPEN_RIGHT_NAVBAR());
    // Ajoute une nouvelle notification
    dispatch(
      ADD_NOTIFICATION({
        id: Date.now(),
        message: `New ${randomType} notification randomly generated`, // Message personnalisé selon le type
        visibility: 'public',
        type: randomType
      })
    );

    // Marquer les notifications comme lues
    setNotificationsRead(true);

    // Modifier la classe CSS pour la cloche lorsque cliquée
    setBellClass('clicked');  // Remplacez par la classe de votre choix
  };

  return (
    <div className={`notification-bell-${darkMode ? 'light' : 'dark'} ${bellClass}`} onClick={handleClick}>
      <svg
        className="bell-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.63 5.36 6 7.92 6 11v5l-1.7 1.7a1 1 0 00.7 1.7h14a1 1 0 00.7-1.7L18 16z" />
      </svg>
      {notificationCount > 0 && (
        <span className={`notification-bell-${darkMode ? 'light' : 'dark'}`}>{notificationCount}</span>
      )}
    </div>
  );
  
};

export default NotificationBell;
