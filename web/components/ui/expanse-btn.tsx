import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { OPEN_LEFT_NAVBAR, OPEN_RIGHT_HEADER_PANEL } from '../../redux/actions';
import useDarkMode from '../../hooks/useSettings';  // Hook pour le mode sombre
import useNavbar from '../../hooks/useNavigation';  // Hook pour la navigation

// Composant pour gérer le panneau gauche
const LeftExpandButton = () => {
  const dispatch = useDispatch();
  const { settings } = useDarkMode();
  const { navigation } = useNavbar();
  const isLeftPanelOpen = navigation.left_navbar;

  const handleLeftClick = () => {
    dispatch(OPEN_LEFT_NAVBAR());  // Ouvrir/fermer le panneau gauche uniquement
  };

  return (
    <div
      className={`expand-btn-${settings.darkMode ? 'dark' : 'light'} ${isLeftPanelOpen ? 'open-left' : 'close-left'}`}
      onClick={handleLeftClick}
    >
      {isLeftPanelOpen ? (
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
          <path d="M15 18l-6-6 6-6" />
        </svg>
      ) : (
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
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </div>
  );
};

// Composant pour gérer le panneau droit
const RightExpandButton = () => {
  const dispatch = useDispatch();
  const { settings } = useDarkMode();
  const { navigation } = useNavbar();
  const isRightPanelOpen = navigation.header_right_panel;

  console.log(isRightPanelOpen)

  const handleRightClick = () => {
    console.log("handle right clock")
    dispatch(OPEN_RIGHT_HEADER_PANEL());  // Ouvrir/fermer le panneau droit uniquement
  };

  return (
    <div
      className={`expand-btn-${settings.darkMode ? 'dark' : 'light'} ${isRightPanelOpen ? 'open-right' : 'close-right'}`}
      onClick={handleRightClick}
    >
      {isRightPanelOpen ? (
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
          <path d="M15 18l-6-6 6-6" />
        </svg>
      ) : (
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
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </div>
  );
};

export { LeftExpandButton, RightExpandButton };
