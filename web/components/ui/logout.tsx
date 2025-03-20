import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';  // Utilisation de useNavigate pour la redirection

const LogOutButton = () => {
  const navigate = useNavigate();
  const darkMode = useSelector((state: any) => state.settings.darkMode);
  const left_navbar = useSelector((state: any) => state.navigation.right_navbar);

  const handleClick = () => {
    // Vider le localStorage
    localStorage.clear();

    // Rediriger vers la page de connexion
    window.location.href = '/pages/connexion';
  };

  return (
    <div 
      className={`logout-btn-${darkMode ? 'light' : 'dark'} ${left_navbar ? 'open' : 'close'}`} 
      onClick={handleClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
    </div>
  );
};

export default LogOutButton;
