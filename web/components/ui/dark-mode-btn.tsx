import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TOGGLE_DARK_MODE } from '../../redux/actions';
import useDarkMode from '../../hooks/useSettings';  // Import du hook personnalisé pour le mode sombre
import useNavbar from '../../hooks/useNavigation'; // Assure-toi d'importer la bonne action

const DarkModeButton = () => {
  const dispatch = useDispatch();
  const darkMode = useSelector((state: any) => state.settings.darkMode);
  const { settings} = useDarkMode();  // Utilisation du hook pour le mode sombre
  const { navigation} = useNavbar(); // Récupère l'état du mode sombre

  const handleClick = () => {
    dispatch(TOGGLE_DARK_MODE()); // Déclenche l'action pour activer/désactiver le mode sombre
  };

  return (
    <div className={`dark-mode-btn-${darkMode ? 'light' : 'dark'} ${navigation.left_navbar ? 'open' : 'close'}`} onClick={handleClick}>
      {darkMode ? (
        // Nouveau SVG pour la lune (mode sombre activé)
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z"/></svg>
      ) : (
        // SVG pour le soleil (mode clair activé)
        <svg
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
          <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" />
        </svg>
      )}
    </div>
  );
};

export default DarkModeButton;
