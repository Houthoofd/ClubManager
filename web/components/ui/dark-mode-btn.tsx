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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2C7.58 2 4 5.58 4 10c0 2.93 1.6 5.5 3.91 7.06-.27-1.1-.41-2.25-.41-3.44 0-4.97 4.03-9 9-9 1.19 0 2.32.25 3.33.7A7.96 7.96 0 0 0 12 2z" />
        </svg>
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
